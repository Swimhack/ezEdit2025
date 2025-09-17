# Data Model: Fly.io Deployment Configuration

**Version**: 1.0.0
**Date**: 2025-09-15

## Entity Overview

This data model defines the configuration entities required for deploying EzEdit to Fly.io platform. These entities represent deployment configuration rather than application data.

## Core Entities

### DeploymentConfiguration
**Purpose**: Master configuration for Fly.io deployment settings

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| app_name | string | REQUIRED, alphanumeric+hyphens | Fly.io application identifier |
| domain | string | REQUIRED | Primary domain (ezedit.fly.dev) |
| region_primary | string | REQUIRED | Primary deployment region |
| regions_additional | array[string] | OPTIONAL | Additional regions for distribution |
| resource_cpu | integer | REQUIRED, 1-8 | CPU cores per instance |
| resource_memory | string | REQUIRED | Memory allocation (e.g., "4GB") |
| resource_storage | string | REQUIRED | Storage allocation (e.g., "10GB") |
| scaling_min | integer | DEFAULT 1 | Minimum instances |
| scaling_max | integer | DEFAULT 10 | Maximum instances |
| auto_scaling | boolean | DEFAULT true | Enable automatic scaling |
| created_at | timestamp | AUTO | Configuration creation time |
| updated_at | timestamp | AUTO | Last modification time |

### CredentialManager
**Purpose**: Secure credential storage and rotation tracking

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| service_name | string | REQUIRED | Service identifier (fly, supabase, stripe) |
| service_category | enum | REQUIRED | database, hosting, email, payment, ai |
| environment | enum | REQUIRED | production, development, staging |
| access_level | enum | REQUIRED | admin, read_write, read_only |
| credential_type | enum | REQUIRED | api_key, connection_string, token |
| encrypted_value | text | REQUIRED | Encrypted credential value |
| public_identifier | string | OPTIONAL | Non-sensitive identifier (client ID) |
| created_date | date | REQUIRED | Credential creation date |
| last_rotated | date | OPTIONAL | Last rotation date |
| next_rotation | date | REQUIRED | Scheduled rotation date |
| rotation_priority | enum | REQUIRED | high, medium, low |
| purpose | string | REQUIRED | Usage description |
| usage_context | string | REQUIRED | Where/how it's used |
| security_notes | text | OPTIONAL | Special security considerations |

### EnvironmentVariable
**Purpose**: Environment configuration for different deployment stages

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| key | string | REQUIRED, UPPERCASE | Environment variable name |
| encrypted_value | text | REQUIRED | Encrypted value |
| environment | enum | REQUIRED | production, staging, development |
| is_secret | boolean | DEFAULT true | Requires secret management |
| category | enum | REQUIRED | database, api, feature_flag, system |
| description | string | REQUIRED | Variable purpose |
| example_value | string | OPTIONAL | Non-sensitive example |
| required | boolean | DEFAULT true | Required for deployment |
| created_at | timestamp | AUTO | Creation timestamp |
| updated_at | timestamp | AUTO | Last modification |

### HealthCheck
**Purpose**: Health monitoring configuration

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| check_type | enum | REQUIRED | http, tcp, exec |
| endpoint | string | CONDITIONAL | HTTP endpoint path |
| interval | integer | REQUIRED | Check interval in seconds |
| timeout | integer | REQUIRED | Timeout in seconds |
| retries | integer | DEFAULT 3 | Retry attempts before failure |
| grace_period | integer | DEFAULT 30 | Grace period after deployment |
| expected_status | integer | DEFAULT 200 | Expected HTTP status |
| expected_body | string | OPTIONAL | Expected response content |
| alert_threshold | integer | REQUIRED | Consecutive failures before alert |
| enabled | boolean | DEFAULT true | Check is active |

### DeploymentLog
**Purpose**: Deployment history and audit trail

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| deployment_id | string | REQUIRED | Fly.io deployment ID |
| version | string | REQUIRED | Application version |
| commit_hash | string | REQUIRED | Git commit hash |
| environment | enum | REQUIRED | production, staging |
| status | enum | REQUIRED | pending, running, success, failed, rolled_back |
| started_at | timestamp | REQUIRED | Deployment start time |
| completed_at | timestamp | OPTIONAL | Deployment completion time |
| duration_seconds | integer | OPTIONAL | Total deployment time |
| deployed_by | string | REQUIRED | User or system initiating deployment |
| rollback_target | string | OPTIONAL | Version to rollback to if failed |
| error_message | text | OPTIONAL | Error details if failed |
| build_logs | text | OPTIONAL | Build process logs |
| health_check_passed | boolean | DEFAULT false | Post-deployment health status |

