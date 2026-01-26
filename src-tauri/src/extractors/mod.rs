pub mod deb;
pub mod elf;

pub use deb::DebExtractor;
pub use elf::{analyze_elf, analyze_desktop};
