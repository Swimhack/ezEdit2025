# EzEdit Design System (v1)

## Colors

### Base Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--clr-primary` | `#2563EB` | Primary brand color, buttons, links |
| `--clr-primary-light` | `#3B82F6` | Hover states for primary elements |
| `--clr-accent` | `#14B8A6` | Success indicators, highlights |
| `--clr-bg` | `#F3F4F6` | Page background |
| `--clr-surface` | `#FFFFFF` | Cards, modals, containers |
| `--clr-text` | `#111827` | Primary text |
| `--clr-text-sub` | `#6B7280` | Secondary text, captions |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--clr-error` | `#EF4444` | Error messages, destructive actions |
| `--clr-warning` | `#F59E0B` | Warning indicators, alerts |
| `--clr-success` | `#10B981` | Success messages, confirmations |
| `--clr-border` | `#E5E7EB` | Borders, dividers |

## Typography

### Font Families
| Token | Value |
|-------|-------|
| `--font-sans` | Inter, system-ui, sans-serif |
| `--font-mono` | ui-monospace, SFMono-Regular, monospace |

### Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| h1 | 2.25rem | 600 |
| h2 | 1.875rem | 600 |
| h3 | 1.5rem | 600 |
| h4 | 1.25rem | 600 |
| h5 | 1.125rem | 600 |
| h6 | 1rem | 600 |
| Body | 1rem | 400 |
| Small | 0.875rem | 400 |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--sp-1` | 0.25rem (4px) | Tiny spacing, icons |
| `--sp-2` | 0.5rem (8px) | Small spacing, between related items |
| `--sp-3` | 1rem (16px) | Medium spacing, standard padding |
| `--sp-4` | 1.5rem (24px) | Large spacing, section padding |
| `--sp-5` | 2rem (32px) | Extra large spacing, between sections |

## Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| `--bp-sm` | 640px | Small devices (mobile landscape) |
| `--bp-md` | 768px | Medium devices (tablets) |
| `--bp-lg` | 1024px | Large devices (desktops) |
| `--bp-xl` | 1280px | Extra large devices (large desktops) |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px 0 rgba(0, 0, 0, 0.05) | Subtle elevation |
| `--shadow-md` | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) | Medium elevation |
| `--shadow-lg` | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) | High elevation |

## Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms cubic-bezier(0.4, 0, 0.2, 1) | Quick interactions |
| `--transition-normal` | 300ms cubic-bezier(0.4, 0, 0.2, 1) | Standard transitions |

## Components

### Buttons
- `.btn` - Base button style
- `.btn-accent` - Accent colored button
- `.btn-outline` - Outlined button style

### Cards
- `.card` - Container with shadow and rounded corners

### Status Indicators
- `.status` - Base status pill
- `.status-success` - Success indicator
- `.status-error` - Error indicator
- `.status-warning` - Warning indicator

### Layout
- `.container` - Responsive container with auto margins
- `.grid` - CSS Grid container
- `.row` - Flexbox row container
- `.col` - Column within a row

### Utility Classes
- Spacing: `.mt-1`, `.mb-2`, `.p-3`, etc.
- Flexbox: `.flex`, `.flex-col`, `.items-center`, `.justify-between`
- Typography: `.text-sm`, `.text-lg`, `.font-bold`, `.text-center`
- Colors: `.text-primary`, `.bg-surface`
- Responsive: `.sm\:flex`, `.md\:hidden`, etc.

_This doc is synced with **public/styles.css**. Update both together._
