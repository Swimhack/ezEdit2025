# ezEdit - AI-Powered Web/FTP Editor

ezEdit is a static web application that lets non-technical users open legacy sites over FTP, live-edit code with a Monaco-style split editor, preview changes instantly, and save to the server.

## Project Overview

ezEdit is built as a fully static HTML, CSS, and JavaScript application with no build tools, no Node.js dependencies, and no Docker requirements. This makes it extremely easy to deploy to any static hosting service.

### Key Features

- **Secure FTP connector**: Add sites with host, port, user, password, and passive mode settings
- **File Explorer**: Collapsible tree, lazy-load directories, breadcrumb navigation
- **Split code editor**: Monaco diff/merge view with original and edited versions
- **AI assistance**: Chat-assist side panel ("Klein" agent) that can propose patches
- **Preview pane**: Inline iframe refreshing on save
- **Plans & gating**: Free trial (view & preview) and Pro plan (unlimited sites, save & publish)

## Deployment

### DigitalOcean App Platform

This project is configured for easy deployment to DigitalOcean App Platform as a static site:

1. Connect your GitHub repository (Swimhack/ezEdit-1)
2. Select the repository and branch (main)
3. Choose "Static Site" as the deployment type
4. No build command is needed
5. Deploy!

### Configuration Files

- `.do/app.yaml`: DigitalOcean App Platform configuration
- `.do/staticwebapp.json`: Static site configuration
- `static.json`: Routing configuration for static hosting

## Project Structure

- `/index.html`: Root entry point
- `/public/`: Main application directory
  - `/public/css/`: Stylesheets
  - `/public/js/`: JavaScript files
  - `/public/components/`: UI components
  - `/public/ftp/`: FTP-related functionality

## Development

This is a pure static HTML/CSS/JavaScript project. To develop locally:

1. Clone the repository
2. Open the project in your favorite code editor
3. Use a simple HTTP server to serve the files locally (e.g., Python's `http.server` or VS Code's Live Server extension)

No build process is required!

## License

Copyright © 2025 Strickland Technology
