# 🧠 EzEdit v2 - Advanced AI Website Editor

> **A next-generation web-based IDE that merges AI-assisted code editing, FTP/S3 integration, and no-code page management.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

**EzEdit** is designed to be the fastest way for developers and non-technical users to **edit, deploy, and maintain websites** through conversational AI. It combines the power of modern web technologies with intelligent AI assistance to create a seamless editing experience.

### Key Features

- 🌐 **Browser-based FTP/S3 Connection** - Edit remote files directly
- 🤖 **Multi-AI Integration** - OpenAI GPT-5, Claude Code, Ollama 3
- 📝 **Monaco Editor** - Full VS Code editing experience
- 🎨 **Three-Pane Interface** - File Tree, Editor, AI Assistant
- ⚡ **Real-time Validation** - Auto-save, syntax checking
- 🚀 **Auto-Deploy** - Push changes with rollback support
- 🔒 **Enterprise Security** - OAuth2, encrypted credentials, role-based access

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  Next.js + React + TailwindCSS + ShadCN UI + Monaco Editor  │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                       AI Integration                         │
│      OpenAI GPT-5  │  Claude Code  │  Ollama 3 / LLaMA     │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                      Backend Services                        │
│         Node.js + Express + Supabase API + Auth             │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    Storage & Database                        │
│      FTP/SFTP  │  S3-Compatible  │  Supabase PostgreSQL     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ UI Layout

### 1. **File Explorer** (Left Pane)
- Browse FTP/S3 directory structures
- Upload, rename, delete files
- Context menu with AI actions ("Optimize", "Explain")

### 2. **Monaco Editor** (Center Pane)
- Syntax highlighting for HTML, CSS, JS, PHP, and more
- Tab-based multi-file editing
- Auto-save and intelligent code completion
- **Hotkey**: `Ctrl+Enter` → Send selection to AI

### 3. **AI Assistant** (Right Pane)
- Chat-based interface with model selection
- **AI Modes**:
  - 💬 **Explain Code** - Understand complex logic
  - 🪄 **Refactor/Improve** - Optimize code structure
  - 🔍 **SEO Optimize** - Enhance meta tags & content
  - ⚙️ **Debug & Fix** - Identify and resolve errors
  - 🚀 **Auto-Deploy** - Push changes via FTP/Git
  - ⏮️ **Rollback** - Restore previous versions

---

## 🧠 AI Capabilities

| Feature | Description |
|---------|-------------|
| **Code Analysis** | Reviews code for errors, security vulnerabilities, best practices |
| **Semantic Search** | Find files/functions using natural language queries |
| **Context-Aware Suggestions** | Real-time code completion based on cursor position |
| **Natural Language Commands** | "Add a contact form to homepage" → generates HTML/CSS/JS |
| **Auto-Deploy Agent** | Intelligent deployment with safety checks |
| **Version Control** | AI-powered rollback with snapshot management |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for backend services)
- OpenAI/Claude/Ollama API keys

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ezedit-2025.git
cd ezedit-2025

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
OLLAMA_API_URL=http://localhost:11434

# FTP/Storage
S3_BUCKET_NAME=your_bucket
S3_REGION=us-east-1
```

---

## 📦 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, TailwindCSS 3.4 |
| **UI Components** | ShadCN UI, Monaco Editor, Radix UI |
| **Backend** | Node.js, Express, Supabase API |
| **Database** | Supabase PostgreSQL (with Row-Level Security) |
| **Storage** | FTP/SFTP, S3-compatible storage, Supabase Storage |
| **AI Models** | OpenAI GPT-5, Claude Code, Ollama 3, Local LLaMA |
| **Auth** | Supabase Auth (Google OAuth, Email/Password) |
| **Deployment** | Fly.io, AWS EC2, Netlify, Vercel |

---

## 🗂️ Project Structure

```
ezedit-2025/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main editor interface
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── editor/            # Monaco editor components
│   ├── file-explorer/     # File tree components
│   ├── ai-assistant/      # AI chat interface
│   └── ui/                # ShadCN UI components
├── lib/                   # Core utilities
│   ├── ai/                # AI provider integrations
│   ├── ftp/               # FTP/SFTP clients
│   ├── storage/           # Storage adapters
│   └── supabase/          # Supabase client
├── types/                 # TypeScript definitions
├── hooks/                 # Custom React hooks
└── public/                # Static assets
```

---

## 🔒 Security Features

- **OAuth2 Authentication** - Google, GitHub login
- **Encrypted Credentials** - FTP/API keys stored securely
- **Role-Based Access Control** - Admin, Developer, Editor roles
- **Row-Level Security** - Database-level permissions
- **Audit Logging** - Track all file modifications
- **CSP Headers** - Content Security Policy protection

---

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ezedit-2025/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ezedit-2025/discussions)
- **Email**: support@ezedit.dev

---

**Built with ❤️ for the modern web developer**
