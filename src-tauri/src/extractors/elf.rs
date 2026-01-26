use crate::utils::shell::exec_command_with_env;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ELFInfo {
    #[serde(rename = "type")]
    pub elf_type: String,
    pub machine: String,
    pub entry: String,
    #[serde(default)]
    pub program_headers: Vec<String>,
    #[serde(default)]
    pub section_headers: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dependencies: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interpreter: Option<String>,
}

/// Analyze an ELF file and return detailed information
pub fn analyze_elf(file_path: &str) -> Result<ELFInfo, String> {
    let mut info = ELFInfo {
        elf_type: "unknown".to_string(),
        machine: "unknown".to_string(),
        entry: "0x0".to_string(),
        program_headers: Vec::new(),
        section_headers: Vec::new(),
        dependencies: None,
        interpreter: None,
    };

    // Use LC_ALL=C to ensure consistent English output
    let env_vars = [("LC_ALL", "C")];

    // Read ELF header
    let stdout = exec_command_with_env("readelf", &["-h", file_path], 500, &env_vars)
        .map_err(|e| format!("Failed to read ELF header: {}", e))?;

    for line in stdout.lines() {
        let line = line.trim();
        if line.contains("Type:") {
            if let Some(value) = line.split(':').nth(1) {
                info.elf_type = value.trim().to_string();
            }
        }
        if line.contains("Machine:") {
            if let Some(value) = line.split(':').nth(1) {
                info.machine = value.trim().to_string();
            }
        }
        if line.contains("Entry point") {
            if let Some(value) = line.split(':').nth(1) {
                info.entry = value.trim().to_string();
            }
        }
    }

    // Get program headers and interpreter in one call
    if let Ok(ph_output) = exec_command_with_env("readelf", &["-l", file_path], 500, &env_vars) {
        let mut in_program_headers = false;
        for line in ph_output.lines() {
            let line = line.trim();
            if line.contains("Program Headers:") || line.contains("Type") {
                in_program_headers = true;
                continue;
            }
            if in_program_headers {
                if line.is_empty() || !line.starts_with(' ') {
                    if !line.starts_with(' ') && !line.is_empty() {
                        in_program_headers = false;
                    }
                } else if !line.is_empty() {
                    info.program_headers.push(line.trim().to_string());
                }
            }
        }

        // Extract interpreter from the same output
        if let Some(interp_start) = ph_output.find("INTERP") {
            let remaining = &ph_output[interp_start..];
            if let Some(captures) = remaining.match_indices('[').next() {
                let start = captures.0 + 1;
                if let Some(end_pos) = remaining[start..].find(']') {
                    info.interpreter = Some(remaining[start..start + end_pos].to_string());
                }
            }
        }
    }

    // Get section headers
    if let Ok(sh_output) = exec_command_with_env("readelf", &["-S", file_path], 500, &env_vars) {
        let mut in_section_headers = false;
        for line in sh_output.lines() {
            let line = line.trim();
            if line.contains("Section Headers:") || line.contains("Nr]") {
                in_section_headers = true;
                continue;
            }
            if in_section_headers && !line.is_empty() {
                if line.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
                    info.section_headers.push(line.to_string());
                }
            }
        }
    }

    // Get dynamic dependencies
    if let Ok(dyn_output) = exec_command_with_env("readelf", &["-d", file_path], 500, &env_vars) {
        let mut dependencies = Vec::new();
        for line in dyn_output.lines() {
            if line.contains("NEEDED") {
                if let Some(captures) = line.match_indices('[').next() {
                    let start = captures.0 + 1;
                    if let Some(end_pos) = line[start..].find(']') {
                        let lib_name = line[start..start + end_pos].to_string();
                        dependencies.push(lib_name);
                    }
                }
            }
        }
        if !dependencies.is_empty() {
            info.dependencies = Some(dependencies);
        }
    }

    Ok(info)
}

/// Analyze a .desktop file
pub fn analyze_desktop(file_path: &str) -> Result<HashMap<String, String>, String> {
    use std::fs;

    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read desktop file: {}", e))?;

    let mut result = HashMap::new();
    let mut in_desktop_entry = false;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed == "[Desktop Entry]" {
            in_desktop_entry = true;
            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            // Different section, stop parsing
            break;
        }

        if in_desktop_entry && trimmed.contains('=') {
            if let Some(pos) = trimmed.find('=') {
                let key = trimmed[..pos].trim().to_string();
                let value = trimmed[pos + 1..].trim().to_string();
                result.insert(key, value);
            }
        }
    }

    Ok(result)
}
