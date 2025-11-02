import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin, ContactSubmission } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, company, website, service_type, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Save to Supabase
    const submissionData: ContactSubmission = {
      name,
      email,
      phone: phone || null,
      company: company || null,
      website: website || null,
      service_type: service_type || null,
      message,
      status: 'new',
      priority: 'normal'
    };

    const { data: submission, error: dbError } = await supabaseAdmin
      .from('contact_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Send email notification via Resend
    try {
      await resend.emails.send({
        from: 'EzEdit Contact <noreply@ezedit.co>',
        to: ['hello@ezedit.co'], // Your business email
        replyTo: email,
        subject: `New Contact Form Submission${service_type ? ` - ${service_type}` : ''}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          ${website ? `<p><strong>Website:</strong> ${website}</p>` : ''}
          ${service_type ? `<p><strong>Service Type:</strong> ${service_type}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Submission ID: ${submission.id}</small></p>
          <p><small>Submitted at: ${new Date(submission.created_at).toLocaleString()}</small></p>
        `
      });

      // Send confirmation email to user
      await resend.emails.send({
        from: 'EzEdit Team <noreply@ezedit.co>',
        to: [email],
        subject: 'Thank you for contacting EzEdit',
        html: `
          <h2>Thank you for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you within 2 hours during business hours.</p>
          <p><strong>Your message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Best regards,<br>The EzEdit Team</p>
          <p><small>If you didn't submit this form, please ignore this email.</small></p>
        `
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails, submission is already saved
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your submission! We will contact you soon.',
      submission_id: submission.id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
