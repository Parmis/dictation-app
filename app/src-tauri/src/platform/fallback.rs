/// Check accessibility permissions (fallback — always true)
pub fn check_accessibility() -> bool {
    true
}

/// Copy text to clipboard (fallback — no-op)
pub fn copy_to_clipboard(_text: &str) -> Result<(), String> {
    Err("Clipboard not supported on this platform".to_string())
}
