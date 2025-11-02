# Contributing to EzEdit v2

Thank you for your interest in contributing to EzEdit v2! This document provides guidelines and best practices for contributing to the project.

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm package manager
- Git
- Code editor (VS Code recommended)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/ezedit-2025.git
cd ezedit-2025

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local

# Start development server
npm run dev
```

Visit http://localhost:3000 to see your changes.

## Project Architecture

### Directory Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - React components organized by feature
- `lib/` - Core utilities, API clients, and integrations
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks
- `public/` - Static assets

### Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: TailwindCSS 4, ShadCN UI
- **Editor**: Monaco Editor
- **State**: Zustand
- **AI**: OpenAI, Anthropic, Ollama
- **Storage**: FTP/SFTP, AWS S3, Supabase

## Development Workflow

### Branch Naming
- `feature/` - New features (e.g., `feature/ftp-connection`)
- `fix/` - Bug fixes (e.g., `fix/editor-crash`)
- `refactor/` - Code refactoring (e.g., `refactor/ai-client`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `chore/` - Maintenance tasks (e.g., `chore/deps-update`)

### Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(editor): add auto-save functionality
fix(ftp): handle connection timeout errors
docs(readme): update installation instructions
refactor(ai): consolidate provider clients
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following code style guidelines
3. **Test your changes** thoroughly
4. **Run linting**: `npm run lint`
5. **Update documentation** if needed
6. **Submit PR** with clear description

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] No console errors
- [ ] Works in different browsers

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Fixes #(issue number)
```

## Code Style Guidelines

### TypeScript
- Use TypeScript strict mode
- Define types in `types/index.ts` for shared types
- Use `interface` for object shapes, `type` for unions/primitives
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
}

// Avoid
const data: any = fetchData();
```

### React Components
- Use functional components with hooks
- Add `'use client'` directive for client components
- Destructure props for clarity
- Use meaningful component and variable names

```typescript
'use client';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

export function Editor({ content, onChange }: EditorProps) {
  // Component logic
}
```

### File Organization
- One component per file
- Co-locate related files in feature directories
- Use barrel exports (index.ts) for cleaner imports

```
components/
├── editor/
│   ├── CodeEditor.tsx
│   ├── EditorTabs.tsx
│   └── index.ts  // export { CodeEditor, EditorTabs };
```

### Styling
- Use Tailwind utility classes
- Follow ShadCN UI component patterns
- Avoid inline styles unless dynamic
- Use CSS variables for theme values

```typescript
// Good
<div className="flex items-center gap-2 p-4 bg-card">

// Avoid
<div style={{ display: 'flex', padding: '16px' }}>
```

### State Management
- Use Zustand for global state
- Keep component state local when possible
- Define store types from `types/index.ts`

```typescript
import { create } from 'zustand';
import { EditorState } from '@/types';

export const useEditorStore = create<EditorState>((set) => ({
  tabs: [],
  activeTabId: null,
  // ...
}));
```

### API Routes
- Place in `app/api/` directory
- Use proper HTTP status codes
- Handle errors gracefully
- Validate input data

```typescript
// app/api/files/route.ts
export async function GET(request: Request) {
  try {
    // Logic
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Guidelines

### When Tests Are Added
- Write unit tests for utility functions
- Write integration tests for API routes
- Test component rendering and interactions
- Aim for meaningful coverage, not 100%

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

## Security Best Practices

### Environment Variables
- Never commit `.env.local`
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- Encrypt sensitive data before storage

### Authentication
- Validate user sessions on every protected route
- Implement proper RBAC (Role-Based Access Control)
- Use Supabase Auth for user management

### Data Handling
- Sanitize user inputs
- Encrypt FTP credentials using `FTP_ENCRYPTION_KEY`
- Implement rate limiting on API routes
- Use HTTPS for all external requests

## Documentation

### Code Comments
- Add JSDoc comments for public functions
- Explain "why" not "what" in comments
- Keep comments up-to-date

```typescript
/**
 * Establishes FTP connection and returns client instance.
 * Automatically retries connection up to 3 times on failure.
 */
export async function connectFTP(config: FTPConnection) {
  // Implementation
}
```

### README Updates
Update README.md when:
- Adding new features
- Changing installation steps
- Modifying configuration options

## Performance Considerations

- Use dynamic imports for large dependencies
- Optimize images and assets
- Implement code splitting
- Use React.memo for expensive components
- Debounce frequent operations (auto-save, search)

```typescript
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);
```

## Accessibility

- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible
- Maintain proper color contrast

## Questions or Issues?

- Check existing issues before creating new ones
- Use issue templates when available
- Provide clear reproduction steps for bugs
- Include environment details (OS, browser, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to EzEdit v2! 🚀
