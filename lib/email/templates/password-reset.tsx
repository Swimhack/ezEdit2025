import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  appName?: string;
}

export const PasswordResetEmail = ({
  name = 'User',
  resetUrl = 'https://example.com/reset',
  appName = 'EzEdit'
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your {appName} password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://ezeditapp.fly.dev/logo.png"
              width="120"
              height="36"
              alt={appName}
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Text style={heading}>Reset Your Password</Text>

            <Text style={paragraph}>
              Hi {name},
            </Text>

            <Text style={paragraph}>
              We received a request to reset your password for your {appName} account. If you didn't make this request, you can safely ignore this email.
            </Text>

            <Text style={paragraph}>
              To reset your password, click the button below:
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>
              If the button doesn't work, you can also copy and paste this link into your browser:
            </Text>

            <Text style={linkText}>
              <Link href={resetUrl} style={link}>
                {resetUrl}
              </Link>
            </Text>

            <Text style={paragraph}>
              This password reset link will expire in 24 hours for security purposes.
            </Text>

            <Text style={securityNote}>
              <strong>Security tip:</strong> If you didn't request this password reset, please check your account security and consider changing your password immediately.
            </Text>

            <Text style={paragraph}>
              Thanks,<br />
              The {appName} Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {appName} | Your Website Editing Solution
            </Text>
            <Text style={footerText}>
              <Link href="https://ezeditapp.fly.dev" style={footerLink}>
                Visit our website
              </Link>
              {' | '}
              <Link href="https://ezeditapp.fly.dev/support" style={footerLink}>
                Get support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoSection = {
  padding: '32px 32px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '0 32px',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#484848',
  textAlign: 'center' as const,
  margin: '32px 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#484848',
  margin: '16px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: 'auto',
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
};

const linkText = {
  fontSize: '14px',
  color: '#666',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
};

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
};

const securityNote = {
  fontSize: '14px',
  color: '#dc3545',
  backgroundColor: '#fff5f5',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #fed7d7',
  margin: '16px 0',
};

const footer = {
  padding: '32px 32px 0',
  textAlign: 'center' as const,
  borderTop: '1px solid #eaeaea',
  marginTop: '32px',
};

const footerText = {
  fontSize: '12px',
  color: '#666',
  margin: '8px 0',
};

const footerLink = {
  color: '#007ee6',
  textDecoration: 'underline',
};