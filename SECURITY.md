# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in EzEdit v2, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security details to: **security@ezedit.dev**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within **48 hours** and provide updates on the fix progress.

## Security Measures

### Authentication & Authorization

#### Supabase Auth Integration
- JWT-based authentication with automatic token refresh
- Session tokens stored in httpOnly cookies (not accessible via JavaScript)
- Email/Password authentication with bcrypt hashing
- OAuth2 integration (Google, GitHub)
- Role-Based Access Control (RBAC): admin, developer, editor, viewer

#### Session Management
- Token expiration: 1 hour (access token), 7 days (refresh token)
- Automatic logout on token expiration
- Session invalidation on logout
- Concurrent session detection and control

### Credential Storage

#### FTP/SFTP Credentials
All connection credentials are encrypted before storage:

```typescript
// Encryption process
1. User enters FTP credentials
2. Server encrypts using AES-256-GCM with FTP_ENCRYPTION_KEY
3. Encrypted data stored in Supabase with user_id
4. Decryption only happens server-side during connection
5. Credentials never sent to client
```

#### Environment Variables Security
- Never commit `.env.local` to version control
- Use `NEXT_PUBLIC_` prefix ONLY for non-sensitive client-safe variables
- Rotate API keys regularly (recommended: every 90 days)
- Use different keys for development and production

### Database Security (Supabase)

#### Row-Level Security (RLS)
All tables implement RLS policies:

```sql
-- Connections table
CREATE POLICY "Users view own connections"
ON connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own connections"
ON connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- File versions table
CREATE POLICY "Users access own file versions"
ON file_versions FOR ALL
USING (auth.uid() = user_id);

-- Audit logs (admins only)
CREATE POLICY "Admins view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

#### Service Role Key Protection
- Service role key NEVER exposed to client
- Only used in API routes for privileged operations
- Stored securely in environment variables

### API Security

#### Rate Limiting
Implemented per-endpoint:
- Authentication: 10 req/min per IP
- FTP operations: 100 req/min per user
- AI requests: 20 req/min per user
- File uploads: 50 MB per request, 500 MB/hour

#### Request Validation
All API routes validate input:
```typescript
// Example validation
import { z } from 'zod';

const ftpConfigSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().min(1).max(65535),
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(255),
});
```

#### CORS Policy
```typescript
// next.config.ts
const headers = [
  {
    key: 'Access-Control-Allow-Origin',
    value: process.env.NEXT_PUBLIC_APP_URL,
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS',
  },
];
```

#### Content Security Policy (CSP)
```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' https://api.openai.com https://api.anthropic.com;
  frame-ancestors 'none';
`;
```

### File Upload Security

#### Validation
- File size limit: 50 MB per file
- MIME type validation
- Filename sanitization (remove special characters)
- Path traversal prevention

```typescript
// Example sanitization
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

function preventPathTraversal(path: string): boolean {
  const normalized = path.normalize(path);
  return !normalized.includes('..');
}
```

#### Virus Scanning
*Future implementation*: Integrate ClamAV or similar for uploaded file scanning.

### Client-Side Security

#### XSS Prevention
- React automatically escapes rendered content
- Use `dangerouslySetInnerHTML` only when absolutely necessary
- Sanitize user input before display

```typescript
// Good
<div>{userInput}</div>

// Avoid
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### CSRF Protection
- SameSite cookie attribute set to 'Lax'
- CSRF tokens for state-changing operations
- Origin header validation

### AI Service Security

#### API Key Management
- Store AI provider keys server-side only
- Never expose in client code or logs
- Use environment variables
- Rotate keys regularly

#### Prompt Injection Prevention
```typescript
// Sanitize user prompts
function sanitizePrompt(prompt: string): string {
  // Remove system-level commands
  const dangerous = ['SYSTEM:', 'INSTRUCTION:', '<|im_start|>'];
  let clean = prompt;
  dangerous.forEach(cmd => {
    clean = clean.replace(new RegExp(cmd, 'gi'), '');
  });
  return clean.substring(0, 2000); // Limit length
}
```

#### Context Isolation
- Each user's AI context isolated
- File content limited to user's accessible files
- Prevent cross-user data leakage

### Network Security

#### HTTPS Enforcement
- Production must use HTTPS
- HTTP Strict Transport Security (HSTS) enabled
- Redirect HTTP to HTTPS

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.url}`,
      301
    );
  }
}
```

#### FTP/SFTP Connections
- Prefer SFTP over FTP when possible
- Validate SSL certificates
- Use key-based authentication when supported
- Timeout connections after 30 seconds of inactivity

### Logging & Monitoring

#### Audit Logging
All sensitive operations logged:
- User authentication attempts
- FTP/S3 connections
- File modifications
- Permission changes
- Failed access attempts

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  status: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

#### Security Monitoring
Monitor for:
- Multiple failed login attempts (> 5 in 5 minutes)
- Unusual API usage patterns
- Large file transfers
- Privilege escalation attempts

#### Log Sanitization
Never log:
- Passwords or API keys
- Session tokens
- Encrypted credentials
- Personal identifiable information (PII)

### Dependency Security

#### Regular Updates
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies quarterly
npm update
```

#### Dependabot Configuration
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### Deployment Security

#### Environment Isolation
- Separate databases for dev/staging/production
- Different API keys per environment
- Production environment variables never in code

#### Secrets Management
- Use platform-provided secret storage (Vercel, AWS Secrets Manager)
- Never store secrets in git history
- Use `.gitignore` for sensitive files

```gitignore
.env.local
.env.production
*.pem
*.key
```

## Security Checklist for Developers

Before deploying:
- [ ] All dependencies updated and audited
- [ ] No sensitive data in code or logs
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced in production
- [ ] Rate limiting configured
- [ ] Input validation on all API routes
- [ ] CORS policy properly configured
- [ ] CSP headers set correctly
- [ ] Credentials encrypted before storage
- [ ] Audit logging implemented
- [ ] Error messages don't leak sensitive info
- [ ] Test with security headers analyzer

## Security Tools

Recommended tools for security testing:
- **OWASP ZAP**: Web application security scanner
- **npm audit**: Dependency vulnerability scanner
- **Snyk**: Real-time vulnerability monitoring
- **ESLint security plugin**: Static code analysis
- **SonarQube**: Code quality and security analysis

## Compliance

EzEdit v2 follows security best practices for:
- OWASP Top 10 vulnerabilities
- GDPR data protection requirements
- SOC 2 compliance standards

## Contact

For security concerns: **security@ezedit.dev**

---

*Last updated: November 2025*
