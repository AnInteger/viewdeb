# ViewDeb

A modern, clean Debian package parser tool built as a desktop application with the Tauri framework for quickly viewing the contents of .deb packages.

![ViewDeb](https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- 🚀 **Fast Parsing** - Parse large deb packages in seconds
- 📄 **Complete File List** - List all files included in the package
- 🔍 **File Search** - Search files by path
- 📂 **Smart Filtering** - Filter by file type (All/ELF/Desktop/Other)
- 📊 **Statistics** - Display package size, file count, and other statistics
- 📦 **Dependencies** - View package depends, recommends, suggests, and conflicts
- 📜 **Script Viewing** - View preinst, postinst and other install/remove scripts
- 🔧 **Control Files** - View control, md5sums, and conffiles
- 🔬 **ELF Analysis** - Identify and analyze binary file details
- 🖥️ **Desktop Files** - View desktop application configuration information
- 🌍 **Multi-language Support** - Chinese and English UI
- 🌓 **Theme Switching** - Light mode, dark mode, and follow system theme
- 💻 **Desktop App** - Native desktop experience without browser

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Desktop Framework
- **Framework**: Tauri 2
- **Backend Language**: Rust
- **Package Manager**: Cargo

### Package Parsing
- **Tool**: dpkg-deb
- **ELF Analysis**: readelf

## System Dependencies

Building and running the project requires the following system tools:

| Command | Purpose |
|---------|---------|
| `dpkg` | Debian package manager, used to extract and unpack .deb files |
| `dpkg-deb` | Subcommand of dpkg for handling .deb package file operations |
| `readelf` | ELF file analysis tool for parsing binary file information |
| `cargo` | Rust package manager (required for Tauri builds) |

### Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y dpkg binutils cargo
```

**CentOS/RHEL/Fedora:**
```bash
sudo yum install -y dpkg binutils cargo
# or
sudo dnf install -y dpkg binutils cargo
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Rust and Cargo (required for Tauri)
- Linux system (requires dpkg and binutils)

### Installation

```bash
npm install
```

### Development

**Web Development Mode (using Vite):**
```bash
npm run dev
```

**Tauri Desktop App Development Mode:**
```bash
npm run tauri:dev
```

### Production Build

**Build Web Version:**
```bash
npm run build
npm run preview
```

**Build Tauri Desktop Application:**
```bash
npm run tauri:build
```

After building, the desktop application will be located in the `src-tauri/target/release/bundle/` directory.

## Usage

1. **Upload Package**: Drag and drop a `.deb` or `.udeb` file to the upload area, or click to select a file
2. **Parse Results**: Once parsed, you can view:
   - **Overview**: Basic package info, statistics, and dependencies
   - **Files**: Directory tree structure with expand/collapse, search, and filtering
   - **Scripts**: View preinst, postinst, prerm, postrm and other scripts
   - **Control Files**: View control, md5sums, and conffiles
3. **File Details**: Click files in the tree to view details (ELF files and Desktop files support detailed display)
4. **Language**: Click the language icon in the top-right to switch between 中文/English
5. **Theme**: Click the theme icon in the top-right to switch between light/dark/system

## Project Structure

```
viewdeb/
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx        # File upload component
│   │   ├── PackageView.tsx       # Package info display component
│   │   ├── ThemeToggle.tsx       # Theme toggle component
│   │   └── LanguageSelector.tsx  # Language selector
│   ├── lib/
│   │   ├── i18n/                 # Internationalization
│   │   │   ├── index.ts
│   │   │   └── messages/
│   │   │       ├── zh.json
│   │   │       └── en.json
│   │   ├── platform/             # Platform-specific features
│   │   └── theme/                # Theme management
│   ├── App.tsx                   # App entry
│   └── main.tsx                  # React entry
├── src-tauri/
│   ├── src/                      # Rust backend code
│   ├── capabilities/             # Tauri permissions config
│   ├── icons/                    # App icons
│   ├── tauri.conf.json           # Tauri configuration
│   └── Cargo.toml                # Rust dependencies
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Security & Privacy

- ✅ Files are processed locally, no server upload
- ✅ Uses official dpkg tools to ensure extraction integrity
- ✅ Supports checksum verification
- ✅ Open source code, self-auditable

## Roadmap

- [ ] Support more package formats (rpm, flatpak, etc.)
- [ ] Add file preview functionality
- [ ] Support batch upload
- [ ] Add more ELF analysis details
- [ ] Support direct deb package installation
- [ ] Add package comparison feature

## Architecture Changes

### v0.2.0 - Architecture Refactor
- Migrated from Next.js to Vite + React
- Added Tauri desktop application support
- Changed from server-side rendering to pure client-side application
- Removed dependency on runtime server

## Contributing

Issues and Pull Requests are welcome!

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

This project uses the following open-source projects:

- [Tauri](https://tauri.app/) - Cross-platform desktop app framework
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library

---

Made with ❤️ by the open source community
