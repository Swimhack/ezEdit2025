import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App', () => {
  beforeAll(() => {
    // Mock window.matchMedia which is required by some components
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the main layout components', () => {
    render(<App />);
    
    // Check for header
    expect(screen.getByText('EzEdit')).toBeInTheDocument();
    
    // Check for main sections
    expect(screen.getByText('FileBrowser')).toBeInTheDocument();
    expect(screen.getByText('Monaco Editor')).toBeInTheDocument();
    expect(screen.getByText('TinyMCE Preview')).toBeInTheDocument();
    expect(screen.getByText('AI Refactor Chat')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<App />);
    
    // Check for main container
    const mainContainer = document.querySelector('main');
    expect(mainContainer).toHaveStyle({
      display: 'flex',
      gap: '2rem',
      padding: '2rem'
    });

    // Check for sidebars
    const sidebars = document.querySelectorAll('aside');
    expect(sidebars).toHaveLength(2);
    sidebars.forEach(sidebar => {
      expect(sidebar).toHaveStyle({
        background: 'var(--ezedit-dark-blue)',
        borderRadius: '8px',
        padding: '16px'
      });
    });
  });
}); 