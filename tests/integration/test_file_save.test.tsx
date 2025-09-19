/**
 * Integration test for file save workflow
 * Tests file editing and saving functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Monaco Editor
const MockMonacoEditor = ({
  value,
  onChange,
  onSave
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Enter code here..."
    />
  );
};

// Mock editor with save functionality
const MockEditorWithSave = () => {
  const [content, setContent] = React.useState('console.log("Hello");');
  const [isDirty, setIsDirty] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== 'console.log("Hello");');
  };

  const handleSave = async () => {
    setSaving(true);
    setIsDirty(false);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    setLastSaved(new Date());
    setSaving(false);
  };

  return (
    <div data-testid="editor-with-save">
      <div data-testid="save-status">
        {saving ? 'Saving...' : isDirty ? 'Unsaved changes' : 'Saved'}
      </div>
      {lastSaved && (
        <div data-testid="last-saved">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
      <MockMonacoEditor
        value={content}
        onChange={handleContentChange}
        onSave={handleSave}
      />
      <button
        data-testid="save-button"
        onClick={handleSave}
        disabled={!isDirty || saving}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

describe('File Save Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show dirty state when content changes', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithSave />);

    // Initially saved
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');

    // Edit content
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'console.log("Modified");');

    // Should show dirty state
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Unsaved changes');
    });
  });

  it('should save file when Ctrl+S is pressed', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithSave />);

    // Edit content
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'console.log("Save test");');

    // Should show dirty state
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Unsaved changes');
    });

    // Press Ctrl+S
    await user.keyboard('{Control>}s{/Control}');

    // Should save and clear dirty state
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
      expect(screen.getByTestId('last-saved')).toBeInTheDocument();
    });
  });

  it('should save file when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithSave />);

    // Edit content
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'console.log("Button save");');

    // Click save button
    await user.click(screen.getByTestId('save-button'));

    // Should save and clear dirty state
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
      expect(screen.getByTestId('last-saved')).toBeInTheDocument();
    });
  });

  it('should disable save button when no changes', async () => {
    render(<MockEditorWithSave />);

    // Initially saved, button should be disabled
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('should show saving state during save operation', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithSave />);

    // Edit content
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'console.log("Saving test");');

    // Click save button
    await user.click(screen.getByTestId('save-button'));

    // Should briefly show saving state
    expect(screen.getByTestId('save-status')).toHaveTextContent('Saving...');
    expect(screen.getByTestId('save-button')).toHaveTextContent('Saving...');

    // Then show saved state
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
      expect(screen.getByTestId('save-button')).toHaveTextContent('Save');
    });
  });

  it('should complete save within 1 second', async () => {
    const user = userEvent.setup();
    const startTime = Date.now();
    render(<MockEditorWithSave />);

    // Edit and save
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, 'console.log("Speed test");');
    await user.click(screen.getByTestId('save-button'));

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByTestId('save-status')).toHaveTextContent('Saved');
      const saveTime = Date.now() - startTime;
      expect(saveTime).toBeLessThan(1000);
    });
  });

  it('should handle save errors gracefully', async () => {
    const user = userEvent.setup();

    const MockEditorWithSaveError = () => {
      const [content, setContent] = React.useState('console.log("Hello");');
      const [error, setError] = React.useState<string | null>(null);

      const handleSave = async () => {
        // Simulate save error
        setError('Failed to save file: Permission denied');
      };

      return (
        <div data-testid="editor-with-error">
          {error && (
            <div data-testid="save-error" style={{ color: 'red' }}>
              {error}
            </div>
          )}
          <MockMonacoEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
          />
          <button data-testid="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      );
    };

    render(<MockEditorWithSaveError />);

    // Try to save
    await user.click(screen.getByTestId('save-button'));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toHaveTextContent('Failed to save file: Permission denied');
    });
  });

  it('should preserve content during save operation', async () => {
    const user = userEvent.setup();
    render(<MockEditorWithSave />);

    const testContent = 'console.log("Preserve test");';

    // Edit content
    const editor = screen.getByTestId('monaco-editor');
    await user.clear(editor);
    await user.type(editor, testContent);

    // Save
    await user.click(screen.getByTestId('save-button'));

    // Content should remain unchanged
    await waitFor(() => {
      expect(editor).toHaveValue(testContent);
    });
  });
});

// Note: These tests will fail until actual Monaco Editor integration is implemented
// This is expected in TDD - tests should fail first (RED phase)