# System Architecture
```mermaid
graph LR
A[Browser – React + monaco-react]
B[AI Assistant – Goose / Codex]
C[Edge API – Cloudflare Worker + FTP Proxy]
D[Supabase – Auth & DB]
A -- AI calls --> B
A -- REST / WS --> C
C --> D
```

| Layer  | Tech                             | Rationale                                         |
|--------|----------------------------------|---------------------------------------------------|
| UI     | React + Tailwind + monaco-react  | VS Code-like editing in browser                   |
| AI     | Goose (Claude) + OpenAI Codex    | Hybrid reasoning & code generation                |
| BFF    | Cloudflare Workers               | Serverless edge latency, scalable proxy           |
| Storage| Supabase                         | Built-in auth, RLS, S3-compatible storage         |
| FTP    | ssh2-sftp-client                 | Secure SFTP fallback for legacy TLS               |
