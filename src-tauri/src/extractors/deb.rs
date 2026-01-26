use crate::utils::shell::exec_command;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Read;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebianPackageMetadata {
    #[serde(rename = "Package")]
    pub package: String,
    #[serde(rename = "Version")]
    pub version: String,
    #[serde(rename = "Architecture")]
    pub architecture: String,
    #[serde(rename = "Maintainer", skip_serializing_if = "Option::is_none")]
    pub maintainer: Option<String>,
    #[serde(rename = "Installed-Size", skip_serializing_if = "Option::is_none")]
    pub installed_size: Option<String>,
    #[serde(rename = "Section", skip_serializing_if = "Option::is_none")]
    pub section: Option<String>,
    #[serde(rename = "Priority", skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,
    #[serde(rename = "Homepage", skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
    #[serde(rename = "Description", skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "Depends", skip_serializing_if = "Option::is_none")]
    pub depends: Option<String>,
    #[serde(rename = "Pre-Depends", skip_serializing_if = "Option::is_none")]
    pub pre_depends: Option<String>,
    #[serde(rename = "Recommends", skip_serializing_if = "Option::is_none")]
    pub recommends: Option<String>,
    #[serde(rename = "Suggests", skip_serializing_if = "Option::is_none")]
    pub suggests: Option<String>,
    #[serde(rename = "Conflicts", skip_serializing_if = "Option::is_none")]
    pub conflicts: Option<String>,
    #[serde(rename = "Breaks", skip_serializing_if = "Option::is_none")]
    pub breaks: Option<String>,
    #[serde(rename = "Replaces", skip_serializing_if = "Option::is_none")]
    pub replaces: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub size: u64,
    #[serde(rename = "mode")]
    pub mode: String,
    pub uid: u32,
    pub gid: u32,
    pub mtime: String,
    #[serde(rename = "type")]
    pub file_type: FileType,
    pub is_elf: bool,
    pub is_desktop: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FileType {
    File,
    Directory,
    Symlink,
    Elf,
    Desktop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Scripts {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preinst: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub postinst: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prerm: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub postrm: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub config: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub templates: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlFiles {
    pub control: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub md5sums: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conffiles: Option<String>,
}

pub struct DebExtractor;

impl DebExtractor {
    /// Extract deb package to temp directory
    pub fn extract(temp_dir: &str, deb_path: &str) -> Result<(), String> {
        let extract_path = PathBuf::from(temp_dir).join("extracted");
        let control_path = PathBuf::from(temp_dir).join("control");

        // Create directories
        fs::create_dir_all(&extract_path)
            .map_err(|e| format!("Failed to create extract directory: {}", e))?;
        fs::create_dir_all(&control_path)
            .map_err(|e| format!("Failed to create control directory: {}", e))?;

        let extract_path_str = extract_path
            .to_str()
            .ok_or("Invalid extract path")?;
        let control_path_str = control_path
            .to_str()
            .ok_or("Invalid control path")?;

        // Extract data files using dpkg -x
        exec_command("dpkg", &["-x", deb_path, extract_path_str], 60000)
            .map_err(|e| format!("Failed to extract package data: {}", e))?;

        // Extract control info using dpkg -e
        exec_command("dpkg", &["-e", deb_path, control_path_str], 30000)
            .map_err(|e| format!("Failed to extract control information: {}", e))?;

        Ok(())
    }

    /// Parse control file to get metadata
    pub fn parse_metadata(control_path: &Path) -> Result<DebianPackageMetadata, String> {
        let control_file = control_path.join("control");
        let content = fs::read_to_string(&control_file)
            .map_err(|e| format!("Failed to read control file: {}", e))?;

        let mut metadata = DebianPackageMetadata {
            package: String::new(),
            version: String::new(),
            architecture: String::new(),
            maintainer: None,
            installed_size: None,
            section: None,
            priority: None,
            homepage: None,
            description: None,
            depends: None,
            pre_depends: None,
            recommends: None,
            suggests: None,
            conflicts: None,
            breaks: None,
            replaces: None,
        };

        let lines: Vec<&str> = content.lines().collect();
        let mut current_key: String = String::new();

        for line in lines {
            let trimmed = line.trim();

            if trimmed.is_empty() {
                current_key.clear();
                continue;
            }

            if line.starts_with(' ') || line.starts_with('\t') {
                // Continuation line
                if !current_key.is_empty() {
                    let continuation = trimmed.trim().to_string();
                    match current_key.as_str() {
                        "Description" => {
                            if let Some(ref mut desc) = metadata.description {
                                desc.push('\n');
                                desc.push_str(&continuation);
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                // New field
                if let Some(colon_pos) = line.find(':') {
                    let key = line[..colon_pos].trim().to_string();
                    let value = line[colon_pos + 1..].trim().to_string();
                    current_key = key.clone();

                    match key.as_str() {
                        "Package" => metadata.package = value,
                        "Version" => metadata.version = value,
                        "Architecture" => metadata.architecture = value,
                        "Maintainer" => metadata.maintainer = Some(value),
                        "Installed-Size" => metadata.installed_size = Some(value),
                        "Section" => metadata.section = Some(value),
                        "Priority" => metadata.priority = Some(value),
                        "Homepage" => metadata.homepage = Some(value),
                        "Description" => metadata.description = Some(value),
                        "Depends" => metadata.depends = Some(value),
                        "Pre-Depends" => metadata.pre_depends = Some(value),
                        "Recommends" => metadata.recommends = Some(value),
                        "Suggests" => metadata.suggests = Some(value),
                        "Conflicts" => metadata.conflicts = Some(value),
                        "Breaks" => metadata.breaks = Some(value),
                        "Replaces" => metadata.replaces = Some(value),
                        _ => {}
                    }
                }
            }
        }

        Ok(metadata)
    }

    /// List all files in the extracted directory
    pub fn list_files(extract_path: &Path) -> Result<Vec<FileInfo>, String> {
        let mut files = Vec::new();

        for entry in WalkDir::new(extract_path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            let relative_path = path
                .strip_prefix(extract_path)
                .map_err(|e| format!("Path error: {}", e))?;

            // Skip the root directory
            if relative_path.as_os_str().is_empty() {
                continue;
            }

            // Skip symlinks
            if entry.path_is_symlink() {
                continue;
            }

            let file_type = entry.file_type();
            let metadata = entry.metadata()
                .map_err(|e| format!("Failed to get metadata: {}", e))?;

            let (ftype, is_elf, is_desktop) = if file_type.is_dir() {
                (FileType::Directory, false, false)
            } else if file_type.is_file() {
                let path_str = relative_path.to_string_lossy().to_string();

                // Fast check: only check ELF for files in common binary locations
                // This avoids opening every file just to check its magic number
                let is_elf = Self::is_likely_elf_file(&path_str);

                // Check if .desktop file
                let is_desktop = path_str.ends_with(".desktop");

                let ftype = if is_elf {
                    FileType::Elf
                } else if is_desktop {
                    FileType::Desktop
                } else {
                    FileType::File
                };

                (ftype, is_elf, is_desktop)
            } else {
                (FileType::File, false, false)
            };

            let mode = format!("{:04o}", metadata.permissions().mode() & 0o7777);

            files.push(FileInfo {
                path: relative_path.to_string_lossy().to_string(),
                size: metadata.len(),
                mode,
                uid: 0, // We'll use simplified values
                gid: 0,
                mtime: metadata.modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_millis().to_string())
                    .unwrap_or_default(),
                file_type: ftype,
                is_elf,
                is_desktop,
            });
        }

        Ok(files)
    }

    /// Check if a file is likely an ELF binary based on path
    /// This is much faster than opening every file to check magic number
    fn is_likely_elf_file(path: &str) -> bool {
        // Files in common binary locations (without leading slash for relative paths)
        let bin_locations = [
            "bin/", "sbin/", "usr/bin/", "usr/sbin/",
            "usr/local/bin/", "usr/local/sbin/",
            "lib/", "lib64/", "usr/lib/", "usr/lib64/",
            "usr/libexec/", "opt/",
        ];

        // Check if path is in a binary location
        for loc in &bin_locations {
            // Check both with and without leading slash
            if path.starts_with(loc) || path.starts_with(&format!("/{}", loc)) {
                // Additional check: should not have a known extension
                // that indicates it's not an ELF file
                let lower = path.to_lowercase();
                if lower.ends_with(".so") || lower.ends_with(".a") ||
                   lower.ends_with(".la") || lower.ends_with(".o") {
                    return true;  // Shared/static libraries are also ELF
                }
                if lower.ends_with(".png") || lower.ends_with(".jpg") ||
                   lower.ends_with(".jpeg") || lower.ends_with(".gif") ||
                   lower.ends_with(".svg") || lower.ends_with(".txt") ||
                   lower.ends_with(".xml") || lower.ends_with(".html") ||
                   lower.ends_with(".css") || lower.ends_with(".js") ||
                   lower.ends_with(".py") || lower.ends_with(".sh") ||
                   lower.ends_with(".desktop") || lower.ends_with(".json") ||
                   lower.ends_with(".conf") || lower.ends_with(".service") {
                    return false;
                }
                return true;
            }
        }

        // Check for common executable names without extensions
        let name = path.rsplit('/').next().unwrap_or("");
        let exec_patterns = ["cc-switch", "app", "runner", "daemon", "server"];
        for pattern in &exec_patterns {
            if name.eq_ignore_ascii_case(pattern) {
                return true;
            }
        }

        false
    }

    /// Parse installation scripts from control directory
    pub fn parse_scripts(extract_path: &Path) -> Result<Scripts, String> {
        // Try to find the control directory
        let control_dir = if let Some(parent) = extract_path.parent() {
            let control = parent.join("control");
            if control.exists() {
                control
            } else {
                extract_path.join("../control")
            }
        } else {
            extract_path.join("../control")
        };

        let script_names = ["preinst", "postinst", "prerm", "postrm", "config", "templates"];
        let mut scripts = Scripts {
            preinst: None,
            postinst: None,
            prerm: None,
            postrm: None,
            config: None,
            templates: None,
        };

        for script_name in script_names {
            let script_path = control_dir.join(script_name);
            if let Ok(content) = fs::read_to_string(&script_path) {
                match script_name {
                    "preinst" => scripts.preinst = Some(content),
                    "postinst" => scripts.postinst = Some(content),
                    "prerm" => scripts.prerm = Some(content),
                    "postrm" => scripts.postrm = Some(content),
                    "config" => scripts.config = Some(content),
                    "templates" => scripts.templates = Some(content),
                    _ => {}
                }
            }
        }

        Ok(scripts)
    }

    /// Read control files
    pub fn read_control_files(extract_path: &Path, control_path: &Path) -> Result<ControlFiles, String> {
        // Read control file
        let control_content = fs::read_to_string(control_path.join("control"))
            .map_err(|e| format!("Failed to read control file: {}", e))?;

        // Read md5sums if exists
        let md5sums = fs::read_to_string(extract_path.join("DEBIAN/md5sums")).ok();

        // Read conffiles if exists
        let conffiles = fs::read_to_string(extract_path.join("DEBIAN/conffiles")).ok();

        Ok(ControlFiles {
            control: control_content,
            md5sums,
            conffiles,
        })
    }

    /// Check if a file is an ELF binary
    fn is_elf_file(path: &Path) -> bool {
        if let Ok(mut file) = fs::File::open(path) {
            let mut buffer = [0u8; 4];
            if file.read_exact(&mut buffer).is_ok() {
                // ELF magic number: 0x7F 'E' 'L' 'F'
                return buffer == [0x7F, 0x45, 0x4C, 0x46];
            }
        }
        false
    }

    /// Calculate directory size
    pub fn calculate_directory_size(dir_path: &Path) -> Result<u64, String> {
        let mut total = 0u64;

        for entry in WalkDir::new(dir_path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() {
                if let Ok(metadata) = entry.metadata() {
                    total += metadata.len();
                }
            }
        }

        Ok(total)
    }
}
