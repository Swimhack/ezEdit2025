# Research: Fix File Display with Split Screen Editor

**Feature**: 014-please-fix-the | **Date**: 2025-09-20

## Research Questions Resolved

### 1. File Type Support for WYSIWYG Mode
**Question**: Which file types should support WYSIWYG mode?
**Decision**: HTML, Markdown, CSS, JSON, and plain text with rich preview
**Rationale**:
- HTML provides native browser rendering support
- Markdown has excellent parsing libraries (marked.js, react-markdown)
- CSS can be previewed with syntax highlighting and color swatches
- JSON can be formatted and validated with tree view
- Plain text supports syntax highlighting for various languages
**Alternatives considered**:
- PDF files - rejected due to complexity and licensing requirements
- Word documents - rejected due to format complexity and binary nature
- Images - deferred as already handled by browser natively
- Video/Audio - rejected as not applicable for text editor context

### 2. Edit vs View Only Capabilities
**Question**: Should users be able to edit files in both modes, or just view?
**Decision**: Edit in code mode, view-only in WYSIWYG mode with live preview
**Rationale**:
- Code mode provides precise control for developers
- WYSIWYG preview prevents formatting corruption
- Live preview allows immediate visual feedback
- Maintains data integrity while providing visual context
**Alternatives considered**:
- WYSIWYG editing - rejected due to complexity and potential data loss
- View-only in both modes - rejected as not meeting editing requirements
- Bidirectional editing - rejected due to synchronization complexity

### 3. User Preference Storage Strategy
**Question**: How should view mode preferences be saved?
**Decision**: Per file type with user-level defaults, stored in Supabase user metadata
**Rationale**:
- File type preferences make logical sense (always code for .ts, WYSIWYG for .md)
- User-level defaults provide personalization
- Supabase integration maintains consistency with existing authentication
- Allows for future team/workspace-level preferences
**Alternatives considered**:
- Global preferences only - rejected as too limiting
- Per-file preferences - rejected as too granular and storage intensive
- Browser localStorage only - rejected due to device limitation

### 4. Split Screen Default Configuration
**Question**: What should be the default split screen proportions?
**Decision**: 50/50 split with user-resizable panes and preference persistence
**Rationale**:
- Equal split provides balanced view of both modes
- User resizing allows customization for different file types
- Preference persistence maintains user workflow
- Common pattern in development tools (VS Code, IntelliJ)
**Alternatives considered**:
- 60/40 split favoring code - rejected as arbitrary
- Fixed proportions - rejected due to inflexibility
- Full-screen toggle only - rejected as not meeting split screen requirement

### 5. File Size Performance Limits
**Question**: What size limit should be set for file performance?
**Decision**: 5MB soft limit with progressive degradation, 10MB hard limit
**Rationale**:
- 5MB allows most code files while maintaining performance
- Progressive degradation (disable WYSIWYG, then syntax highlighting) maintains functionality
- 10MB hard limit prevents browser crashes
- Aligns with Monaco Editor recommended limits
**Alternatives considered**:
- 1MB limit - rejected as too restrictive for legitimate use cases
- No limits - rejected due to browser memory constraints
- 50MB limit - rejected due to UI responsiveness concerns

## Technology Decisions

### Editor Implementation
**Decision**: Monaco Editor with custom WYSIWYG preview component
**Rationale**:
- Monaco Editor provides VS Code-like experience familiar to developers
- Excellent TypeScript support and syntax highlighting
- Built-in diff viewer for potential future features
- Active maintenance and strong community support
- Handles large files efficiently with virtualization
**Implementation approach**:
- Monaco for code editing mode
- Custom React component for WYSIWYG rendering
- React split-pane library for resizable panels
- Prism.js fallback for syntax highlighting in preview mode

### File Content Processing
**Decision**: Client-side processing with server-side caching
**Rationale**:
- Real-time preview without server round trips
- Reduced server load for file operations
- Better user experience with immediate feedback
- Server caching for frequently accessed files
**Implementation approach**:
- Browser-based Markdown parsing (marked.js)
- HTML sanitization (DOMPurify) for security
- Syntax highlighting (Prism.js) for code preview
- Server-side metadata caching for file properties

### State Management Architecture
**Decision**: React Context + useReducer for editor state
**Rationale**:
- Avoids over-engineering with external state libraries
- Provides predictable state updates
- Easy testing and debugging
- Scales appropriately for single-editor use case
**Implementation approach**:
- EditorContext for global editor state
- useLocalStorage hook for preference persistence
- useDebounce for performance optimization
- Custom hooks for file operations