### SSLCertificate
**Purpose**: SSL certificate management

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| domain | string | REQUIRED | Domain name |
| certificate_authority | string | DEFAULT "Let's Encrypt" | CA provider |
| status | enum | REQUIRED | pending, active, expired, failed |
| issued_at | timestamp | OPTIONAL | Certificate issue date |
| expires_at | timestamp | OPTIONAL | Certificate expiration date |
| auto_renew | boolean | DEFAULT true | Automatic renewal enabled |
| last_renewed | timestamp | OPTIONAL | Last renewal date |
| fingerprint | string | OPTIONAL | Certificate fingerprint |
| warning_days | integer | DEFAULT 30 | Days before expiry to warn |

### ResourceAllocation
**Purpose**: Resource usage and scaling configuration

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| instance_type | string | REQUIRED | Fly.io machine type |
| cpu_cores | integer | REQUIRED | Number of CPU cores |
| memory_mb | integer | REQUIRED | Memory in megabytes |
| storage_gb | integer | REQUIRED | Storage in gigabytes |
| cost_per_hour | decimal | REQUIRED | Cost per instance hour |
| scaling_trigger_cpu | integer | DEFAULT 80 | CPU percentage for scaling |
| scaling_trigger_memory | integer | DEFAULT 85 | Memory percentage for scaling |
| scaling_trigger_requests | integer | DEFAULT 100 | Requests/second for scaling |
| effective_date | date | REQUIRED | When this configuration takes effect |

## Relationships

### Primary Relationships
- **DeploymentConfiguration** has many **EnvironmentVariable**
- **DeploymentConfiguration** has many **HealthCheck**
- **DeploymentConfiguration** has one **ResourceAllocation**
- **DeploymentConfiguration** has one **SSLCertificate**
- **DeploymentConfiguration** references many **CredentialManager**

### Audit Relationships
- **DeploymentLog** references **DeploymentConfiguration**
- **CredentialManager** has rotation history (self-referencing)

## Validation Rules

### DeploymentConfiguration
- App name must be unique across Fly.io platform
- Domain must be valid FQDN format
- Resource allocations must be within Fly.io limits
- Scaling max must be greater than scaling min

### CredentialManager
- Encrypted values must be non-empty
- Rotation dates must be logical (created < last_rotated < next_rotation)
- High priority credentials must have rotation schedule ≤ 30 days

### EnvironmentVariable
- Key names must follow UPPER_CASE_CONVENTION
- Secret variables must be encrypted
- Required variables must have non-empty values

### HealthCheck
- HTTP checks require valid endpoint path
- Timeout must be less than interval
- Retry count must be positive integer

## Security Considerations

### Encryption
- All credential values encrypted at rest using AES-256
- Environment variables encrypted using same key management
- Encryption keys stored in secure key management system

### Access Control
- Credential access logged and audited
- Role-based access to different credential categories
- Rotation events trigger security notifications

### Data Protection
- No credentials stored in plain text
- Backup files are encrypted
- Credential access requires authentication

## Configuration Templates

### Credential Categories and Rotation Schedules

| Category | Rotation Priority | Default Schedule | Access Level |
|----------|------------------|------------------|--------------|
| Database | High | 30 days | Admin |
| Payment | High | 30 days | Production |
| AI Services | Medium | 90 days | Production |
| Hosting | Medium | 90 days | Admin |
| Email | Medium | 90 days | Production |
| Development | Low | 365 days | Read-Write |

### Environment Variable Categories

| Category | Required | Secret | Example |
|----------|----------|--------|---------|
| database | Yes | Yes | DATABASE_URL |
| api | Yes | Yes | OPENAI_API_KEY |
| feature_flag | No | No | ENABLE_BETA_FEATURES |
| system | Yes | No | NODE_ENV |

## Data Migration

### From Template to Production
1. Copy credential template structure
2. Replace placeholder values with encrypted credentials
3. Set appropriate rotation schedules
4. Configure environment-specific variables
5. Initialize health check configurations

### Credential Import Process
1. Validate credential format and permissions
2. Encrypt using system key management
3. Set rotation schedule based on category
4. Create audit log entry
5. Test credential functionality