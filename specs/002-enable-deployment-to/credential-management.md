# EzEdit Credential Management Integration

**Purpose**: Integrate the comprehensive credential template into EzEdit deployment workflow
**Based on**: Essential Web Project Credentials Template v4.0

## Integration Strategy

### 1. Credential Template Customization for EzEdit

```markdown
# EzEdit Production Credentials

**Document Version:** 1.0 (based on template v4.0)
**Last Updated:** 2025-09-15
**Classification:** PRODUCTION
**Environment:** ezedit.fly.dev
**Project:** EzEdit AI Website Generator

## Database Service (Supabase)
**Service Category:** Database/Backend-as-a-Service
**Environment:** Production
**Access Level:** ADMIN
**Created:** [DEPLOYMENT_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+30_DAYS]

**Public Key (Client):**
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTE5MDUsImV4cCI6MjA2NzE2NzkwNX0.8cpoEx0MXO0kkTqDrpkbYRhXQHVQ0bmjHA0xI2rUWqY

**Secret Key (Service Role):**
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU5MTkwNSwiZXhwIjoyMDY3MTY3OTA1fQ.LZO9ckLrpeSFGf1Av0v9bFqpSP8dcQllrFJ-yHGAZdo

**Connection String:**
postgresql://postgres:[PASSWORD]@db.sctzykgcfkhadowyqcrj.supabase.co:5432/postgres

## Web Hosting (Fly.io)
**Service Category:** Container Hosting/Platform
**Environment:** Production
**Access Level:** ADMIN
**Created:** [DEPLOYMENT_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+90_DAYS]

**API Token:**
[FLY_API_TOKEN_PROVIDED_BY_USER]

## Payment Processing (Stripe)
**Service Category:** Payment Processing
**Environment:** Production
**Access Level:** PRODUCTION
**Created:** [SETUP_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+30_DAYS]

**Publishable Key:**
pk_live_[USER_PROVIDED_KEY]

**Secret Key:**
sk_live_[USER_PROVIDED_KEY]

**Webhook Secret:**
whsec_[USER_PROVIDED_SECRET]

## AI Services

### OpenAI
**Service Category:** AI/Language Model
**Environment:** Production
**Access Level:** PRODUCTION
**Created:** [SETUP_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+90_DAYS]

**API Key:**
sk-[USER_PROVIDED_KEY]

### Anthropic Claude
**Service Category:** AI/Language Model
**Environment:** Production
**Access Level:** PRODUCTION
**Created:** [SETUP_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+90_DAYS]

**API Key:**
sk-ant-[USER_PROVIDED_KEY]

## Email Service (Optional - Future Enhancement)
**Service Category:** Email/Communication
**Environment:** Production
**Access Level:** PRODUCTION
**Created:** [SETUP_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+90_DAYS]

**API Key:**
[RESEND_OR_SENDGRID_KEY]

## Version Control (GitHub)
**Service Category:** Version Control/CI/CD
**Environment:** Production
**Access Level:** READ-WRITE
**Created:** [SETUP_DATE]
**Last Rotated:** [ROTATION_DATE]
**Next Rotation:** [+90_DAYS]

**Personal Access Token:**
ghp_[USER_PROVIDED_TOKEN]

**Scopes:** repo, workflow, read:org, read:user
```

### 2. Environment Variable Mapping

Transform credentials into environment variables for Fly.io deployment:

```bash
#!/bin/bash
# setup-env-vars.sh - Credential to Environment Variable Mapping

# Database (Supabase)
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="https://sctzykgcfkhadowyqcrj.supabase.co"
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUPABASE_ANON_KEY]"
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[SUPABASE_SERVICE_KEY]"

# Payment Processing (Stripe)
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="[STRIPE_PUBLISHABLE_KEY]"
flyctl secrets set STRIPE_SECRET_KEY="[STRIPE_SECRET_KEY]"
flyctl secrets set STRIPE_WEBHOOK_SECRET="[STRIPE_WEBHOOK_SECRET]"

# AI Services
flyctl secrets set OPENAI_API_KEY="[OPENAI_API_KEY]"
flyctl secrets set ANTHROPIC_API_KEY="[ANTHROPIC_API_KEY]"

# Application Configuration
flyctl secrets set NEXT_PUBLIC_APP_URL="https://ezedit.fly.dev"
flyctl secrets set NODE_ENV="production"

# Optional Services (for future use)
# flyctl secrets set RESEND_API_KEY="[RESEND_API_KEY]"
# flyctl secrets set GITHUB_TOKEN="[GITHUB_TOKEN]"
```

### 3. Automated Credential Rotation

