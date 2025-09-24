# Quickstart: Fix File Display with Split Screen Editor

**Feature**: 014-please-fix-the | **Date**: 2025-09-20

## Quick Validation Scenarios

### Pre-Implementation Test Checklist
*Run these tests BEFORE implementation to ensure they fail (TDD approach)*

#### 1. Basic File Display Test
```bash
# Test file content loading in middle pane
1. Navigate to file tree
2. Select any .js, .md, or .html file
3. Verify: File content displays in middle pane without errors
4. Expected: SHOULD FAIL (files not showing properly currently)
```

#### 2. View Mode Switching Test
```bash
# Test mode switching functionality
1. Open a markdown file
2. Look for Code/WYSIWYG toggle buttons
3. Try to switch between modes
4. Expected: SHOULD FAIL (feature doesn't exist yet)
```

#### 3. Split Screen Test
```bash
# Test split screen functionality
1. Open any supported file
2. Look for split screen option/button
3. Try to enable split view
4. Expected: SHOULD FAIL (split screen not implemented)
```

#### 4. File Type Support Test
```bash
# Test different file type handling
1. Open .html file - should support WYSIWYG
2. Open .md file - should support WYSIWYG
3. Open .js file - should support code view only
4. Open .json file - should support formatted view
5. Expected: SHOULD FAIL (WYSIWYG modes not available)
```

## Post-Implementation Validation

### Test Scenario 1: File Content Loading
**Objective**: Verify files display properly in middle pane

**Steps**:
1. Open file tree in left sidebar
2. Select `test-files/sample.md`
3. Verify content loads in middle pane
4. Check for proper formatting and no display errors

**Expected Results**:
- File content displays immediately (< 200ms)
- Text is properly formatted and readable
- No JavaScript errors in console
- File metadata (size, type) is visible

**Pass Criteria**:
- ✅ Content loads within 200ms
- ✅ No display corruption or errors
- ✅ File information is accurate

### Test Scenario 2: View Mode Switching
**Objective**: Verify seamless switching between code and WYSIWYG modes

**Steps**:
1. Open `test-files/sample.md` (markdown file)
2. Verify default mode is CODE
3. Click WYSIWYG toggle button
4. Verify content switches to rendered markdown
5. Click CODE toggle to return to raw view

**Expected Results**:
- Mode switching occurs instantly (< 100ms)
- Content is preserved during mode switches
- Visual indicators show current active mode
- No content loss or corruption

**Pass Criteria**:
- ✅ Mode switching under 100ms
- ✅ Content integrity maintained
- ✅ Clear mode indicators visible

### Test Scenario 3: Split Screen Functionality
**Objective**: Verify split screen works with independent pane controls

**Steps**:
1. Open `test-files/sample.html` file
2. Click "Split Screen" button/toggle
3. Verify left pane shows CODE view
4. Verify right pane shows WYSIWYG view
5. Resize split panes by dragging divider
6. Change mode in left pane only
7. Verify right pane remains unchanged

**Expected Results**:
- Split view activates smoothly
- Both panes display content simultaneously
- Panes are independently controllable
- Resize functionality works smoothly (60fps)
- Content stays synchronized

**Pass Criteria**:
- ✅ Split activation under 200ms
- ✅ Independent pane control works
- ✅ Smooth resize at 60fps
- ✅ Content synchronization maintained

### Test Scenario 4: File Type Support Matrix
**Objective**: Verify correct view modes for different file types

**File Type Tests**:

#### HTML Files (`test-files/sample.html`)
- Default: CODE mode
- Available: CODE, WYSIWYG, SPLIT
- WYSIWYG: Renders as preview in iframe/shadow DOM
- Expected: Live HTML preview with proper styling

#### Markdown Files (`test-files/sample.md`)
- Default: CODE mode
- Available: CODE, WYSIWYG, SPLIT
- WYSIWYG: Renders with markdown parser
- Expected: Formatted text with headings, lists, links

#### JavaScript Files (`test-files/sample.js`)
- Default: CODE mode
- Available: CODE only
- WYSIWYG: Not available
- Expected: Syntax highlighting, proper indentation

#### CSS Files (`test-files/sample.css`)
- Default: CODE mode
- Available: CODE, WYSIWYG
- WYSIWYG: Shows color swatches and formatted rules
- Expected: Syntax highlighting with color previews

#### JSON Files (`test-files/sample.json`)
- Default: CODE mode
- Available: CODE, WYSIWYG
- WYSIWYG: Tree view with collapsible sections
- Expected: Formatted JSON with validation

**Pass Criteria**:
- ✅ Each file type loads in correct default mode
- ✅ Only supported modes are available
- ✅ WYSIWYG rendering is accurate for each type

### Test Scenario 5: Performance Validation
**Objective**: Verify performance meets specified targets

**Large File Test** (`test-files/large.js` - 4MB file):
1. Open large JavaScript file
2. Measure load time
3. Test syntax highlighting performance
4. Verify smooth scrolling
5. Test mode switching speed

**Multiple Files Test**:
1. Open 5 different files in sequence
2. Switch between them rapidly
3. Test split screen with 2 large files
4. Monitor memory usage

**Performance Targets**:
- File load: < 200ms
- Mode switching: < 100ms
- Smooth editing: 60fps
- Memory usage: < 100MB for 5MB total content

**Pass Criteria**:
- ✅ All timing targets met
- ✅ No memory leaks detected
- ✅ Smooth user interactions

### Test Scenario 6: User Preference Persistence
**Objective**: Verify user preferences are saved and restored

