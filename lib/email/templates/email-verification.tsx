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

interface EmailVerificationProps {
  name: string;
  verifyUrl: string;
  appName?: string;
}

export const EmailVerificationEmail = ({
  name = 'User',
  verifyUrl = 'https://example.com/verify',
  appName = 'EzEdit'
}: EmailVerificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Please verify your email address for {appName}</Preview>
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
            <Text style={heading}>Verify Your Email Address</Text>

            <Text style={paragraph}>
              Hi {name},
            </Text>

            <Text style={paragraph}>
              Thank you for signing up for {appName}! To ensure the security of your account and enable all features, please verify your email address.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={verifyUrl}>
                Verify Email
              </Button>
            </Section>

            <Text style={paragraph}>
              If the button doesn't work, you can also copy and paste this link into your browser:
            </Text>

            <Text style={linkText}>
              <Link href={verifyUrl} style={link}>
                {verifyUrl}
              </Link>
            </Text>

            <Text style={paragraph}>
              This verification link will expire in 24 hours. If you need a new verification link, you can request one from your account settings.
            </Text>

            <Text style={benefitsSection}>
              <strong>Why verify your email?</strong>
              <br />• Secure your account access
              <br />• Receive important notifications
              <br />• Enable password recovery
              <br />• Access all {appName} features
            </Text>

            <Text style={paragraph}>
              If you didn't create an account with {appName}, you can safely ignore this email.
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

export default EmailVerificationEmail;

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
  backgroundColor: '#28a745',
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

const benefitsSection = {
  fontSize: '14px',
  color: '#484848',
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
  margin: '20px 0',
  lineHeight: '1.5',
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