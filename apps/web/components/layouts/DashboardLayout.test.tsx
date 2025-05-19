import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardLayout } from './DashboardLayout';

function MockEditor() {
  return <div>Editor</div>;
}

function MockDrawer() {
  return <div>Drawer</div>;
}

describe('DashboardLayout', () => {
  it('toggles sidebar when mobile menu button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DashboardLayout>
        <div>SidebarContent</div>
        <MockEditor />
        <MockDrawer />
      </DashboardLayout>
    );

    // Sidebar starts hidden
    const sidebar = screen.getByRole('complementary');
    expect(sidebar.className).toContain('-translate-x-full');

    // Click menu button
    const menuButton = screen.getByRole('button', { name: /open sidebar/i });
    await user.click(menuButton);

    // Sidebar should be visible
    expect(sidebar.className).toContain('translate-x-0');
  });
}); 