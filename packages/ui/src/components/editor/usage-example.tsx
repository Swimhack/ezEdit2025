import React, { useState } from 'react';
import { ThreePaneEditorFactory } from './factory';

/**
 * This is an example of how to use the ThreePaneEditorFactory
 * in the ezEdit application components
 */
export const EditorExample: React.FC = () => {
  // Initial states
  const [originalCode] = useState(`
// Original JavaScript code
function calculateArea(radius) {
  return Math.PI * radius * radius;
}

// Usage
const area = calculateArea(5);
console.log("The area is: " + area);
  `.trim());
  
  const [editedCode, setEditedCode] = useState(`
// Improved TypeScript version
function calculateArea(radius: number): number {
  return Math.PI * Math.pow(radius, 2);
}

// Usage with proper typing
const area: number = calculateArea(5);
console.log(\`The area is: \${area.toFixed(2)}\`);
  `.trim());
  
  // Example chat content
  const chatContent = (
    <div className="flex flex-col space-y-4">
      <div className="bg-purple-50 p-2 rounded-lg">
        <p className="text-sm font-medium">Klein AI</p>
        <p className="text-sm mt-1">
          I've updated the JavaScript code to TypeScript with proper type annotations.
          I also improved the string formatting using template literals and added
          number formatting with toFixed(2).
        </p>
      </div>
      <div className="bg-blue-50 p-2 rounded-lg">
        <p className="text-sm font-medium">You</p>
        <p className="text-sm mt-1">
          Can you explain why you used Math.pow instead of the multiplication?
        </p>
      </div>
      <div className="bg-purple-50 p-2 rounded-lg">
        <p className="text-sm font-medium">Klein AI</p>
        <p className="text-sm mt-1">
          Math.pow(radius, 2) is often considered more readable for squaring 
          operations as it explicitly shows the intention to square the number.
          However, for simple squaring, radius * radius is actually more efficient.
          Would you like me to change it back?
        </p>
      </div>
    </div>
  );
  
  // Handle changes
  const handleEditChange = (newCode: string) => {
    setEditedCode(newCode);
  };
  
  // Handle patch apply
  const handleApplyPatch = (patch: string) => {
    console.log("Applying patch:", patch);
    // In a real app, this would save the changes or update state
  };
  
  return (
    <div className="h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">EzEdit Three-Pane Editor</h1>
      
      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Standard Editor</h2>
          <div className="h-96 border rounded-md overflow-hidden">
            <ThreePaneEditorFactory.Standard
              originalContent={originalCode}
              editedContent={editedCode}
              language="typescript"
              onEditChange={handleEditChange}
              onApplyPatch={handleApplyPatch}
              chatAssistContent={chatContent}
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Dark Editor</h2>
          <div className="h-96 border rounded-md overflow-hidden">
            <ThreePaneEditorFactory.Dark
              originalContent={originalCode}
              editedContent={editedCode}
              language="typescript"
              onEditChange={handleEditChange}
              chatAssistContent={chatContent}
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">AI-Focused Editor</h2>
          <div className="h-96 border rounded-md overflow-hidden">
            <ThreePaneEditorFactory.AIFocused
              originalContent={originalCode}
              editedContent={editedCode}
              language="typescript"
              onEditChange={handleEditChange}
              chatAssistContent={chatContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
