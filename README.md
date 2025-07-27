# EzEdit.co - Next.js Version

A modern, AI-powered online code editor for editing website files via FTP/SFTP connections. Built with Next.js, Supabase, and integrated AI assistance from OpenAI and Claude.

## 🚀 Features

- **Modern Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS
- **Monaco Editor**: Full-featured code editor with syntax highlighting and IntelliSense
- **AI-Powered Assistance**: Integrated OpenAI GPT-4 and Claude for code suggestions and improvements
- **Secure FTP/SFTP**: Connect to any FTP server with encrypted credential storage
- **Real-time Collaboration**: Multi-user editing with conflict resolution
- **Version History**: Complete edit history with timestamps and rollback capabilities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Static Site Generation**: Optimized for performance with SSG where possible

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code editor component
- **Zustand** - Lightweight state management
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Authentication, database, and real-time subscriptions
- **PostgreSQL** - Relational database with Row Level Security
- **Next.js API Routes** - Serverless API endpoints

### AI Integration
- **OpenAI GPT-4** - Code analysis and suggestions
- **Claude (Anthropic)** - Alternative AI model for code assistance

### Deployment
- **Netlify** - Hosting and continuous deployment
- **Netlify Functions** - Serverless functions for API routes

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenAI API key (optional)
- Anthropic API key (optional)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ezedit-nextjs
npm install
```

### 2. Environment Configuration
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

Fill in the required environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI API Keys (optional but recommended)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the database schema from `src/lib/database-schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Configure authentication providers in Supabase dashboard

### 4. Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── ai/           # AI assistant endpoints
│   │   └── ftp/          # FTP connection endpoints
│   ├── auth/             # Authentication pages
│   ├── editor/           # Main editor page
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── AIAssistant/      # AI chat interface
│   ├── FileExplorer/     # File browser
│   ├── Layout/           # Layout components
│   └── MonacoEditor.tsx  # Code editor wrapper
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client configuration
│   └── database-schema.sql # Database schema
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── globals.css           # Global styles
```

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link your Git repository to Netlify
   - Choose the `ezedit-nextjs` folder as the base directory

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Environment Variables**
   Add all environment variables from `.env.example` in Netlify dashboard

4. **Deploy**
   ```bash
   # Or deploy manually
   npm run build
   netlify deploy --prod
   ```

### Required Netlify Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Alternative Deployment Options
- **Vercel**: Full Next.js support with edge functions
- **Railway**: Simple deployment with automatic HTTPS
- **DigitalOcean App Platform**: Container-based deployment

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **Encrypted Credentials**: FTP passwords stored with encryption
- **CORS Configuration**: Restricted cross-origin requests
- **Input Validation**: All user inputs validated and sanitized
- **Rate Limiting**: API endpoints protected against abuse
- **CSP Headers**: Content Security Policy for XSS protection

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run development server
npm run dev

# Build for production
npm run build
```

## 📊 Performance Optimizations

- **Static Site Generation**: Landing page and documentation
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Browser caching and CDN configuration
- **Compression**: Gzip and Brotli compression

## 🔧 Configuration

### Monaco Editor
The Monaco Editor is configured with:
- Syntax highlighting for 20+ languages
- IntelliSense and autocompletion
- Custom themes (light/dark)
- Vim keybindings (optional)
- Minimap and bracket matching

### AI Integration
- **OpenAI GPT-4**: Primary AI model for code assistance
- **Claude 3**: Alternative AI model with different strengths
- **Context Awareness**: AI understands current file and selection
- **Streaming Responses**: Real-time AI response streaming

### File Operations
- **FTP/SFTP Support**: Connect to any standard FTP server
- **File Tree**: Navigate complex directory structures
- **Multi-file Editing**: Work with multiple files simultaneously
- **Auto-save**: Automatic saving with configurable delays
- **Conflict Resolution**: Handle concurrent edits gracefully

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.ezedit.co](https://docs.ezedit.co)
- **Issues**: [GitHub Issues](https://github.com/ezedit/ezedit-nextjs/issues)
- **Discord**: [Community Discord](https://discord.gg/ezedit)
- **Email**: support@ezedit.co

## 🚧 Roadmap

- [ ] **Collaboration Features**: Real-time multi-user editing
- [ ] **Plugin System**: Custom extensions and themes
- [ ] **Git Integration**: Direct Git operations from the editor
- [ ] **Terminal Access**: Integrated terminal for server commands
- [ ] **Database Browser**: Visual database query interface
- [ ] **Mobile App**: Native mobile applications
- [ ] **Self-hosted**: Docker deployment option
- [ ] **API Access**: RESTful API for programmatic access

## ⚡ Quick Start

For a quick demo without setup:

1. Visit [https://demo.ezedit.co](https://demo.ezedit.co)
2. Click "Try Demo" to use the editor without registration
3. Connect to the demo FTP server with provided credentials
4. Start editing files with AI assistance

---

Built with ❤️ by the EzEdit.co team