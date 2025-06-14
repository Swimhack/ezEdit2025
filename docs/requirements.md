# Product Requirements

## Functional Requirements
1. Users can create and save multiple FTP profiles (host, port, username, encrypted password).
2. File-explorer pane lists the live directory tree with < 300 ms response for ≤ 1 000 files.
3. Monaco editor pane supports syntax highlighting, diff view, undo/redo, and search-replace.
4. AI assistant pane can: (a) explain selected code, (b) suggest fixes, (c) generate snippets, (d) run one-click refactor.
5. Saving uploads the edited file to the server and updates local cache.
6. Supabase magic-link email auth controls access.

## Non-Functional Requirements
- Average keystroke latency ≤ 100 ms.  
- Handle concurrent edits with optimistic locking and last-writer-wins resolution.  
- 99.5 % monthly uptime; graceful degradation for AI features.  
- GDPR-compliant data storage and logging.
