/// Check accessibility permissions (Windows — always true)
pub fn check_accessibility() -> bool {
    true
}

/// Copy text to clipboard via clip.exe (Windows)
pub fn copy_to_clipboard(text: &str) -> Result<(), String> {
    use std::io::Write;
    use std::process::{Command, Stdio};

    let mut child = Command::new("clip")
        .stdin(Stdio::piped())
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
