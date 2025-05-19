import React from 'react';

type FileBrowserProps = {
  files: string[];
  onSelect: (filename: string) => void;
};

export default function FileBrowser({ files, onSelect }: FileBrowserProps) {
  return (
    <ul>
      {files.map(file => (
        <li key={file}>
          <button onClick={() => onSelect(file)}>{file}</button>
        </li>
      ))}
    </ul>
  );
} 