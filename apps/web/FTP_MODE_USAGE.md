# EzEdit FTP Mode

## Setup & Usage Guide

EzEdit now supports both local file editing and FTP remote editing through a unified interface, allowing you to seamlessly work with both local and remote files.

## Setup

### 1. MCP Configuration

Ensure your `mcp_config.json` includes the FTP server configuration:

```json
"ftp": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-ftp"
  ]
}
```

### 2. FTP Credentials

- Add your FTP sites in the Dashboard or directly in the editor
- Credentials are stored encrypted in your browser's local storage
- Pro subscribers can save unlimited sites, free users are limited to one site

## Usage

### 1. Mode Switching

- Toggle between Local and FTP modes using the toggle in the editor sidebar
- Each mode maintains its own file navigation state
- When switching modes, your last viewed path is remembered

### 2. Site Selection

- Select an FTP site from the dropdown when in FTP mode
- Temporary credentials can be used for quick access without saving
- After successful file operations, you'll be prompted to save temporary credentials

### 3. File Operations

- **Browse**: Navigate the FTP directory structure
- **Edit**: Changes are stored in memory until saved
- **Save**: Click the Save button or use Ctrl+S (Pro subscription required)
- **Hot-swap**: Switch between sites without losing your editor state

### 4. Credentials Management

- After successful saves, you'll be prompted to save temporary credentials
- Manage saved sites in the Sites management page
- Quick connect option available for one-time use

## Troubleshooting

- If connection fails, check network connectivity and credential accuracy
- Passive mode is enabled by default for better compatibility with firewalls
- Secure connections (FTPS) are supported by enabling the "secure" option
- Error messages in the editor header provide guidance for common issues

## Implementation Details

The FTP mode is implemented using:

- MCP (Model Context Protocol) for secure FTP operations
- React components with TypeScript for the UI
- Monaco Editor for code editing
- Zustand for state management

All FTP operations are non-blocking and maintain editor state across operations.