```javascript
// lib/credential-rotation.js
const ROTATION_SCHEDULE = {
  high: 30,      // days - Database, Payment
  medium: 90,    // days - AI Services, Hosting
  low: 365       // days - Development, Read-only
}

const CREDENTIAL_CATEGORIES = {
  database: { priority: 'high', services: ['supabase'] },
  payment: { priority: 'high', services: ['stripe'] },
  ai: { priority: 'medium', services: ['openai', 'anthropic'] },
  hosting: { priority: 'medium', services: ['fly'] },
  development: { priority: 'low', services: ['github'] }
}

class CredentialManager {
  async checkRotationSchedule() {
    // Implementation for checking rotation dates
    // Integration with deployment pipeline
    // Automated alerts before expiration
  }

  async rotateCredential(service, category) {
    // Automated rotation logic
    // Update environment variables
    // Verify new credentials work
    // Revoke old credentials
  }
}
```

### 4. Security Integration Points

#### A. Deployment Pipeline Security
- Credential validation during deployment
- Automated security scans
- Secret detection in code repositories
- Encryption key management

#### B. Runtime Security
- Environment variable encryption
- Access logging and monitoring
- Credential usage analytics
- Anomaly detection

#### C. Backup and Recovery
- Encrypted credential backups
- Secure recovery procedures
- Emergency access protocols
- Audit trail maintenance

### 5. Implementation in EzEdit Architecture

#### Database Schema Extension
```sql
-- Extend existing schema with credential management
CREATE TABLE credential_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL,
  environment VARCHAR(20) NOT NULL,
  encrypted_value TEXT NOT NULL,
  rotation_schedule INTEGER NOT NULL, -- days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_rotated TIMESTAMPTZ,
  next_rotation TIMESTAMPTZ NOT NULL,
  rotation_priority VARCHAR(10) NOT NULL,
  UNIQUE(service_name, environment)
);

-- Audit table for credential access
CREATE TABLE credential_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID REFERENCES credential_management(id),
  action VARCHAR(20) NOT NULL, -- access, rotate, create, delete
  user_id UUID, -- if human initiated
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);
```

#### Service Layer Integration
```typescript
// lib/services/credential-service.ts
export class CredentialService {
  async getCredential(serviceName: string, environment: string): Promise<string> {
    // Secure credential retrieval
    // Access logging
    // Decryption
  }

  async rotateCredential(serviceName: string): Promise<void> {
    // Automated rotation
    // Service-specific rotation logic
    // Verification and rollback
  }

  async validateCredentials(): Promise<ValidationResult> {
    // Pre-deployment validation
    // Connectivity tests
    // Permission verification
  }
}
```

### 6. Deployment Integration

#### Pre-deployment Validation
```bash
# validate-credentials.sh
#!/bin/bash
set -e

echo "Validating credentials for ezedit.fly.dev deployment..."

# Test database connection
echo "Testing Supabase connection..."
npx supabase --version > /dev/null || { echo "Supabase CLI required"; exit 1; }

# Test payment processing
echo "Testing Stripe connection..."
curl -f "https://api.stripe.com/v1/account" \
  -u "$STRIPE_SECRET_KEY:" > /dev/null || { echo "Stripe validation failed"; exit 1; }

# Test AI services
echo "Testing OpenAI API..."
curl -f "https://api.openai.com/v1/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY" > /dev/null || { echo "OpenAI validation failed"; exit 1; }

echo "All credentials validated successfully!"
```

#### Post-deployment Verification
```bash
# verify-deployment.sh
#!/bin/bash
set -e

echo "Verifying deployment with credential connectivity..."

# Health check with database
curl -f "https://ezedit.fly.dev/api/health" || { echo "Health check failed"; exit 1; }

# Test authentication flow
curl -f "https://ezedit.fly.dev/api/auth/signin" || { echo "Auth endpoints failed"; exit 1; }

# Test AI generation (if API key configured)
curl -f "https://ezedit.fly.dev/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' || { echo "AI services failed"; exit 1; }

echo "Deployment verified successfully!"
```

## Implementation Benefits

1. **Security**: Systematic credential management with rotation schedules
2. **Reliability**: Pre-deployment validation prevents service outages
3. **Compliance**: Audit trail and encryption meet security standards
4. **Automation**: Reduces manual errors in credential management
5. **Scalability**: Template adapts to additional services and environments

## Future Enhancements

1. **HashiCorp Vault Integration**: Enterprise secret management
2. **Multi-environment Support**: Staging, development, production
3. **Service Discovery**: Automatic credential detection and validation
4. **Compliance Reporting**: Automated security compliance reports
5. **Emergency Procedures**: Automated incident response for credential breaches