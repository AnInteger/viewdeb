use std::process::Command;
use std::thread;
use std::time::Duration;

/// Execute a shell command with timeout
pub fn exec_command(cmd: &str, args: &[&str], timeout_ms: u64) -> Result<String, String> {
    let cmd = cmd.to_string();
    let args: Vec<String> = args.iter().map(|s| s.to_string()).collect();

    let timeout_duration = Duration::from_millis(timeout_ms);

    // Use a thread to enforce timeout
    let handle = thread::spawn(move || {
        let output = Command::new(&cmd)
            .args(&args)
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    Ok(String::from_utf8_lossy(&output.stdout).to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(format!(
                        "Command exited with code {}: {}",
                        output.status.code().unwrap_or(-1),
                        stderr
                    ))
                }
            }
            Err(e) => Err(format!("Command failed: {}", e)),
        }
    });

    // Poll for completion with timeout
    let start = std::time::Instant::now();
    while start.elapsed() < timeout_duration {
        if handle.is_finished() {
            return match handle.join() {
                Ok(result) => result,
                Err(_) => Err("Thread panicked".to_string()),
            };
        }
        thread::sleep(Duration::from_millis(100));
    }

    // Timeout exceeded
    Err(format!("Command timed out after {}ms", timeout_ms))
}

/// Execute a command and get output with environment variable
pub fn exec_command_with_env(
    cmd: &str,
    args: &[&str],
    timeout_ms: u64,
    env_vars: &[(&str, &str)],
) -> Result<String, String> {
    let cmd = cmd.to_string();
    let args: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    let env_vars: Vec<(String, String)> = env_vars
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect();

    let timeout_duration = Duration::from_millis(timeout_ms);

    let handle = thread::spawn(move || {
        let mut command = Command::new(&cmd);
        command.args(&args);

        for (key, value) in &env_vars {
            command.env(key, value);
        }

        let output = command.output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    Ok(String::from_utf8_lossy(&output.stdout).to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(format!(
                        "Command exited with code {}: {}",
                        output.status.code().unwrap_or(-1),
                        stderr
                    ))
                }
            }
            Err(e) => Err(format!("Command failed: {}", e)),
        }
    });

    // Poll for completion with timeout
    let start = std::time::Instant::now();
    while start.elapsed() < timeout_duration {
        if handle.is_finished() {
            return match handle.join() {
                Ok(result) => result,
                Err(_) => Err("Thread panicked".to_string()),
            };
        }
        thread::sleep(Duration::from_millis(100));
    }

    Err(format!("Command timed out after {}ms", timeout_ms))
}
