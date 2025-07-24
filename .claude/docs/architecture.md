# EzEdit.co Architecture Documentation

## System Architecture

### Frontend Layer
```
Browser
├── Monaco Editor (Code editing)
├── File Explorer (FTP tree view)
├── AI Assistant (Claude integration)
└── Authentication (Supabase Auth)
```

### Backend Layer
```
PHP Server
├── FTP Handler (Connection management)
├── Authentication Service (Session handling)
├── AI Service (Claude API integration)
└── Configuration Management
```

### Data Layer
```
Storage
├── Supabase (User data, sessions)
├── FTP Servers (File storage)
└── Local Cache (Temporary files)
```

## Component Responsibilities

### FTP Handler
- Establish FTP connections
- File CRUD operations
- Directory listing and navigation
- Connection pooling and management

### Monaco Editor Integration
- Syntax highlighting
- Code completion
- Error detection
- File change detection

### AI Assistant
- Code explanation
- Code generation
- Bug detection
- Optimization suggestions

### Authentication System
- User registration/login
- Session management
- Access control
- Password reset functionality

## API Endpoints

### FTP Operations
- `POST /ftp/connect` - Establish FTP connection
- `GET /ftp/list` - List directory contents
- `GET /ftp/file` - Download file content
- `PUT /ftp/file` - Upload/save file
- `DELETE /ftp/file` - Delete file

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/session` - Check session status

### AI Services
- `POST /ai/explain` - Explain code
- `POST /ai/generate` - Generate code
- `POST /ai/debug` - Debug assistance