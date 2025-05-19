import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileBrowser from './FileBrowser';

const mockFiles = [
  'index.html',
  'about.html',
  'styles.css',
];

describe('FileBrowser', () => {
  it('renders a list of files', () => {
    render(<FileBrowser files={mockFiles} onSelect={() => {}} />);
    mockFiles.forEach(file => {
      expect(screen.getByText(file)).toBeInTheDocument();
    });
  });

  it('calls onSelect when a file is clicked', () => {
    const onSelect = vi.fn();
    render(<FileBrowser files={mockFiles} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('about.html'));
    expect(onSelect).toHaveBeenCalledWith('about.html');
  });
}); 