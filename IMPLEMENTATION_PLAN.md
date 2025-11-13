# EzEdit Three-Pane Editor Implementation Plan

## Current Status
- ✅ File tree loads (50 files visible)
- ✅ FTP connection works
- ❌ Files don't load when clicked
- ❌ Middle pane stays empty

## Goal
1. **Left Pane**: File browser (✅ Working)
2. **Middle Pane**: WYSIWYG/Code editor
3. **Right Pane**: AI assistant (Claude SDK)

## Immediate Fix Needed

### Issue: Files Not Loading
The file tree shows files but clicking them doesn't load content.

**Possible causes:**
1. JavaScript error preventing click handler
2. API call failing silently
3. State not updating properly
4. Browser caching old error state

**Debug Steps:**
1. Check browser console for JS errors
2. Check Network tab for failed API calls
3. Check if click handler is firing
4. Verify state updates

## Implementation Phases

### Phase 1: Fix File Loading (URGENT)
- [ ] Debug why files don't load
- [ ] Ensure API returns content
- [ ] Verify state updates
- [ ] Display content in Monaco editor

### Phase 2: Add WYSIWYG for HTML
- [ ] Detect file type (HTML vs PHP/JS/CSS)
- [ ] Use TinyMCE or CKEditor for HTML files
- [ ] Keep Monaco for code files
- [ ] Add toggle between code/visual view

### Phase 3: Add AI Assistant (Right Pane)
- [ ] Integrate Claude SDK
- [ ] Create chat interface
- [ ] Pass selected file context
- [ ] Allow AI to suggest edits
- [ ] Apply AI suggestions to editor

## Technical Decisions

### WYSIWYG Editor Options
1. **TinyMCE** - Full-featured, good for HTML
2. **CKEditor** - Modern, customizable
3. **Quill** - Lightweight, simple
4. **Draft.js** - React-based

### AI Integration
- Use Anthropic Claude SDK
- Stream responses for better UX
- Context: Current file + user message
- Actions: View, Edit, Explain, Refactor

## Next Steps
1. Fix file loading (blocking everything)
2. Add logging to identify the issue
3. Once files load, add WYSIWYG
4. Then add AI assistant
