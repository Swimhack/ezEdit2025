# Quickstart Guide: 2025 Best Practices Implementation

**Feature**: 2025 Best Practices Update for EzEdit.co
**Target Audience**: Development Team
**Estimated Time**: 8 weeks
**Prerequisites**: Next.js 14+, Supabase, AWS Account

## Overview

This quickstart guide provides step-by-step instructions for implementing 2025 security standards, including WebAuthn authentication, SFTP migration, enhanced backup strategies, and compliance automation.

## Phase 1: Critical Security Updates (Week 1-2)

### Step 1: Update Next.js and Patch CVE-2025-29927

```bash
# Update Next.js to patch critical vulnerability
npm update next@latest  # Ensure >= 15.2.3

# Verify version
npm list next
```

**Critical**: Implement middleware protection against CVE-2025-29927:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // CRITICAL: Block CVE-2025-29927 exploitation
  const subrequestHeader = request.headers.get('x-middleware-subrequest');
  if (subrequestHeader && subrequestHeader.includes('middleware:')) {
    console.warn('Blocked CVE-2025-29927 exploitation attempt', {
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
      header: subrequestHeader
    });

    return new NextResponse('Security violation detected', {
      status: 401,
      headers: {
        'x-security-violation': 'middleware-bypass-attempt'
      }
    });
  }

  return NextResponse.next();
}
```

### Step 2: Install Security Dependencies

```bash
# WebAuthn implementation
npm install @simplewebauthn/server @simplewebauthn/browser @simplewebauthn/typescript-types

# SFTP client (replace basic-ftp)
npm install ssh2-sftp-client

# AWS SDK for backup storage
npm install @aws-sdk/client-s3

# Security testing tools (dev dependencies)
npm install --save-dev semgrep snyk gitleaks @playwright/test

# Pre-commit hooks
npm install --save-dev husky pre-commit
```

### Step 3: Configure Security Headers

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Phase 2: WebAuthn Authentication (Week 3-4)

### Step 4: Set Up WebAuthn Database Schema

Add to your Supabase migration:

```sql
-- Create webauthn schema
CREATE SCHEMA IF NOT EXISTS webauthn;

-- WebAuthn credentials table
CREATE TABLE webauthn.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  credential_device_type TEXT,
  credential_backed_up BOOLEAN DEFAULT FALSE,
  transports TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges table for temporary challenge storage
CREATE TABLE webauthn.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Enable RLS
ALTER TABLE webauthn.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn.challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own credentials" ON webauthn.credentials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own challenges" ON webauthn.challenges
  FOR ALL USING (auth.uid() = user_id);
