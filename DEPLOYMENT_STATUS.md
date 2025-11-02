# Deployment Status

## Current Features (Live)

✅ **Working:**
- Homepage with brand-matched design
- Pricing page
- Editor interface (3-pane layout)
- File explorer
- Monaco code editor
- Multi-platform connections (FTP, SFTP, WordPress, Wix)
- Connection credential management
- Dark mode toggle

## Coming Soon

⏳ **In Development:**
- User authentication (Supabase)
- AI-powered natural language updates
- SEO optimization tools
- Managed service dashboard

## Known Issues

🔧 **Temporarily Disabled:**
- `/auth/register` and `/auth/login` routes (auth system pending)
  - **Workaround**: Use the editor directly without login
  - Users can save connections locally in browser

## MVP Strategy

For the initial launch:
1. **No authentication required** - Users access editor directly
2. **Local storage** for saved connections
3. **Focus on core editing** - FTP/SFTP/WordPress/Wix integration
4. **Manual updates service** - Contact form for managed tier

## Environment Variables Needed

For full functionality, set these in deployment:

```bash
# Optional - For AI features
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Optional - For authentication (coming soon)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Production URLs

- **Fly.io**: https://ezedit2025.fly.dev
- **Vercel**: https://ezedit-2025.vercel.app (auto-deploys from GitHub)
- **GitHub**: https://github.com/Swimhack/ezEdit2025

---

*Last Updated: November 2025*
