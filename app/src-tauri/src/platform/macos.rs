use std::process::Command;

/// Check if the app has accessibility permissions (macOS)
pub fn check_accessibility() -> bool {
    let output = Command::new("osascript")
        .args(["-e", "tell application \"System Events\" to return true"])
        .output();

    matches!(output, Ok(o) if o.status.success())
}

/// Copy text to clipboard via pbcopy (macOS)
pub fn copy_to_clipboard(text: &str) -> Result<(), String> {
    use std::io::Write;
    let mut child = Command::new("pbcopy")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    child
        .stdin
        .as_mut()
        .ok_or("Failed to open stdin")?
        .write_all(text.as_bytes())
        .map_err(|e| e.to_string())?;

    child.wait().map_err(|e| e.to_string())?;
    Ok(())
}
