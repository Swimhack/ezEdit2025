import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar component', () => {
  it('is hidden when open prop is false', () => {
    render(
      <Sidebar open={false}>
        <div>Content</div>
      </Sidebar>
    );

    const aside = screen.getByRole('complementary'); // role of aside is complementary by default
    expect(aside.className).toContain('-translate-x-full');
  });

  it('is visible when open prop is true', () => {
    render(
      <Sidebar open={true}>
        <div>Content</div>
      </Sidebar>
    );

    const aside = screen.getByRole('complementary');
    expect(aside.className).toContain('translate-x-0');
  });
}); 