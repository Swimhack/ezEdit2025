import {
  Body,
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

interface AdminAlertEmailProps {
  alertType: string;
  message: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date;
  appName?: string;
}

export const AdminAlertEmail = ({
  alertType = 'System Alert',
  message = 'A system event occurred',
  details = {},
  severity = 'medium',
  timestamp = new Date(),
  appName = 'EzEdit'
}: AdminAlertEmailProps) => {
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getSeverityLabel = (sev: string) => {
    return sev.charAt(0).toUpperCase() + sev.slice(1);
  };

  return (
    <Html>
      <Head />
      <Preview>🚨 {alertType}: {message}</Preview>
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
            <div style={{ ...alertBanner, backgroundColor: getSeverityColor(severity) }}>
              <Text style={alertTitle}>
                🚨 SYSTEM ALERT
              </Text>
            </div>

            <Section style={alertInfo}>
              <Text style={alertTypeStyle}>
                <strong>Alert Type:</strong> {alertType}
              </Text>
              <Text style={alertSeverity}>
                <strong>Severity:</strong>
                <span style={{ ...severityBadge, backgroundColor: getSeverityColor(severity) }}>
                  {getSeverityLabel(severity)}
                </span>
              </Text>
              <Text style={alertTimestamp}>
                <strong>Time:</strong> {timestamp.toISOString()}
              </Text>
            </Section>

            <Section style={messageSection}>
              <Text style={messageHeading}>Message:</Text>
              <Text style={messageText}>
                {message}
              </Text>
            </Section>

            {Object.keys(details).length > 0 && (
              <Section style={detailsSection}>
                <Text style={detailsHeading}>Details:</Text>
                <div style={detailsContainer}>
                  {Object.entries(details).map(([key, value]) => (
                    <Text key={key} style={detailItem}>
                      <strong>{key}:</strong> {JSON.stringify(value, null, 2)}
                    </Text>
                  ))}
                </div>
              </Section>
            )}

            <Section style={actionSection}>
              <Text style={actionHeading}>Recommended Actions:</Text>
              <Text style={actionItem}>
                • Check system logs for additional context
              </Text>
              <Text style={actionItem}>
                • Verify system health and performance metrics
              </Text>
              <Text style={actionItem}>
                • Review recent deployments or configuration changes
              </Text>
              {severity === 'critical' && (
                <Text style={criticalAction}>
                  ⚠️ <strong>CRITICAL:</strong> Immediate attention required - system may be impacted
                </Text>
              )}
            </Section>

            <Section style={linksSection}>
              <Link href="https://ezeditapp.fly.dev/logs?pass=1234" style={button}>
                View System Logs
              </Link>
              <Link href="https://ezeditapp.fly.dev/dashboard" style={linkButton}>
                Open Dashboard
              </Link>
            </Section>

            <Text style={paragraph}>
              This is an automated alert from {appName} monitoring system. If you believe this is a false positive, please review the alert configuration.
            </Text>

            <Text style={paragraph}>
              —<br />
              {appName} Monitoring System
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {appName} Admin Alert System
            </Text>
            <Text style={footerText}>
              <Link href="https://ezeditapp.fly.dev/admin" style={footerLink}>
                Admin Panel
              </Link>
              {' | '}
              <Link href="https://ezeditapp.fly.dev/monitoring" style={footerLink}>
                Monitoring
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminAlertEmail;

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

const alertBanner = {
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
  borderRadius: '8px',
};

const alertTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const alertInfo = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
  marginBottom: '20px',
};

const alertTypeStyle = {
  fontSize: '14px',
  margin: '4px 0',
  color: '#484848',
};

const alertSeverity = {
  fontSize: '14px',
  margin: '4px 0',
  color: '#484848',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const severityBadge = {
  color: '#ffffff',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  display: 'inline-block',
  marginLeft: '8px',
};

const alertTimestamp = {
  fontSize: '14px',
  margin: '4px 0',
  color: '#484848',
  fontFamily: 'monospace',
};

const messageSection = {
  marginBottom: '24px',
};

const messageHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '0 0 8px 0',
};

const messageText = {
  fontSize: '16px',
  color: '#484848',
  backgroundColor: '#fff3cd',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #ffeaa7',
  fontWeight: '500',
  margin: '0',
};

const detailsSection = {
  marginBottom: '24px',
};

const detailsHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '0 0 12px 0',
};

const detailsContainer = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid #e9ecef',
};

const detailItem = {
  fontSize: '14px',
  color: '#484848',
  margin: '8px 0',
  fontFamily: 'monospace',
  wordBreak: 'break-all' as const,
};

const actionSection = {
  marginBottom: '24px',
};

const actionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#484848',
  margin: '0 0 12px 0',
};

const actionItem = {
  fontSize: '14px',
  color: '#484848',
  margin: '6px 0',
};

const criticalAction = {
  fontSize: '14px',
  color: '#dc3545',
  backgroundColor: '#f8d7da',
  padding: '12px',
  borderRadius: '4px',
  border: '1px solid #f5c6cb',
  margin: '12px 0',
  fontWeight: 'bold',
};

const linksSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  margin: '0 8px',
  border: 'none',
  cursor: 'pointer',
};

const linkButton = {
  backgroundColor: '#6c757d',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 20px',
  margin: '0 8px',
  border: 'none',
  cursor: 'pointer',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#666',
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