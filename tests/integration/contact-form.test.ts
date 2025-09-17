import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3105; // Use unique port for integration tests

describe('Contact Form Submission Flow - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let adminUserId: string;
  let adminToken: string;

  beforeAll(async () => {
    // Setup Next.js test server
    app = next({ dev, hostname, port });
    handle = app.getRequestHandler();
    await app.prepare();

    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        console.log(`> Contact form test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup admin user for contact form management
    const { data: adminUser, error: adminError } = await supabase.auth.signUp({
      email: `contact-admin-${Date.now()}@example.com`,
      password: 'adminpassword123',
    });

    if (adminError || !adminUser.user) {
      throw new Error(`Failed to create admin user: ${adminError?.message}`);
    }

    adminUserId = adminUser.user.id;

    // Get admin auth token
    const { data: session } = await supabase.auth.getSession();
    adminToken = session?.session?.access_token || 'mock-admin-token';

    // Set up admin user profile
    await supabase.from('user_profiles').upsert({
      user_id: adminUserId,
      role: 'admin',
      email: `contact-admin-${Date.now()}@example.com`,
      receive_contact_notifications: true
    });
  });

  afterAll(async () => {
    // Cleanup admin user and data
    if (adminUserId) {
      await supabase.from('contact_submissions').delete().eq('assigned_to', adminUserId);
      await supabase.from('contact_responses').delete().eq('admin_user_id', adminUserId);
      await supabase.from('user_profiles').delete().eq('user_id', adminUserId);
      await supabase.auth.admin.deleteUser(adminUserId);
    }

    // Clean up all test contact submissions
    await supabase.from('contact_submissions').delete().like('email', '%contact-form-test%');
    await supabase.from('contact_responses').delete().like('submission_email', '%contact-form-test%');

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up contact form data for fresh test state
    await supabase.from('contact_submissions').delete().like('email', '%contact-form-test%');
    await supabase.from('contact_responses').delete().like('submission_email', '%contact-form-test%');
  });

  it('should handle complete contact form submission workflow', async () => {
    // Step 1: Submit contact form (public endpoint, no auth required)
    const contactSubmission = {
      name: 'John Doe',
      email: 'john.doe.contact-form-test@example.com',
      company: 'Test Company Inc.',
      phone: '+1234567890',
      subject: 'Product Inquiry',
      message: 'I am interested in learning more about your services. Can you provide more information about pricing and features?',
      source: 'website',
      metadata: {
        userAgent: 'Mozilla/5.0 Test Browser',
        referrer: 'https://google.com',
        ipAddress: '127.0.0.1',
        formVersion: '1.0'
      }
    };

    const submitResponse = await fetch(`http://localhost:${port}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactSubmission)
    });

    expect(submitResponse.status).toBe(201);
    const submissionData = await submitResponse.json();

    expect(submissionData).toHaveProperty('id');
    expect(submissionData).toHaveProperty('status');
    expect(submissionData).toHaveProperty('submittedAt');
    expect(submissionData.status).toBe('submitted');
    expect(submissionData.email).toBe('john.doe.contact-form-test@example.com');

    const submissionId = submissionData.id;

    // Wait for async processing (notifications, etc.)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Verify submission was saved to database
    const { data: savedSubmission } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    expect(savedSubmission).toBeTruthy();
    expect(savedSubmission.name).toBe('John Doe');
    expect(savedSubmission.email).toBe('john.doe.contact-form-test@example.com');
    expect(savedSubmission.company).toBe('Test Company Inc.');
    expect(savedSubmission.subject).toBe('Product Inquiry');
    expect(savedSubmission.status).toBe('submitted');
    expect(savedSubmission.source).toBe('website');
    expect(savedSubmission.metadata.userAgent).toBe('Mozilla/5.0 Test Browser');

    // Step 3: Check that admin notification was sent
    const { data: adminNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', adminUserId)
      .contains('data', { submissionId })
      .eq('type', 'contact_form_submission');

    expect(adminNotifications.length).toBeGreaterThan(0);
    const notification = adminNotifications[0];
    expect(notification.title).toContain('New Contact Form Submission');
    expect(notification.message).toContain('John Doe');

    // Step 4: Admin retrieves and reviews submission
    const getSubmissionResponse = await fetch(`http://localhost:${port}/api/contact/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });

    expect(getSubmissionResponse.status).toBe(200);
    const retrievedSubmission = await getSubmissionResponse.json();
    expect(retrievedSubmission.id).toBe(submissionId);
    expect(retrievedSubmission.name).toBe('John Doe');

    // Step 5: Admin updates submission status
    const updateStatusResponse = await fetch(`http://localhost:${port}/api/contact/submissions/${submissionId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'in_progress',
        assignedTo: adminUserId,
        notes: 'Reviewing product inquiry for Test Company Inc.'
      })
    });

    expect(updateStatusResponse.status).toBe(200);
    const updatedSubmission = await updateStatusResponse.json();
    expect(updatedSubmission.status).toBe('in_progress');
    expect(updatedSubmission.assignedTo).toBe(adminUserId);

    // Step 6: Admin sends response to customer
    const responseData = {
      subject: 'Re: Product Inquiry',
      message: 'Thank you for your interest in our services. I would be happy to provide more information about our pricing and features. Let me schedule a call with you to discuss your specific needs.',
      responseType: 'email',
      includeOriginalMessage: true,
      metadata: {
        followUpRequired: true,
        priority: 'medium'
      }
    };

    const sendResponseResponse = await fetch(`http://localhost:${port}/api/contact/submissions/${submissionId}/respond`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData)
    });

    expect(sendResponseResponse.status).toBe(200);
    const responseResult = await sendResponseResponse.json();
    expect(responseResult).toHaveProperty('responseId');
    expect(responseResult).toHaveProperty('emailSent');
    expect(responseResult.emailSent).toBe(true);

    // Wait for email processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 7: Verify response was logged and submission status updated
    const { data: finalSubmission } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    expect(finalSubmission.status).toBe('responded');
    expect(finalSubmission.last_response_at).toBeTruthy();

    const { data: contactResponse } = await supabase
      .from('contact_responses')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    expect(contactResponse).toBeTruthy();
    expect(contactResponse.admin_user_id).toBe(adminUserId);
    expect(contactResponse.subject).toBe('Re: Product Inquiry');
    expect(contactResponse.response_type).toBe('email');
    expect(contactResponse.metadata.followUpRequired).toBe(true);
  });

  it('should handle contact form spam detection and filtering', async () => {
    // Test submission with spam-like characteristics
    const spamSubmission = {
      name: 'URGENT BUSINESS PROPOSAL!!!',
      email: 'spammer.contact-form-test@suspicious-domain.fake',
      company: 'MAKE MONEY FAST COMPANY',
      phone: '+0000000000',
      subject: 'URGENT: CLAIM YOUR $1,000,000 PRIZE NOW!!!',
      message: 'Dear Sir/Madam, I am Prince John from Nigeria and I have a business proposal for you. Please send your bank details immediately to claim your prize money of $1,000,000 USD.',
      source: 'website',
      metadata: {
        userAgent: 'Suspicious Bot 1.0',
        referrer: '',
        ipAddress: '192.168.1.100'
      }
    };

    const spamResponse = await fetch(`http://localhost:${port}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spamSubmission)
    });

    expect(spamResponse.status).toBe(201);
    const spamData = await spamResponse.json();

    // Wait for spam analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify spam submission was flagged
    const { data: flaggedSubmission } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', spamData.id)
      .single();

    expect(flaggedSubmission.spam_score).toBeGreaterThan(0.7); // High spam score
    expect(flaggedSubmission.status).toBe('flagged');
    expect(flaggedSubmission.flags).toContain('high_spam_score');

    // Verify admin was notified about potential spam
    const { data: spamNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', adminUserId)
      .contains('data', { submissionId: spamData.id })
      .eq('type', 'contact_form_spam');

    expect(spamNotifications.length).toBeGreaterThan(0);
  });

  it('should handle contact form rate limiting and abuse prevention', async () => {
    const baseSubmission = {
      name: 'Rate Limit Test',
      email: 'rate-limit.contact-form-test@example.com',
      company: 'Test Company',
      subject: 'Rate Limit Test',
      message: 'Testing rate limiting functionality',
      source: 'website'
    };

    // Submit multiple forms rapidly from same IP
    const rapidSubmissions = Array.from({ length: 5 }, (_, i) =>
      fetch(`http://localhost:${port}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.100', // Same IP for all requests
        },
        body: JSON.stringify({
          ...baseSubmission,
          message: `Rate limit test submission ${i + 1}`
        })
      })
    );

    const results = await Promise.all(rapidSubmissions);

    // Some should succeed, others should be rate limited
    const successfulSubmissions = results.filter(r => r.status === 201);
    const rateLimitedSubmissions = results.filter(r => r.status === 429);

    expect(successfulSubmissions.length).toBeLessThan(5);
    expect(rateLimitedSubmissions.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitResponse = rateLimitedSubmissions[0];
    expect(rateLimitResponse.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(rateLimitResponse.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect(rateLimitResponse.headers.get('Retry-After')).toBeTruthy();
  });

  it('should support contact form submissions with file attachments', async () => {
    // Create a test file attachment
    const fileContent = 'This is a test document for contact form attachment';
    const base64Content = Buffer.from(fileContent).toString('base64');

    const submissionWithAttachment = {
      name: 'Jane Smith',
      email: 'jane.smith.contact-form-test@example.com',
      company: 'Attachment Test Co.',
      subject: 'Document Review Request',
      message: 'Please review the attached document and provide feedback.',
      source: 'website',
      attachments: [
        {
          filename: 'review-document.txt',
          content: base64Content,
          contentType: 'text/plain',
          size: fileContent.length
        }
      ]
    };

    const response = await fetch(`http://localhost:${port}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionWithAttachment)
    });

    expect(response.status).toBe(201);
    const submissionData = await response.json();
    expect(submissionData.attachmentCount).toBe(1);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify attachment was saved
    const { data: savedSubmission } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', submissionData.id)
      .single();

    expect(savedSubmission.attachment_count).toBe(1);
    expect(savedSubmission.attachment_urls).toHaveLength(1);
    expect(savedSubmission.attachment_urls[0]).toContain('review-document.txt');

    // Admin should be able to download attachment
    const downloadResponse = await fetch(`http://localhost:${port}/api/contact/submissions/${submissionData.id}/attachments/0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });

    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers.get('content-type')).toContain('text/plain');
    expect(downloadResponse.headers.get('content-disposition')).toContain('review-document.txt');
  });

  it('should track contact form analytics and metrics', async () => {
    // Submit multiple contact forms with different characteristics
    const analyticsSubmissions = [
      {
        name: 'Analytics User 1',
        email: 'analytics1.contact-form-test@example.com',
        company: 'Tech Startup',
        subject: 'Product Demo Request',
        message: 'Would like to see a demo of your product',
        source: 'google',
        metadata: { campaign: 'google-ads', medium: 'cpc' }
      },
      {
        name: 'Analytics User 2',
        email: 'analytics2.contact-form-test@example.com',
        company: 'Enterprise Corp',
        subject: 'Enterprise Pricing',
        message: 'Need pricing for enterprise plan',
        source: 'website',
        metadata: { campaign: 'organic', medium: 'website' }
      },
      {
        name: 'Analytics User 3',
        email: 'analytics3.contact-form-test@example.com',
        company: 'Small Business',
        subject: 'Support Question',
        message: 'Having trouble with setup',
        source: 'social',
        metadata: { campaign: 'linkedin', medium: 'social' }
      }
    ];

    // Submit all forms
    const submissionPromises = analyticsSubmissions.map(submission =>
      fetch(`http://localhost:${port}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      })
    );

    const results = await Promise.all(submissionPromises);
    expect(results.every(r => r.status === 201)).toBe(true);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get analytics data
    const analyticsResponse = await fetch(`http://localhost:${port}/api/contact/analytics?period=1d`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });

    expect(analyticsResponse.status).toBe(200);
    const analyticsData = await analyticsResponse.json();

    expect(analyticsData).toHaveProperty('summary');
    expect(analyticsData).toHaveProperty('bySource');
    expect(analyticsData).toHaveProperty('bySubjectCategory');
    expect(analyticsData).toHaveProperty('responseMetrics');

    // Verify summary data
    expect(analyticsData.summary.totalSubmissions).toBeGreaterThanOrEqual(3);
    expect(analyticsData.summary.submissionsToday).toBeGreaterThanOrEqual(3);

    // Verify source breakdown
    expect(analyticsData.bySource).toHaveProperty('google');
    expect(analyticsData.bySource).toHaveProperty('website');
    expect(analyticsData.bySource).toHaveProperty('social');

    // Verify response metrics tracking
    expect(analyticsData.responseMetrics).toHaveProperty('averageResponseTime');
    expect(analyticsData.responseMetrics).toHaveProperty('responseRate');
  });

  it('should handle contact form field validation and sanitization', async () => {
    // Test various validation scenarios
    const validationTests = [
      {
        name: 'Missing Name Test',
        data: {
          email: 'test.contact-form-test@example.com',
          subject: 'Test',
          message: 'Test message'
        },
        expectedStatus: 400,
        expectedError: 'name'
      },
      {
        name: 'Invalid Email Test',
        data: {
          name: 'Test User',
          email: 'invalid-email',
          subject: 'Test',
          message: 'Test message'
        },
        expectedStatus: 400,
        expectedError: 'email'
      },
      {
        name: 'Long Message Test',
        data: {
          name: 'Test User',
          email: 'long-message.contact-form-test@example.com',
          subject: 'Test',
          message: 'a'.repeat(10001) // Exceed maximum length
        },
        expectedStatus: 400,
        expectedError: 'message'
      },
      {
        name: 'XSS Attempt Test',
        data: {
          name: '<script>alert("xss")</script>',
          email: 'xss.contact-form-test@example.com',
          subject: '<img src=x onerror=alert("xss")>',
          message: 'Test message with <script>malicious code</script>'
        },
        expectedStatus: 201, // Should succeed but be sanitized
        expectedSanitized: true
      }
    ];

    for (const test of validationTests) {
      const response = await fetch(`http://localhost:${port}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data)
      });

      expect(response.status).toBe(test.expectedStatus);

      if (test.expectedStatus === 400) {
        const errorData = await response.json();
        expect(errorData.error.toLowerCase()).toContain(test.expectedError);
      } else if (test.expectedSanitized) {
        const submissionData = await response.json();

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify data was sanitized
        const { data: savedSubmission } = await supabase
          .from('contact_submissions')
          .select('*')
          .eq('id', submissionData.id)
          .single();

        expect(savedSubmission.name).not.toContain('<script>');
        expect(savedSubmission.subject).not.toContain('<img');
        expect(savedSubmission.message).not.toContain('<script>');
      }
    }
  });

  it('should support contact form auto-responses and acknowledgments', async () => {
    // Submit contact form that should trigger auto-response
    const autoResponseSubmission = {
      name: 'Auto Response Test',
      email: 'auto-response.contact-form-test@example.com',
      company: 'Test Company',
      subject: 'General Inquiry',
      message: 'This is a test message for auto-response functionality',
      source: 'website',
      requestAutoResponse: true
    };

    const response = await fetch(`http://localhost:${port}/api/contact/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(autoResponseSubmission)
    });

    expect(response.status).toBe(201);
    const submissionData = await response.json();
    expect(submissionData.autoResponseSent).toBe(true);

    // Wait for auto-response processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify auto-response was logged
    const { data: autoResponse } = await supabase
      .from('contact_responses')
      .select('*')
      .eq('submission_id', submissionData.id)
      .eq('response_type', 'auto_response')
      .single();

    expect(autoResponse).toBeTruthy();
    expect(autoResponse.subject).toContain('Thank you for contacting us');
    expect(autoResponse.is_automated).toBe(true);

    // Verify submission status was updated
    const { data: updatedSubmission } = await supabase
      .from('contact_submissions')
      .select('*')
      .eq('id', submissionData.id)
      .single();

    expect(updatedSubmission.auto_response_sent).toBe(true);
    expect(updatedSubmission.auto_response_sent_at).toBeTruthy();
  });
});