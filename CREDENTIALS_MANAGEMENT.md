# Credentials Management

## Overview
ezEdit now includes a secure credentials management system that allows you to save, manage, and import/export your connection settings for FTP, SFTP, WordPress, and Wix.

## Features

### 🔐 Secure Storage
- **Client-side encryption**: Credentials are encrypted using XOR cipher before storing in localStorage
- **Base64 encoding**: Additional layer of obfuscation
- **Never transmitted**: Credentials stay on your device
- **Easy to clear**: Remove all saved connections anytime

### 💾 Save Always Option
- **Checkbox on each form**: "Save credentials for future use"
- **Default enabled**: Checked by default for convenience
- **Opt-out available**: Uncheck to connect without saving
- **Automatic updates**: Re-connecting updates the saved credentials

### 📋 Saved Connections List
- **Quick access**: Click any saved connection to connect instantly
- **Connection info**: Shows name, type (FTP/SFTP/WordPress/Wix)
- **Last used timestamp**: See when you last used each connection
- **Delete option**: Remove individual connections easily
- **Auto-scroll**: Scrollable list when you have many connections

### 📤 Export Connections
- **Backup your credentials**: Export all connections to a JSON file
- **Portable**: Move credentials between devices
- **Date-stamped filename**: e.g., `ezedit-connections-2025-11-02.json`
- **Encrypted format**: Export maintains encryption

### 📥 Import Connections
- **Restore from backup**: Import previously exported connections
- **Merge intelligently**: Newer connections override older ones
- **Multiple devices**: Share connections across your machines
- **Conflict resolution**: Keeps the most recently used version

## How to Use

### Saving a New Connection

1. **Open Connection Manager**
   - Click "Connect to Remote Source" in File Explorer
   
2. **Enter Connection Details**
   - Choose tab: FTP, SFTP, WordPress, or Wix
   - Fill in all required fields
   
3. **Check "Save credentials"** (enabled by default)
   - Leave checked to save for future use
   - Uncheck for one-time connection
   
4. **Click Connect**
   - Connects and saves simultaneously (if checked)

### Using a Saved Connection

1. **Open Connection Manager**
   
2. **View Saved Connections** at the top
   - Shows all saved connections
   - Displays type and last used date
   
3. **Click on a Connection**
   - Instantly connects using saved credentials
   - Updates "last used" timestamp
   - No need to re-enter password

### Deleting a Connection

1. **Find the connection** in saved list
2. **Click the trash icon** (🗑️)
3. **Connection removed** immediately

### Exporting Connections

1. **Open Connection Manager**
2. **Click "Export" button** (top right of saved list)
3. **Save the JSON file** to your preferred location
4. **Keep it secure** - it contains your encrypted credentials

### Importing Connections

1. **Open Connection Manager**
2. **Click "Import" button**
3. **Select your JSON file**
4. **Confirmation message** shows how many imported
5. **Connections appear** in saved list

## File Format

### Export File Structure
```json
[
  {
    "id": "uuid-here",
    "name": "My FTP Server",
    "type": "ftp",
    "data": "encrypted-base64-string",
    "lastUsed": "2025-11-02T01:00:00.000Z"
  }
]
```

### Encrypted Data
The `data` field contains encrypted JSON with full connection details:
- FTP: host, port, username, password
- WordPress: siteUrl, username, applicationPassword
- Wix: siteId, apiKey

## Security Considerations

### ✅ What's Secure
- Credentials encrypted before storage
- Never sent to any server
- Stored only in browser localStorage
- Easy to clear all data

### ⚠️ Important Notes
- **localStorage is accessible** to scripts on the same domain
- **Not for ultra-sensitive data** - this is convenience encryption
- **Browser storage can be cleared** - use export as backup
- **XSS protection required** - keep your browser updated

### 🔒 Best Practices
1. **Use export/import** for backups, not cloud storage
2. **Keep export files secure** - treat like password files
3. **Don't share export files** - they contain all credentials
4. **Clear saved connections** when using shared computers
5. **Regular backups** - export your connections periodically

## Storage Location

### Browser localStorage
- **Key**: `ezedit_saved_connections`
- **Format**: JSON string
- **Size limit**: ~5-10MB (browser dependent)
- **Persistence**: Until cleared or browser data deleted

### Clearing Saved Data

#### Method 1: Browser DevTools
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Find localStorage
4. Delete `ezedit_saved_connections`

#### Method 2: Clear All (Coming Soon)
- Settings → Clear Saved Connections
- Removes all stored credentials

## Troubleshooting

### Import Failed
**Error**: "Invalid connection file format"
- **Solution**: Ensure you're importing a valid ezEdit export file
- **Check**: File should be valid JSON array

### Connection Not Saving
**Possible causes**:
- "Save credentials" checkbox unchecked
- localStorage disabled in browser
- Browser privacy mode/incognito
- **Solution**: Check browser settings and checkbox

### Saved Connection Won't Load
**Possible causes**:
- Corrupted localStorage data
- Encryption key mismatch
- **Solution**: Delete and re-save the connection

### Export File Too Large
**Issue**: Browser won't download file
- **Rare**: Happens with 100+ connections
- **Solution**: Export in batches or clear old connections

## Future Enhancements

### Planned Features
- [ ] Cloud sync across devices
- [ ] Master password for extra security
- [ ] Connection groups/folders
- [ ] Bulk delete operations
- [ ] Connection usage statistics
- [ ] Favorite/pin connections
- [ ] Search saved connections
- [ ] Auto-backup on schedule
- [ ] Browser extension support

## Privacy Policy

### What We Store
- Connection names
- Server addresses
- Usernames and passwords (encrypted)
- Last used timestamps

### What We DON'T Store
- Your files or file contents
- Browsing history
- Personal information

### Where It's Stored
- **Only on your device** in browser localStorage
- Never transmitted to any server
- Never shared with third parties

## Support

### Need Help?
- Check this documentation
- Review security best practices
- Contact support if issues persist

### Report Issues
- Security concerns: Priority 1
- Import/export problems
- Encryption issues
- Feature requests

## License & Compliance

- Credentials stored locally only
- No data transmission
- GDPR compliant (no data collection)
- User-controlled deletion
