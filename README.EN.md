# ViewDeb

A modern, clean online Debian package parser tool for quickly viewing the contents of .deb packages.

![ViewDeb](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
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

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Theme Management**: next-themes
- **Icons**: Lucide React

### Backend
- **Runtime**: Next.js API Routes
- **Package Parsing**: dpkg/debsums tools
- **ELF Analysis**: readelf tool

## System Dependencies

The project requires the following commands to be installed on the system (all are common Linux tools):

| Command | Purpose |
|---------|---------|
| `dpkg` | Debian package manager, used to extract and unpack .deb files |
| `dpkg-deb` | Subcommand of dpkg for handling .deb package file operations |
| `debsums` | Debian package checksum and verification tool |
| `readelf` | ELF file analysis tool for parsing binary file information |

### Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y dpkg binutils
```

**CentOS/RHEL/Fedora:**
```bash
sudo yum install -y dpkg binutils
# or
sudo dnf install -y dpkg binutils
```

These tools are typically included in the base packages of most Linux distributions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Linux system (requires dpkg and binutils)

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

After the development server starts, visit in your browser:
- Chinese: http://localhost:3000/zh
- English: http://localhost:3000/en

### Production Build

```bash
npm run build
npm run start
```

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
│   ├── app/
│   │   ├── [locale]/          # Internationalized routes
│   │   │   ├── page.tsx       # Main page
│   │   │   └── layout.tsx     # Layout component (with translation loading)
│   │   ├── api/
│   │   │   └── parse/route.ts # Parse API
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── FileUpload.tsx     # File upload component
│   │   ├── PackageView.tsx    # Package info display component
│   │   ├── ThemeToggle.tsx    # Theme toggle component
│   │   └── LanguageSelector.tsx # Language selector
│   ├── i18n/
│   │   ├── messages/          # Translation files
│   │   │   ├── zh.json
│   │   │   └── en.json
│   │   ├── request.tsx       # i18n configuration
│   │   └── routing.ts         # Routing configuration
│   └── lib/
│       └── extractors/
│           └── debianExtractor.ts # Core Debian package parsing logic
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Security & Privacy

- ✅ Files are processed temporarily on the server
- ✅ Deleted immediately after parsing, no records are saved
- ✅ Uses official dpkg tools to ensure extraction integrity
- ✅ Supports checksum verification

## Roadmap

- [ ] Support more package formats (rpm, flatpak, etc.)
- [ ] Add file preview functionality
- [ ] Support batch upload
- [ ] Add more ELF analysis details
- [ ] Support direct online installation (deb packages)
- [ ] Add package comparison feature

## Contributing

Issues and Pull Requests are welcome!

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

This project uses the following open-source projects:

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization solution
- [Lucide](https://lucide.dev/) - Icon library

---

Made with ❤️ by the open source community
