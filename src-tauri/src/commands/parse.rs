use crate::extractors::deb::{DebExtractor, FileInfo};
use crate::extractors::elf::{analyze_elf, analyze_desktop};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseResult {
    pub metadata: crate::extractors::deb::DebianPackageMetadata,
    pub files: Vec<FileInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scripts: Option<crate::extractors::deb::Scripts>,
    #[serde(rename = "controlFiles")]
    pub control_files: crate::extractors::deb::ControlFiles,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "elfInfo")]
    pub elf_info: Option<std::collections::HashMap<String, crate::extractors::elf::ELFInfo>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "desktopInfo")]
    pub desktop_info: Option<std::collections::HashMap<String, std::collections::HashMap<String, String>>>,
    pub stats: ParseStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseStats {
    #[serde(rename = "parseTime")]
    pub parse_time: u64,
    #[serde(rename = "originalSize")]
    pub original_size: u64,
    #[serde(rename = "extractedSize")]
    pub extracted_size: u64,
    #[serde(rename = "fileCount")]
    pub file_count: usize,
    #[serde(rename = "elfCount")]
    pub elf_count: usize,
    #[serde(rename = "desktopCount")]
    pub desktop_count: usize,
}

#[tauri::command]
pub async fn parse_deb_package(file_path: String) -> Result<ParseResult, String> {
    let start_time = std::time::Instant::now();

    // Validate file extension
    let path = Path::new(&file_path);
    if let Some(ext) = path.extension() {
        let ext_lower = ext.to_string_lossy().to_lowercase();
        if ext_lower != "deb" && ext_lower != "udeb" {
            return Err(format!(
                "Invalid file type. Only .deb and .udeb files are supported"
            ));
        }
    } else {
        return Err("Invalid file path".to_string());
    }

    // Validate file exists
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    // Get file size
    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;
    let original_size = metadata.len();

    // Validate file size (max 500MB)
    const MAX_SIZE: u64 = 500 * 1024 * 1024;
    if original_size > MAX_SIZE {
        return Err(format!(
            "File size exceeds {}MB limit",
            MAX_SIZE / (1024 * 1024)
        ));
    }

    // Create temp directory
    let temp_dir = std::env::temp_dir().join(format!("viewdeb_{}", uuid::get_uuid()));
    fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;

    // Ensure temp directory is cleaned up
    let temp_dir_str = temp_dir.to_string_lossy().to_string();
    let _cleanup_guard = CleanupGuard {
        path: temp_dir.clone(),
    };

    // Extract package
    DebExtractor::extract(&temp_dir_str, &file_path)
        .map_err(|e| format!("Extract failed: {}", e))?;

    let extract_path = temp_dir.join("extracted");
    let control_path = temp_dir.join("control");

    // Parse metadata
    let metadata = DebExtractor::parse_metadata(&control_path)?;

    // List files
    let files = DebExtractor::list_files(&extract_path)?;

    // Parse scripts
    let scripts = DebExtractor::parse_scripts(&extract_path).ok();

    // Read control files
    let control_files = DebExtractor::read_control_files(&extract_path, &control_path)?;

    // Analyze ELF files (limit to first 20)
    let elf_files: Vec<_> = files
        .iter()
        .filter(|f| f.is_elf)
        .take(20)
        .collect();

    let mut elf_info = std::collections::HashMap::new();
    for file in elf_files {
        let full_path = extract_path.join(&file.path);
        if let Ok(info) = analyze_elf(full_path.to_str().unwrap()) {
            elf_info.insert(file.path.clone(), info);
        }
    }

    // Analyze desktop files
    let desktop_files: Vec<_> = files
        .iter()
        .filter(|f| f.is_desktop)
        .collect();

    let mut desktop_info = std::collections::HashMap::new();
    for file in desktop_files {
        let full_path = extract_path.join(&file.path);
        if let Ok(info) = analyze_desktop(full_path.to_str().unwrap()) {
            desktop_info.insert(file.path.clone(), info);
        }
    }

    // Calculate extracted size
    let extracted_size = files
        .iter()
        .filter(|f| f.file_type != crate::extractors::deb::FileType::Directory)
        .map(|f| f.size)
        .sum::<u64>();

    let elf_count = files.iter().filter(|f| f.is_elf).count();
    let desktop_count = files.iter().filter(|f| f.is_desktop).count();
    let file_count = files.len();
    let parse_time = start_time.elapsed().as_millis() as u64;

    Ok(ParseResult {
        metadata,
        files,
        scripts,
        control_files,
        elf_info: if elf_info.is_empty() { None } else { Some(elf_info) },
        desktop_info: if desktop_info.is_empty() { None } else { Some(desktop_info) },
        stats: ParseStats {
            parse_time,
            original_size,
            extracted_size,
            file_count,
            elf_count,
            desktop_count,
        },
    })
}

// Simple UUID generator for temp directory names
mod uuid {
    pub fn get_uuid() -> String {
        use std::time::{SystemTime, UNIX_EPOCH};
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        format!("{:x}", timestamp)
    }
}

// RAII guard for cleanup
struct CleanupGuard {
    path: PathBuf,
}

impl Drop for CleanupGuard {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}