**Steps**:
1. Set split ratio to 30/70
2. Change theme to dark mode
3. Set font size to 16px
4. Enable word wrap
5. Refresh browser page
6. Verify all settings are restored
7. Open new file type
8. Change default mode preference
9. Verify preference applies to similar files

**Expected Results**:
- All visual preferences persist across sessions
- File type preferences apply automatically
- Settings restore within 500ms of page load

**Pass Criteria**:
- ✅ Visual preferences restored on refresh
- ✅ File type preferences work correctly
- ✅ Settings restoration under 500ms

### Test Scenario 7: Error Handling and Edge Cases
**Objective**: Verify graceful handling of problem scenarios

**Unsupported File Test** (`test-files/binary.exe`):
1. Attempt to open binary file
2. Verify appropriate error message
3. Verify no application crash

**Large File Test** (`test-files/huge.txt` - 12MB file):
1. Attempt to open file exceeding 10MB limit
2. Verify file size warning appears
3. Verify fallback options provided

**Corrupted File Test** (`test-files/corrupted.md`):
1. Open file with invalid encoding
2. Verify graceful degradation
3. Verify error recovery options

**Network Issues Test**:
1. Simulate slow network
2. Verify loading indicators appear
3. Test timeout handling

**Pass Criteria**:
- ✅ Clear error messages for all scenarios
- ✅ No application crashes
- ✅ Appropriate fallback options provided
- ✅ Loading states visible during delays

### Test Scenario 8: Accessibility Validation
**Objective**: Verify WCAG 2.2 compliance and keyboard navigation

**Keyboard Navigation Test**:
1. Navigate entire interface using only keyboard
2. Tab through all mode switching controls
3. Test split pane resize with keyboard
4. Verify focus indicators are visible

**Screen Reader Test**:
1. Test with screen reader software
2. Verify proper ARIA labels on mode controls
3. Test file content accessibility
4. Verify status announcements for mode changes

**Color Contrast Test**:
1. Test in high contrast mode
2. Verify all text meets 4.5:1 contrast ratio
3. Test with different themes

**Pass Criteria**:
- ✅ Full keyboard navigation support
- ✅ Screen reader compatibility
- ✅ WCAG 2.2 AA compliance
- ✅ High contrast mode support

## Test Data Setup

### Required Test Files
Create these files in `test-files/` directory for validation:

```
test-files/
├── sample.md           # 2KB markdown with various formatting
├── sample.html         # 3KB HTML with CSS and basic styling
├── sample.js           # 5KB JavaScript with functions and comments
├── sample.css          # 1KB CSS with colors and animations
├── sample.json         # 2KB JSON with nested objects and arrays
├── large.js            # 4MB JavaScript file for performance testing
├── huge.txt            # 12MB text file for size limit testing
├── binary.exe          # Binary file for unsupported type testing
└── corrupted.md        # File with invalid encoding for error testing
```

### Sample Content Templates

#### sample.md
```markdown
# Test Document

This is a **test document** for validating markdown rendering.

## Features to Test
- List items
- [Links](https://example.com)
- `code blocks`

### Code Example
```javascript
function test() {
  return "Hello World";
}
```

> Blockquote test
```

#### sample.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test HTML</title>
  <style>
    .highlight { background: yellow; }
    .blue-text { color: blue; }
  </style>
</head>
<body>
  <h1 class="blue-text">Test HTML Document</h1>
  <p class="highlight">This tests HTML WYSIWYG rendering.</p>
  <button onclick="alert('Test')">Click Me</button>
</body>
</html>
```

## Success Metrics

### Functional Success
- [ ] All test scenarios pass without manual intervention
- [ ] No JavaScript errors in console during any test
- [ ] All file types render correctly in their supported modes
- [ ] Split screen functionality works smoothly

### Performance Success
- [ ] File loading under 200ms for files < 5MB
- [ ] Mode switching under 100ms consistently
- [ ] 60fps performance during scrolling and editing
- [ ] Memory usage stays under 100MB for normal workflows

### User Experience Success
- [ ] Intuitive mode switching with clear visual feedback
- [ ] Responsive design works on mobile devices
- [ ] Accessibility requirements fully met
- [ ] Error messages are helpful and actionable

### Technical Success
- [ ] Integration with existing FTP editor is seamless
- [ ] No regression in existing file tree functionality
- [ ] State persistence works reliably
- [ ] API contracts are fully implemented

## Rollback Plan

If critical issues are discovered:

### Level 1 - Quick Fixes (< 1 hour)
- Disable WYSIWYG mode and keep code view only
- Remove split screen and maintain single pane view
- Keep file loading improvements

### Level 2 - Partial Rollback (< 4 hours)
- Revert to previous file display system
- Keep performance improvements
- Maintain new file type detection

### Level 3 - Full Rollback (< 8 hours)
- Complete revert to previous system
- Database state cleanup if needed
- User preference reset to defaults

## Monitoring and Alerts

### Post-Launch Monitoring
- File load time metrics (target: < 200ms average)
- Mode switching performance (target: < 100ms average)
- Error rate monitoring (target: < 1% of operations)
- User session metrics (time spent in each mode)

### Alert Thresholds
- File load time > 500ms for 5+ consecutive requests
- JavaScript errors > 10 per hour
- Mode switching failures > 5% of attempts
- Memory usage > 200MB for single session

---

**Expected Timeline**: 2-3 hours for full validation
**Required Resources**: Test files, multiple browsers, accessibility tools
**Success Gate**: All scenarios pass before considering feature complete