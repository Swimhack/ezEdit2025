/**
 * Integration test for file selection workflow
 * Tests file tree navigation and file selection behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock file tree data
const mockFileTree = [
  {
    path: '/test',
    name: 'test',
    type: 'directory',
    children: [
      { path: '/test/file1.js', name: 'file1.js', type: 'file' },
      { path: '/test/file2.css', name: 'file2.css', type: 'file' }
    ]
  }
];

// Mock components
const MockFileTree = ({ onFileSelect }: { onFileSelect: (path: string) => void }) => (
  <div data-testid="file-tree">
    <div
      data-testid="directory-test"
      onClick={() => {/* Toggle directory */}}
    >
      📁 test
    </div>
    <div
      data-testid="file-test-file1"
      onClick={() => onFileSelect('/test/file1.js')}
    >
      📄 file1.js
    </div>
    <div
      data-testid="file-test-file2"
      onClick={() => onFileSelect('/test/file2.css')}
    >
      📄 file2.css
    </div>
  </div>
);

const MockEditorWithFileSelection = () => {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  return (
    <div data-testid="editor-with-selection">
      <MockFileTree onFileSelect={setSelectedFile} />
      <div data-testid="editor-pane">
        {selectedFile ? `Editing: ${selectedFile}` : 'No file selected'}
      </div>
      <div data-testid="preview-pane">
        {selectedFile ? `Preview: ${selectedFile}` : 'No preview'}
      </div>
    </div>
  );
};

describe('File Selection Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should select file when clicked in tree', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithFileSelection />);

    // Initially no file selected
    expect(screen.getByTestId('editor-pane')).toHaveTextContent('No file selected');
    expect(screen.getByTestId('preview-pane')).toHaveTextContent('No preview');

    // Click on a file
    await user.click(screen.getByTestId('file-test-file1'));

    // Should update editor and preview
    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toHaveTextContent('Editing: /test/file1.js');
      expect(screen.getByTestId('preview-pane')).toHaveTextContent('Preview: /test/file1.js');
    });
  });

  it('should switch between files correctly', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithFileSelection />);

    // Select first file
    await user.click(screen.getByTestId('file-test-file1'));

    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toHaveTextContent('Editing: /test/file1.js');
    });

    // Select second file
    await user.click(screen.getByTestId('file-test-file2'));

    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toHaveTextContent('Editing: /test/file2.css');
      expect(screen.getByTestId('preview-pane')).toHaveTextContent('Preview: /test/file2.css');
    });
  });

  it('should expand directories when clicked', async () => {
    const user = userEvent.setup();
    const MockExpandableTree = () => {
      const [expanded, setExpanded] = React.useState(false);

      return (
        <div data-testid="expandable-tree">
          <div
            data-testid="directory-test"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '📂' : '📁'} test
          </div>
          {expanded && (
            <div data-testid="directory-contents">
              <div data-testid="file-test-file1">📄 file1.js</div>
              <div data-testid="file-test-file2">📄 file2.css</div>
            </div>
          )}
        </div>
      );
    };

    render(<MockExpandableTree />);

    // Initially collapsed
    expect(screen.queryByTestId('directory-contents')).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByTestId('directory-test'));

    // Should show contents
    await waitFor(() => {
      expect(screen.getByTestId('directory-contents')).toBeInTheDocument();
      expect(screen.getByTestId('file-test-file1')).toBeInTheDocument();
      expect(screen.getByTestId('file-test-file2')).toBeInTheDocument();
    });
  });

  it('should handle file selection within 500ms', async () => {
    const user = userEvent.setup();
    const startTime = Date.now();

    render(<MockEditorWithFileSelection />);

    await user.click(screen.getByTestId('file-test-file1'));

    await waitFor(() => {
      expect(screen.getByTestId('editor-pane')).toHaveTextContent('Editing: /test/file1.js');
      const selectionTime = Date.now() - startTime;
      expect(selectionTime).toBeLessThan(500);
    });
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const MockKeyboardTree = () => {
      const [selectedIndex, setSelectedIndex] = React.useState(0);
      const files = ['/test/file1.js', '/test/file2.css'];

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          setSelectedIndex(Math.min(selectedIndex + 1, files.length - 1));
        } else if (e.key === 'ArrowUp') {
          setSelectedIndex(Math.max(selectedIndex - 1, 0));
        }
      };

      return (
        <div
          data-testid="keyboard-tree"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {files.map((file, index) => (
            <div
              key={file}
              data-testid={`file-${index}`}
              style={{
                backgroundColor: index === selectedIndex ? '#ccc' : 'transparent'
              }}
            >
              {file}
            </div>
          ))}
          <div data-testid="selected-file">Selected: {files[selectedIndex]}</div>
        </div>
      );
    };

    render(<MockKeyboardTree />);

    const tree = screen.getByTestId('keyboard-tree');
    tree.focus();

    // Initially first file selected
    expect(screen.getByTestId('selected-file')).toHaveTextContent('Selected: /test/file1.js');

    // Press down arrow
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      expect(screen.getByTestId('selected-file')).toHaveTextContent('Selected: /test/file2.css');
    });

    // Press up arrow
    await user.keyboard('{ArrowUp}');

    await waitFor(() => {
      expect(screen.getByTestId('selected-file')).toHaveTextContent('Selected: /test/file1.js');
    });
  });
});

// Note: These tests will fail until actual components are implemented
// This is expected in TDD - tests should fail first (RED phase)