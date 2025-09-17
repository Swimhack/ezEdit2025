# EzEdit Quickstart Guide

**Version**: 1.0.0
**Time to Complete**: 30 minutes

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL database (or Supabase account)
- Stripe account (test mode)
- OpenAI or Anthropic API key

## 1. Environment Setup (5 minutes)

### Clone and Install
```bash
# Clone the repository
git clone https://github.com/strickland/ezedit.git
cd ezedit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Configure Environment Variables
Edit `.env.local` with your credentials:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Models
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Database Setup (5 minutes)

### Run Migrations
```bash
# Apply database schema
npx supabase db push

# Or if using local PostgreSQL
npm run db:migrate
```

### Verify Database
```bash
# Check tables created
npx supabase db dump --schema public
```

Expected tables:
- profiles
- organizations
- sites
- memberships
- content
- ai_prompts

## 3. Start Development Server (2 minutes)

```bash
# Start Next.js development server
npm run dev

# In another terminal, start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Visit http://localhost:3000 - you should see the EzEdit landing page.

## 4. Create Your First Account (3 minutes)

### Sign Up Flow
1. Click "Get Started" on the homepage
2. Enter email and password
3. Verify email (check inbox)
4. Complete profile setup
5. Create organization

### Verify Account Creation
```bash
# Check user in database
npx supabase db query "SELECT * FROM profiles WHERE email='your@email.com'"
```

## 5. Generate Your First Site (5 minutes)

### Natural Language Generation
1. Navigate to Dashboard
2. Click "Create New Site"
3. Enter prompt:
   ```
   Create a fitness coaching website for powerlifting programs.
   Include member areas, program library, and progress tracking.
   Use a dark theme with blue accents.
   ```
4. Review generated preview
5. Click "Create Site"

### Verify Site Creation
```bash
# Check site in database
npx supabase db query "SELECT * FROM sites WHERE org_id='your_org_id'"
```

## 6. Test Membership Flow (5 minutes)

### Create Membership Tier
1. Go to Site Settings
2. Add Membership Tier:
   - Name: "Premium"
   - Price: $29/month
   - Access: All programs
3. Save tier configuration

### Test Subscription
1. Open site in incognito window
2. Click "Join Premium"
3. Use test card: 4242 4242 4242 4242
4. Complete checkout
5. Verify member access

## 7. Add Content (5 minutes)

### Create Program via AI
1. In site dashboard, click "Add Content"
2. Select "Generate with AI"
3. Enter prompt:
   ```
   Create a 12-week bench press program for intermediate lifters.
   Include weekly progression, form cues, and video placeholders.
   ```
4. Review and publish

### Manual Content Creation
1. Click "Add Content" > "Create Manually"
2. Add page with title and content
3. Set access level (public/members)
4. Publish content

## 8. Verify Complete Flow (5 minutes)

### Test Checklist
- [ ] User can sign up and verify email
- [ ] User can create organization
- [ ] AI generates site from prompt
- [ ] Site publishes at subdomain
- [ ] Membership checkout works
- [ ] Content access control works
- [ ] Program progress tracking works

### Run Integration Tests
```bash
# Run test suite
npm test

# Run specific flow tests
npm test -- --testPathPattern=flows
```

## Common Issues & Solutions

### Database Connection Failed
```
Error: Connection to Supabase failed
```
**Solution**: Verify SUPABASE_URL and keys in .env.local

### AI Generation Timeout
```
Error: Generation took too long
```
**Solution**: Check AI API keys and rate limits

### Stripe Webhook Failed
```
Error: Webhook signature verification failed
```
**Solution**: Update STRIPE_WEBHOOK_SECRET from Stripe dashboard

### Site Not Loading
```
Error: 404 on subdomain
```
**Solution**: Check subdomain configuration and DNS settings

## Next Steps

### Customize Your Platform
1. Modify theme in `/app/globals.css`
2. Add custom components in `/components`
3. Extend AI prompts in `/lib/ai/prompts`

### Deploy to Production
1. Set up Fly.io or Vercel account
2. Configure production environment variables
3. Run production build: `npm run build`
4. Deploy: `fly deploy` or `vercel`

### Enable Advanced Features
- Custom domains: Configure DNS and SSL
- Email notifications: Set up SendGrid/Resend
- Analytics: Add PostHog or Plausible
- CDN: Configure Cloudflare

## Support Resources

- Documentation: https://docs.ezedit.co
- API Reference: https://api.ezedit.co/docs
- Community: https://discord.gg/ezedit
- Support: support@ezedit.co

## Success Metrics

After completing this quickstart, you should have:
- ✅ Local development environment running
- ✅ User account with organization
- ✅ AI-generated site with custom subdomain
- ✅ Working membership subscription
- ✅ Content with access control
- ✅ All tests passing

Congratulations! You've successfully set up EzEdit and created your first AI-powered membership site.