### UI/UX Design Patterns
**Decision**: Responsive design with mobile-first considerations
**Rationale**:
- Ensures usability across devices
- Progressive enhancement for larger screens
- Maintains accessibility standards
- Future-proofs for tablet usage
**Implementation approach**:
- CSS Grid for layout with fallbacks
- Touch-friendly resize handles
- Keyboard navigation support
- Screen reader compatibility

## Performance Considerations

### File Loading Optimization
- **Lazy loading**: Load file content only when selected
- **Virtual scrolling**: Handle large files without memory issues
- **Debounced updates**: Reduce rendering frequency during rapid changes
- **Content caching**: Cache processed content to avoid re-parsing

### WYSIWYG Rendering Performance
- **Progressive enhancement**: Start with basic view, enhance with features
- **Sanitization caching**: Cache sanitized HTML to avoid re-processing
- **Image lazy loading**: Load images in preview mode on demand
- **CSS isolation**: Prevent style conflicts with iframe or shadow DOM

### Split Screen Optimization
- **Efficient re-rendering**: Use React.memo and useMemo for expensive operations
- **Resize throttling**: Limit resize events to 60fps
- **Content synchronization**: Sync scroll positions between panes
- **Memory management**: Dispose of unused editor instances

## Security Considerations

### Content Sanitization
- **HTML sanitization**: Use DOMPurify for safe HTML rendering
- **Script blocking**: Prevent XSS attacks in user content
- **Style isolation**: Scope CSS to prevent layout conflicts
- **Link validation**: Validate and warn about external links

### File Access Security
- **Path validation**: Prevent directory traversal attacks
- **File type validation**: Ensure file types match extensions
- **Content validation**: Check file headers for actual file types
- **Size limits**: Enforce strict file size limits to prevent DoS

### User Data Protection
- **Preference encryption**: Encrypt sensitive user preferences
- **Session validation**: Validate user sessions for editor access
- **Audit logging**: Log file access and modification events
- **Data minimization**: Store only necessary user preferences

## Integration Requirements

### Existing FTP Editor Integration
- **Seamless transition**: Maintain existing file tree navigation
- **Consistent styling**: Match current application design system
- **Preserved functionality**: Keep all existing file operations
- **Enhanced experience**: Improve upon current file display issues

### Monaco Editor Integration
- **Theme consistency**: Match application color scheme
- **Language support**: Support existing file types plus new ones
- **Configuration**: Maintain consistent editor settings
- **Extension points**: Allow for future editor enhancements

### File Operation Integration
- **Save functionality**: Integrate with existing file save operations
- **Undo/Redo**: Provide editor-level undo with file-level save points
- **Auto-save**: Implement optional auto-save with user preferences
- **Conflict resolution**: Handle concurrent editing scenarios

## User Experience Enhancements

### Progressive Disclosure
- **Mode indicators**: Clear visual indicators for current view mode
- **Feature discovery**: Gradual introduction of split screen features
- **Preference hints**: Suggest optimal modes for different file types
- **Keyboard shortcuts**: Provide power user shortcuts for mode switching

### Accessibility Improvements
- **Screen reader support**: Proper ARIA labels and navigation
- **Keyboard navigation**: Full keyboard control of editor features
- **High contrast**: Support for high contrast mode
- **Font scaling**: Respect user font size preferences

### Error Handling and Recovery
- **Graceful degradation**: Fallback to basic text view for unsupported files
- **Error boundaries**: Prevent editor crashes from affecting application
- **Recovery options**: Allow users to recover from editor errors
- **Clear messaging**: Provide helpful error messages and solutions

## Testing Strategy

### Component Testing
- **Editor components**: Test individual editor components in isolation
- **Mode switching**: Test transitions between view modes
- **Split screen**: Test pane resizing and content synchronization
- **File loading**: Test various file types and sizes

### Integration Testing
- **File operations**: Test complete file open/edit/save workflows
- **User preferences**: Test preference persistence and restoration
- **Performance**: Test with large files and rapid mode switching
- **Cross-browser**: Test across different browsers and devices

### User Acceptance Testing
- **Workflow validation**: Test common user workflows
- **Performance validation**: Verify performance meets targets
- **Accessibility validation**: Test with assistive technologies
- **Usability testing**: Gather feedback on user experience improvements