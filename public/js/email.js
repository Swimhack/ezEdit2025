/**
 * EzEdit Email Service
 * Handles email sending functionality using Resend.com API
 */

class EmailService {
  constructor() {
    // Resend API key would normally be stored securely on the server
    this.apiKey = 'resend_api_key'; // This is a placeholder
    this.apiUrl = 'https://api.resend.com/emails';
    this.fromEmail = 'noreply@ezedit.co';
    this.fromName = 'EzEdit';
  }

  /**
   * Send an invitation email to collaborate on a site
   * @param {string} recipientEmail - Email address of the recipient
   * @param {string} senderName - Name of the person sending the invite
   * @param {string} siteName - Name of the site being shared
   * @param {string} inviteLink - Link to accept the invitation
   * @returns {Promise} - Promise resolving to the API response
   */
  async sendInvite(recipientEmail, senderName, siteName, inviteLink) {
    try {
      // In a real implementation, this would be a server-side API call
      // For demo purposes, we'll simulate the API call
      console.log(`Sending invite to ${recipientEmail} for site ${siteName}`);
      
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipientEmail,
        subject: `${senderName} invited you to collaborate on ${siteName}`,
        html: this.getInviteEmailTemplate(senderName, siteName, inviteLink)
      };
      
      // Simulate API call
      return await this.simulateApiCall(emailData);
    } catch (error) {
      console.error('Error sending invite email:', error);
      throw error;
    }
  }
  
  /**
   * Send a welcome email to new users
   * @param {string} recipientEmail - Email address of the recipient
   * @param {string} firstName - First name of the recipient
   * @returns {Promise} - Promise resolving to the API response
   */
  async sendWelcome(recipientEmail, firstName) {
    try {
      console.log(`Sending welcome email to ${recipientEmail}`);
      
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipientEmail,
        subject: `Welcome to EzEdit, ${firstName}!`,
        html: this.getWelcomeEmailTemplate(firstName)
      };
      
      // Simulate API call
      return await this.simulateApiCall(emailData);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
  
  /**
   * Send a password reset email
   * @param {string} recipientEmail - Email address of the recipient
   * @param {string} resetLink - Link to reset password
   * @returns {Promise} - Promise resolving to the API response
   */
  async sendPasswordReset(recipientEmail, resetLink) {
    try {
      console.log(`Sending password reset email to ${recipientEmail}`);
      
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipientEmail,
        subject: `Reset your EzEdit password`,
        html: this.getPasswordResetEmailTemplate(resetLink)
      };
      
      // Simulate API call
      return await this.simulateApiCall(emailData);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
  
  /**
   * Send a notification email when changes are published
   * @param {string} recipientEmail - Email address of the recipient
   * @param {string} siteName - Name of the site
   * @param {string} changedFiles - List of files that were changed
   * @param {string} viewLink - Link to view the changes
   * @returns {Promise} - Promise resolving to the API response
   */
  async sendPublishNotification(recipientEmail, siteName, changedFiles, viewLink) {
    try {
      console.log(`Sending publish notification to ${recipientEmail} for site ${siteName}`);
      
      const emailData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipientEmail,
        subject: `Changes published to ${siteName}`,
        html: this.getPublishNotificationTemplate(siteName, changedFiles, viewLink)
      };
      
      // Simulate API call
      return await this.simulateApiCall(emailData);
    } catch (error) {
      console.error('Error sending publish notification email:', error);
      throw error;
    }
  }
  
  /**
   * Simulate an API call to Resend.com
   * @param {Object} emailData - Email data to send
   * @returns {Promise} - Promise resolving to the API response
   */
  async simulateApiCall(emailData) {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate successful API response
        resolve({
          id: `email_${Date.now()}`,
          from: emailData.from,
          to: emailData.to,
          created_at: new Date().toISOString(),
          status: 'sent'
        });
      }, 1000);
    });
  }
  
  /**
   * Get HTML template for invite email
   * @param {string} senderName - Name of the person sending the invite
   * @param {string} siteName - Name of the site being shared
   * @param {string} inviteLink - Link to accept the invitation
   * @returns {string} - HTML email template
   */
  getInviteEmailTemplate(senderName, siteName, inviteLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've been invited to collaborate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EzEdit Collaboration Invite</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${senderName}</strong> has invited you to collaborate on <strong>${siteName}</strong> using EzEdit.</p>
            <p>EzEdit is a simple web-based editor that makes it easy to edit and publish websites without any technical knowledge.</p>
            <p>Click the button below to accept the invitation and start collaborating:</p>
            <p><a href="${inviteLink}" class="button">Accept Invitation</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${inviteLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <p>Best regards,<br>The EzEdit Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EzEdit. All rights reserved.</p>
            <p>123 Web Street, Internet City, 94000</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get HTML template for welcome email
   * @param {string} firstName - First name of the recipient
   * @returns {string} - HTML email template
   */
  getWelcomeEmailTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EzEdit</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .steps {
            margin: 20px 0;
          }
          .step {
            margin-bottom: 15px;
          }
          .step-number {
            display: inline-block;
            width: 24px;
            height: 24px;
            background-color: #2563EB;
            color: white;
            border-radius: 50%;
            text-align: center;
            margin-right: 10px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EzEdit!</h1>
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Thank you for signing up for EzEdit! We're excited to have you on board.</p>
            <p>EzEdit makes it easy to edit and publish websites without any technical knowledge. Here's how to get started:</p>
            
            <div class="steps">
              <div class="step">
                <span class="step-number">1</span>
                <strong>Add your first site</strong> - Connect to your website via FTP
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <strong>Edit your files</strong> - Use our intuitive editor to make changes
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <strong>Preview and publish</strong> - See your changes and publish when ready
              </div>
            </div>
            
            <p>Click the button below to log in and get started:</p>
            <p><a href="https://ezedit.co/login" class="button">Log In to EzEdit</a></p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team at support@ezedit.co.</p>
            
            <p>Best regards,<br>The EzEdit Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EzEdit. All rights reserved.</p>
            <p>123 Web Street, Internet City, 94000</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get HTML template for password reset email
   * @param {string} resetLink - Link to reset password
   * @returns {string} - HTML email template
   */
  getPasswordResetEmailTemplate(resetLink) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your EzEdit Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your EzEdit account. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <p><a href="${resetLink}" class="button">Reset Password</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The EzEdit Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EzEdit. All rights reserved.</p>
            <p>123 Web Street, Internet City, 94000</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Get HTML template for publish notification email
   * @param {string} siteName - Name of the site
   * @param {string} changedFiles - List of files that were changed
   * @param {string} viewLink - Link to view the changes
   * @returns {string} - HTML email template
   */
  getPublishNotificationTemplate(siteName, changedFiles, viewLink) {
    // Format changed files as HTML list
    const filesList = changedFiles.map(file => `<li>${file}</li>`).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Changes Published to ${siteName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563EB;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            color: white;
            margin: 0;
          }
          .content {
            padding: 20px;
            background-color: #f9f9f9;
          }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .files-list {
            background-color: #eee;
            padding: 10px 20px;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Changes Published</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Changes have been published to <strong>${siteName}</strong>.</p>
            <p>The following files were updated:</p>
            <div class="files-list">
              <ul>
                ${filesList}
              </ul>
            </div>
            <p>Click the button below to view your site:</p>
            <p><a href="${viewLink}" class="button">View Site</a></p>
            <p>Best regards,<br>The EzEdit Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} EzEdit. All rights reserved.</p>
            <p>123 Web Street, Internet City, 94000</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export the EmailService class
window.EmailService = EmailService;
