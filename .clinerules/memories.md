# Development Tools
- Prefer React and Next.js as the technology stack
- Use libdpkg or dpkg -x command for deb package parsing, considering future support for rpm/flatpak but without current implementation.

# System Architecture
- Prefer backend file processing with minimal API design

# Data Management
- Do not retain parsing history or any historical records

# UI/UX
- Prefer minimal interface design with high information density, favoring clean views by hiding redundant folders and supporting file previews.
- Prefer consolidated or optimized controls for expand/collapse features rather than separate buttons.
- Require internationalization and theme switching (light/dark/system) using Next.js native features, ensuring complete translation coverage for all UI elements including menus and content lists.
- Strictly enforce pure white style for the light theme and ensure correct styling on all pages, especially the file parsing result views.

# Deployment
- Local development environment with cloud deployment

# Security
- No authentication mechanism required

# Error Handling
- Prefer generic error handling by truncating and returning raw error messages directly, avoiding complex logic for specific error classification like disk issues.

# Logging
- Enable logging output to assist in debugging switching issues and malfunctions.

# Documentation
- Ensure an English version of the README is provided.