```

### Step 5: Implement WebAuthn Registration

Create `app/api/auth/webauthn/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const options = await generateRegistrationOptions({
      rpName: 'EzEdit.co',
      rpID: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      userID: email,
      userName: email,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    // Store challenge temporarily
    const { data: user } = await supabase.auth.admin.getUserByEmail(email);
    if (user.user) {
      await supabase
        .from('webauthn.challenges')
        .insert({
          user_id: user.user.id,
          challenge: options.challenge,
        });
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

### Step 6: Test WebAuthn Implementation

Create basic test:

```typescript
// __tests__/auth/webauthn.test.ts
import { POST } from '@/app/api/auth/webauthn/register/route';

describe('WebAuthn Registration', () => {
  test('should generate registration options', async () => {
    const request = new Request('http://localhost/api/auth/webauthn/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenge).toBeDefined();
    expect(data.rp.name).toBe('EzEdit.co');
  });
});
```

## Phase 3: SFTP Migration (Week 5-6)

### Step 7: Implement SFTP Connection Manager

Create `lib/sftp-connections.ts`:

```typescript
import SftpClient from 'ssh2-sftp-client';

export interface SFTPConnection {
  id: string;
  host: string;
  port: number;
  username: string;
  connected: boolean;
  client: SftpClient;
  lastActivity: number;
}

export class SFTPConnectionPool {
  private connections = new Map<string, SFTPConnection>();

  async getConnection(config: {
    host: string;
    username: string;
    password?: string;
    privateKey?: string;
  }): Promise<SFTPConnection> {
    const key = `${config.host}:${config.username}`;
    let connection = this.connections.get(key);

    if (!connection || !connection.connected) {
      connection = await this.createConnection(config);
      this.connections.set(key, connection);
    }

    connection.lastActivity = Date.now();
    return connection;
  }

  private async createConnection(config: any): Promise<SFTPConnection> {
    const client = new SftpClient();

    const secureConfig = {
      host: config.host,
      port: 22,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      algorithms: {
        cipher: [
          'aes256-gcm',
          'aes256-gcm@openssh.com',
          'aes128-gcm',
          'aes128-gcm@openssh.com'
        ],
        kex: [
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384'
        ]
      },
      readyTimeout: 20000,
      timeout: 20000
    };

    await client.connect(secureConfig);

    return {
      id: `${config.host}:${config.username}`,
      host: config.host,
      port: 22,
      username: config.username,
      connected: true,
      client,
      lastActivity: Date.now()
    };
  }
}
```

### Step 8: Add FTP Deprecation Warnings

Update existing website connection UI:

```typescript
// components/FTPDeprecationWarning.tsx
import { AlertTriangle } from 'lucide-react';

export function FTPDeprecationWarning() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            FTP Protocol Deprecated
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              FTP connections are no longer secure and will be blocked starting
              March 31, 2025. Please migrate to SFTP or FTPS for enhanced security.
            </p>
            <div className="mt-2">
              <a
                href="/docs/migration/ftp-to-sftp"
                className="font-medium text-red-700 underline hover:text-red-600"
              >
                View migration guide →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Phase 4: Enhanced Backup Implementation (Week 7-8)

### Step 9: Configure AWS S3 for Immutable Backups

Set up AWS S3 bucket with Object Lock:

```bash
# Using AWS CLI
aws s3 mb s3://ezedit-immutable-backups --region us-east-1

# Enable Object Lock
aws s3api put-object-lock-configuration \
  --bucket ezedit-immutable-backups \
  --object-lock-configuration \
  'ObjectLockEnabled=Enabled,Rule={DefaultRetention={Mode=GOVERNANCE,Days=365}}'
```

Environment variables:

```bash
# .env.local
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_PRIMARY_REGION=us-east-1
AWS_IMMUTABLE_REGION=us-west-2
AWS_IMMUTABLE_BUCKET=ezedit-immutable-backups
```

### Step 10: Implement 3-2-1-1-0 Backup Strategy

Create `lib/backup-orchestrator.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

export class BackupOrchestrator {
  private s3Client: S3Client;
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_PRIMARY_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async executeBackupStrategy(dataType: 'database' | 'storage') {
    const backupId = `backup-${Date.now()}-${dataType}`;

    try {
      // Step 1: Create primary backup (Supabase)
      const primaryBackup = await this.createPrimaryBackup(dataType);

      // Step 2: Replicate to secondary storage (AWS S3 Standard)
      await this.replicateToSecondary(primaryBackup, backupId);

      // Step 3: Create offsite copy (AWS S3 different region)
      await this.createOffsiteCopy(primaryBackup, backupId);

      // Step 4: Create immutable copy with Object Lock
      await this.createImmutableCopy(primaryBackup, backupId);

      // Step 5: Verify backup integrity
      const verification = await this.verifyBackupIntegrity(backupId);

      return { success: true, backupId, verification };
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  private async createImmutableCopy(backup: any, backupId: string) {
    const immutableKey = `immutable/${backupId}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_IMMUTABLE_BUCKET!,
      Key: immutableKey,
      Body: backup.data,
      ObjectLockMode: 'GOVERNANCE',
      ObjectLockRetainUntilDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
      Metadata: {
        'backup-type': backup.type,
        'source': 'ezedit',
        'compliance': 'gdpr-compliant'
      }
    }));
  }
}
```

## Testing and Validation

### Run Security Tests

```bash
# Install test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run security test suite
npm run test:security

# Run vulnerability scanning
npm audit
npx snyk test

# Check for secrets
npx gitleaks detect
```

### Validate Implementation

```bash
# Test WebAuthn endpoints
curl -X POST http://localhost:3000/api/auth/webauthn/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test SFTP connection
curl -X POST http://localhost:3000/api/sftp/connections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"protocol": "sftp", "host": "test.com", "credentials": {...}}'

# Test backup execution
curl -X POST http://localhost:3000/api/sftp/backup/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionId": "conn123", "backupType": "full"}'
```

## Deployment Checklist

### Pre-deployment

- [ ] Next.js updated to >= 15.2.3
- [ ] CVE-2025-29927 middleware protection active
- [ ] Security headers configured
- [ ] WebAuthn database schema deployed
- [ ] AWS S3 buckets configured with Object Lock
- [ ] Environment variables set

### Security Validation

- [ ] No FTP connections allowed
- [ ] SFTP connections use secure ciphers only
- [ ] WebAuthn registration/authentication working
- [ ] Backup strategy creates all 5 copies
- [ ] Compliance audit passes

### Monitoring Setup

- [ ] Security event logging active
- [ ] Backup success/failure alerts configured
- [ ] Authentication failure monitoring
- [ ] Performance metrics tracking

## Troubleshooting

### Common Issues

1. **WebAuthn Registration Fails**
   - Check browser support (94.98% supported)
   - Verify HTTPS in production
   - Check domain configuration

2. **SFTP Connection Issues**
   - Verify cipher suite compatibility
   - Check firewall settings
   - Validate key format and permissions

3. **Backup Failures**
   - Check AWS credentials and permissions
   - Verify S3 bucket Object Lock configuration
   - Monitor storage quota limits

### Support Resources

- [WebAuthn Debugging Guide](https://webauthn.guide)
- [SFTP Configuration Examples](https://docs.ezedit.co/sftp)
- [AWS S3 Object Lock Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)

## Success Metrics

### Security Metrics
- ✅ Zero critical vulnerabilities
- ✅ 100% HTTPS connections
- ✅ No FTP protocol usage
- ✅ WebAuthn adoption > 50%

### Backup Metrics
- ✅ 99.9% backup success rate
- ✅ < 4 hour recovery time
- ✅ 100% integrity verification

### Compliance Metrics
- ✅ PCI DSS 4.0 compliant
- ✅ GDPR data retention automated
- ✅ NIST CSF 2.0 aligned
- ✅ OWASP 2025 compliant

This quickstart guide provides a practical, step-by-step approach to implementing 2025 security standards while maintaining system reliability and user experience.