# Contact Form System - Setup Guide

This project includes a fully functional contact form system with email notifications (Resend) and database storage (Supabase).

## Features

- ✅ Beautiful, responsive contact form component
- ✅ Email notifications via Resend API
- ✅ Automatic confirmation emails to users
- ✅ Database storage in Supabase
- ✅ Admin dashboard for managing submissions
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Status tracking (new, in progress, completed, archived)
- ✅ Priority levels (low, normal, high, urgent)
- ✅ Internal notes for team collaboration

## Setup Instructions

### 1. Configure Environment Variables

Update your `.env.local` file with the following credentials:

```env
# Resend API for email notifications
RESEND_API_KEY=re_A7kwrDyW_9u9qeefLbf6zwjiCvMT2TUxq

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**To get your Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings > API
3. Copy the Project URL, anon/public key, and service_role key

### 2. Set Up Supabase Database

Run the SQL schema in your Supabase SQL editor:

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Open the `supabase-schema.sql` file from the project root
4. Copy and paste the SQL into the editor
5. Click "Run" to create the table and policies

This will create:
- `contact_submissions` table with all necessary fields
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-updating timestamp trigger

### 3. Configure Resend Email

**Set up your sender domain:**
1. Go to [resend.com](https://resend.com)
2. Navigate to Domains
3. Add and verify your domain (or use their free testing domain)
4. Update the `from` field in `/app/api/contact/route.ts` to match your verified domain

**Current email settings:**
- Notifications sent to: `hello@ezedit.co`
- From address: `noreply@ezedit.co`

Update these in `app/api/contact/route.ts` lines 50 and 72.

### 4. Test the Installation

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `/services#contact` to see the contact form

3. Submit a test form and verify:
   - Form submission succeeds
   - You receive a notification email
   - User receives a confirmation email
   - Submission appears in Supabase database

4. Visit `/admin` to access the admin dashboard

## Usage

### Contact Form Component

The `ContactForm` component is reusable and customizable:

```tsx
import { ContactForm } from '@/components/marketing/ContactForm';

<ContactForm 
  title="Custom Title"
  description="Custom description"
  showServiceType={true}
  defaultServiceType="website-updates"
/>
```

**Props:**
- `title`: Form heading (optional)
- `description`: Form description (optional)
- `showServiceType`: Show/hide service selection dropdown (optional)
- `defaultServiceType`: Pre-selected service type (optional)

### Admin Dashboard

Access the admin dashboard at `/admin` to:
- View all form submissions
- Filter by status (new, in progress, completed, archived)
- View detailed submission information
- Update submission status and priority
- Add internal notes
- Delete submissions

### API Endpoints

**Public:**
- `POST /api/contact` - Submit contact form

**Admin (requires authentication - add your auth later):**
- `GET /api/admin/submissions` - List all submissions
- `GET /api/admin/submissions/[id]` - Get single submission
- `PUT /api/admin/submissions/[id]` - Update submission
- `DELETE /api/admin/submissions/[id]` - Delete submission

## Security Considerations

### Current Setup
- ✅ Resend API key is server-side only
- ✅ Supabase service role key is server-side only
- ✅ Row Level Security (RLS) enabled on database
- ✅ Public can only INSERT submissions
- ✅ Admin operations use service role key

### Recommended Improvements
1. **Add Authentication** - Currently the admin dashboard has no authentication. Add authentication using:
   - Supabase Auth
   - NextAuth.js
   - Clerk
   - Auth0

2. **Rate Limiting** - Add rate limiting to prevent spam:
   - Use Vercel's built-in rate limiting
   - Implement server-side rate limiting
   - Add CAPTCHA (reCAPTCHA, hCaptcha)

3. **Email Validation** - Add email verification to prevent fake submissions

4. **Admin IP Restriction** - Restrict `/admin` route to specific IPs

## Customization

### Email Templates

Edit the HTML templates in `app/api/contact/route.ts`:
- Lines 54-67: Admin notification email
- Lines 75-84: User confirmation email

### Form Fields

Add or modify form fields in:
1. `components/marketing/ContactForm.tsx` - Frontend form
2. `app/api/contact/route.ts` - Backend validation
3. `lib/supabase.ts` - TypeScript types
4. `supabase-schema.sql` - Database schema

### Status & Priority Options

Edit available options in:
- `app/admin/page.tsx` - Lines 356-359 (status), 374-377 (priority)
- `lib/supabase.ts` - TypeScript type definitions

## Troubleshooting

**Form submission fails:**
- Check browser console for errors
- Verify Supabase credentials are correct
- Check Supabase logs in dashboard

**Emails not sending:**
- Verify Resend API key is correct
- Check sender domain is verified
- Review Resend dashboard logs

**Admin dashboard empty:**
- Verify Supabase service role key is set
- Check RLS policies are created
- Ensure submissions exist in database

**Database connection errors:**
- Verify all three Supabase env vars are set
- Check Supabase project is active
- Verify schema has been created

## Support

For issues or questions:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Check the [Resend documentation](https://resend.com/docs)
3. Review the code comments in each file
4. Contact your development team

## Future Enhancements

- [ ] Add file upload support
- [ ] Implement email templates with React Email
- [ ] Add SMS notifications via Twilio
- [ ] Create webhook for Slack/Discord notifications
- [ ] Add analytics and reporting
- [ ] Implement auto-response based on service type
- [ ] Add tagging system for better organization
- [ ] Export submissions to CSV/Excel
