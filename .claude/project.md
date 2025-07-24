# EzEdit.co Project Configuration

## Project Identity
- **Name**: EzEdit.co
- **Type**: Web-based FTP Code Editor
- **Version**: 2025.1.0
- **Owner**: James Strickland
- **Repository**: Private

## Development Context

### Current Phase
- Initial project setup
- Core architecture planning
- Documentation creation
- Development environment preparation

### Technology Decisions
- **PHP Backend**: For FTP operations and server-side logic
- **Vanilla JavaScript**: For frontend without framework overhead
- **Monaco Editor**: Professional code editing experience
- **Supabase**: Authentication and user data management
- **Claude API**: AI assistant functionality

### Key Objectives
1. Create intuitive web-based FTP code editor
2. Integrate AI assistance for code editing
3. Provide three-pane IDE-like interface
4. Ensure secure FTP connection management
5. Implement user authentication and session handling

## Project Structure

### Planned Directory Layout
```
/
├── .claude/              # Project documentation and config
│   ├── README.md        # Project overview
│   ├── project.md       # This file
│   └── docs/            # Detailed documentation
├── public/              # Web-accessible files
│   ├── index.php       # Application entry point
│   ├── editor.php      # Main editor interface
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript modules
│   └── api/            # API endpoints
├── config/             # Configuration files
├── src/                # PHP source files
└── tests/              # Test files
```

### Development Priorities
1. **Core FTP Handler** - Establish FTP connections and file operations
2. **Monaco Integration** - Set up code editor with syntax highlighting
3. **User Authentication** - Implement Supabase auth integration
4. **File Explorer** - Create tree-view file browser
5. **AI Assistant** - Integrate Claude API for code assistance

## Implementation Guidelines

### Code Standards
- PHP 8.0+ syntax and features
- PSR-12 coding standard
- Comprehensive error handling
- Security-first approach
- Performance optimization

### Security Requirements
- Encrypted FTP credential storage
- CSRF protection
- Input validation and sanitization
- Secure session management
- Rate limiting for API endpoints

### Performance Goals
- Sub-3 second page load times
- Sub-1 second file operations
- Responsive UI (60fps)
- Efficient memory usage
- Minimal network requests

## Business Context

### Target Users
- Web developers and agencies
- DevOps engineers
- Content managers
- Freelance developers

### Competitive Advantages
- Web-based (no installation required)
- AI-powered code assistance
- Direct FTP integration
- Professional editor experience
- Secure credential management

### Revenue Model
- Freemium with usage limits
- Pro subscription ($50/month)
- Enterprise plans with team features

## Technical Constraints

### Server Requirements
- PHP 8.0+ with FTP extension
- Web server (Apache/Nginx)
- SSL certificate
- Sufficient disk space for caching

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Third-party Dependencies
- Supabase (authentication, database)
- Claude API (AI assistance)
- Monaco Editor (code editing)

## Success Metrics

### Technical KPIs
- 99.9% uptime
- <3s page load time
- <1s file operation time
- Zero data breaches

### Business KPIs
- User acquisition rate
- Free-to-paid conversion
- Monthly recurring revenue
- Customer satisfaction score

## Next Steps

1. Set up development environment
2. Create basic project structure
3. Implement core FTP functionality
4. Integrate Monaco Editor
5. Add user authentication
6. Develop AI assistant features
7. Testing and optimization
8. Production deployment