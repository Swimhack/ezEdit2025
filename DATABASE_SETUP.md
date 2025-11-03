# Database Setup Instructions

## Contact Submissions Table Migration

To enable the contact form to save submissions to the database, you need to run the migration in your Supabase project.

### Steps:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/004_contact_submissions.sql`
   - Paste it into the SQL editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify the Table**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `contact_submissions`
   - Verify it has the following columns:
     - `id` (UUID)
     - `name` (TEXT)
     - `email` (TEXT)
     - `company` (TEXT, nullable)
     - `investor_type` (TEXT, nullable)
     - `message` (TEXT, nullable)
     - `interested_sections` (JSONB)
     - `submitted_at` (TIMESTAMPTZ)
     - `followup_status` (TEXT)
     - `created_at` (TIMESTAMPTZ)
     - `updated_at` (TIMESTAMPTZ)

### Testing

After running the migration:

1. **Test the Contact Form**
   - Go to https://ezedit.co/services#contact
   - Fill out and submit the form
   - You should see a success message

2. **Check Admin Dashboard**
   - Go to https://ezeditapp.fly.dev/admin
   - The submission should appear in the "Contact Submissions" section

### Troubleshooting

If submissions aren't appearing:

1. **Check Supabase Environment Variables**
   - Verify these are set in Fly.io:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Check RLS Policies**
   - The migration creates RLS policies that allow the service role to insert/read/update
   - If you're getting permission errors, check the policies in Supabase

3. **Check Application Logs**
   - View Fly.io logs: `flyctl logs --app ezeditapp`
   - Look for any database errors

