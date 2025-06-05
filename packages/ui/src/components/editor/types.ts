/**
 * Types for the three-pane editor component
 */

export interface EditorTheme {
  /**
   * Base theme for the Monaco editor
   */
  base: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  
  /**
   * Optional override values for editor elements
   */
  overrides?: Record<string, any>;
}

export interface EditorOptions {
  /**
   * Enable/disable line numbers
   * @default true
   */
  lineNumbers?: boolean;
  
  /**
   * Enable/disable minimap
   * @default false
   */
  minimap?: boolean;
  
  /**
   * Enable/disable word wrap
   * @default true
   */
  wordWrap?: boolean;
  
  /**
   * Enable/disable read-only mode
   * @default false for edit pane, true for original pane
   */
  readOnly?: boolean;
  
  /**
   * Additional Monaco editor options
   */
  additionalOptions?: Record<string, any>;
}

export interface EditorPaneProps {
  /**
   * Content to display in the editor
   */
  content: string;
  
  /**
   * Language for syntax highlighting
   * @default 'javascript'
   */
  language?: string;
  
  /**
   * Theme configuration
   */
  theme?: EditorTheme;
  
  /**
   * Editor options
   */
  options?: EditorOptions;
  
  /**
   * Callback for content changes
   */
  onChange?: (value: string) => void;
}

export interface ThreePaneEditorProps {
  /**
   * Original content for comparison
   */
  originalContent: string;
  
  /**
   * Edited content (initially a copy of original)
   */
  editedContent: string;
  
  /**
   * Language for syntax highlighting
   * @default 'javascript'
   */
  language?: string;
  
  /**
   * Theme configuration
   */
  theme?: EditorTheme;
  
  /**
   * Editor options for original pane
   */
  originalOptions?: EditorOptions;
  
  /**
   * Editor options for edit pane
   */
  editOptions?: EditorOptions;
  
  /**
   * Initial state of the chat assistant pane
   * @default false
   */
  chatAssistOpen?: boolean;
  
  /**
   * Content for the chat assist panel
   */
  chatAssistContent?: React.ReactNode;
  
  /**
   * Callback when the edited content changes
   */
  onEditChange?: (value: string) => void;
  
  /**
   * Callback when patch is applied
   */
  onApplyPatch?: (patch: string) => void;
  
  /**
   * Callback when patch is discarded
   */
  onDiscardPatch?: () => void;
}
