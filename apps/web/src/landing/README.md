
# EzEdit - AI-Powered FTP/SFTP Code Editor

A modern, responsive landing page for EzEdit built with React, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS v3
- **TypeScript**: Full type safety
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **Animations**: Tailwind CSS animations

## 🎨 Features

- ✅ Fully responsive design
- ✅ Modern glassmorphism UI
- ✅ Smooth animations and transitions
- ✅ Form validation with error handling
- ✅ Toast notifications
- ✅ Video modal for demo
- ✅ Mobile-first responsive design
- ✅ Analytics tracking ready
- ✅ SEO optimized

## 🔧 Configuration

### Analytics

The project includes Plausible analytics integration. To customize:

1. Update the `data-domain` attribute in `index.html`
2. Analytics events are tracked in components using:
   ```javascript
   window.plausible('cta_click', { props: { label: 'button_name' } });
   ```

### Demo Video

To change the demo video, update the `videoId` prop in the `Hero` component:

```tsx
<VideoModal
  videoId="YOUR_YOUTUBE_VIDEO_ID"
  // ...
/>
```

### Styling

The design system is defined in:
- `src/index.css` - Custom component classes and CSS variables
- `tailwind.config.ts` - Tailwind configuration and theme
- Color scheme uses EzEdit brand colors (#1597FF primary)

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

## 🚢 Deployment

### Netlify (Recommended)

The project includes a `netlify.toml` configuration:

```bash
npm run build
# Deploy the dist/ folder to Netlify
```

### Manual Build

```bash
npm run build
# Serve the dist/ folder with any static hosting
```

## 📄 Project Structure

```
src/
├── components/
│   ├── Navigation.tsx    # Header with logo and menu
│   ├── Hero.tsx         # Main hero section
│   ├── InviteForm.tsx   # Email capture form
│   └── VideoModal.tsx   # Demo video modal
├── pages/
│   └── Index.tsx        # Main landing page
├── hooks/
│   └── use-toast.ts     # Toast notification hook
└── index.css           # Global styles and components
```

## 🎯 Performance

- Vite for fast development and optimized builds
- Tree-shaking for minimal bundle size
- Lazy-loaded components where applicable
- Optimized images and assets

## 📧 Form Handling

The invite form includes:
- Email validation with regex
- Loading states
- Error handling
- Success notifications
- Analytics tracking

To integrate with a backend, update the form submission in `InviteForm.tsx`:

```typescript
// Replace the simulated API call
const response = await fetch('/api/early-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});
```

## 🎨 Customization

### Brand Colors

Update brand colors in `tailwind.config.ts`:

```javascript
colors: {
  primary: '#1597FF', // EzEdit blue
  // Add more brand colors
}
```

### Typography

Font family is set to Inter. To change:

1. Update Google Fonts link in `index.html`
2. Update font family in `tailwind.config.ts`

## 📞 Support

For questions or support, contact the development team or refer to the component documentation.
