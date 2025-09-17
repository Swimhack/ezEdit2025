# EzEdit Fly.io Deployment Quickstart

**Time to Complete**: 45 minutes
**Prerequisites**: Docker, Fly.io account, Git

## Overview

This guide will help you deploy EzEdit to ezedit.fly.dev using Fly.io platform with automatic SSL, health monitoring, and zero-downtime deployments.

## 1. Prerequisites Setup (10 minutes)

### Install Fly.io CLI
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Verify installation
flyctl version

# Login to Fly.io
flyctl auth login
```

### Verify Docker Installation
```bash
# Check Docker is running
docker --version
docker ps

# If Docker not installed:
# Windows/Mac: Download Docker Desktop
# Linux: curl -fsSL https://get.docker.com | sh
```

### Prepare Environment
```bash
# Clone EzEdit repository (if not already done)
git clone https://github.com/strickland/ezedit.git
cd ezedit

# Verify project structure
ls -la
# Should see: package.json, next.config.js, app/, lib/, etc.
```

## 2. Credential Management (10 minutes)

### Set Up Credential Storage
```bash
# Create secure credential directory
mkdir -p .claude
chmod 700 .claude

# Copy credential template
cp /path/to/credentials-template.md .claude/credentials.md
```

### Configure Production Credentials
Edit `.claude/credentials.md` with your actual credentials:

```markdown
## Database Service (Supabase)
**Public Key:**
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Secret Key:**
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Connection String:**
postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

## Web Hosting (Fly.io)
**API Key:**
fly_[YOUR_API_TOKEN_HERE]

## Additional Services
# Add Stripe, OpenAI, Anthropic credentials as needed
```

### Set Fly.io Secrets
```bash
# Set database credentials
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon_key]"
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY="[service_key]"

# Set payment credentials
flyctl secrets set STRIPE_SECRET_KEY="sk_live_[key]"
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_[key]"
flyctl secrets set STRIPE_WEBHOOK_SECRET="whsec_[secret]"

# Set AI service credentials
flyctl secrets set OPENAI_API_KEY="sk-[key]"
flyctl secrets set ANTHROPIC_API_KEY="sk-ant-[key]"

# Set application configuration
flyctl secrets set NEXT_PUBLIC_APP_URL="https://ezedit.fly.dev"
flyctl secrets set NODE_ENV="production"
```

## 3. Fly.io Configuration (10 minutes)

### Create fly.toml
```toml
# fly.toml
app = "ezedit"
primary_region = "iad"

[build]
  image = "node:18-alpine"
  dockerfile = "Dockerfile"

[[mounts]]
  source = "ezedit_data"
  destination = "/data"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    grace_period = "30s"
    interval = "10s"
    method = "GET"
    timeout = "5s"
    path = "/api/health"

[vm]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 4096

[[vm.processes]]
  cmd = ["npm", "start"]
  name = "web"

[auto_scaling]
  min_machines_running = 1
  max_machines_running = 10

[[auto_scaling.metrics]]
  name = "cpu"
  target = 80

[[auto_scaling.metrics]]
  name = "memory"
  target = 85
```

### Create Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
ENV PORT 8080

CMD ["node", "server.js"]
```

### Create .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
.env.local
.env.*.local
README.md
Dockerfile
.dockerignore
coverage
.nyc_output
.next
out
build
```

## 4. Health Check Implementation (5 minutes)

### Create Health Check Endpoint
Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check database connection
    const { data: dbCheck } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    // Check external API connectivity (optional)
    const checks = {
      database: dbCheck ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    }

    const isHealthy = checks.database === 'healthy'

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        ...checks
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
```

## 5. Deploy to Fly.io (10 minutes)

### Initial Deployment
```bash
# Launch the app (creates app if it doesn't exist)
flyctl launch --name ezedit --region iad

# Deploy the application
flyctl deploy --wait-timeout 600

# Check deployment status
flyctl status

# View logs
flyctl logs
```

### Configure Custom Domain
```bash
# Add custom domain
flyctl certs create ezedit.fly.dev

# Check certificate status
flyctl certs list

# Verify SSL is working
curl -I https://ezedit.fly.dev
```

### Verify Deployment
```bash
# Test health endpoint
curl https://ezedit.fly.dev/api/health

# Check application response
curl https://ezedit.fly.dev

# Monitor deployment
flyctl dashboard
```

## 6. Monitoring Setup (5 minutes)

### Configure Alerts
```bash
# Set up monitoring via Fly.io dashboard
flyctl open dashboard

# Configure alerts for:
# - Application downtime
# - High response times (>500ms)
# - High error rates (>1%)
# - Resource usage (>80% CPU/memory)
```

### Log Monitoring
```bash
# Stream live logs
flyctl logs -f

# Search logs
flyctl logs --search "ERROR"

# Export logs for analysis
flyctl logs > deployment-logs.txt
```

## 7. Testing & Validation (10 minutes)

### Deployment Tests
```bash
# Test health endpoint
curl https://ezedit.fly.dev/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# Test main application
curl -I https://ezedit.fly.dev
# Expected: HTTP/2 200, content-type: text/html

# Test SSL certificate
curl -vI https://ezedit.fly.dev 2>&1 | grep -i ssl
# Expected: SSL certificate verify ok

# Test auto-scaling (optional)
ab -n 1000 -c 100 https://ezedit.fly.dev/
```

### Database Connectivity
```bash
# Test database connection through app
curl https://ezedit.fly.dev/api/auth/signin
# Should return signin form (200 status)

# Check logs for database connections
flyctl logs --search "database"
```

### Performance Validation
```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://ezedit.fly.dev/

# Create curl-format.txt:
echo "     time_namelookup:  %{time_namelookup}\n     time_connect:     %{time_connect}\n     time_appconnect:  %{time_appconnect}\n     time_pretransfer: %{time_pretransfer}\n     time_redirect:    %{time_redirect}\n     time_starttransfer: %{time_starttransfer}\n     time_total:       %{time_total}\n" > curl-format.txt
```

## 8. Rollback Procedure (5 minutes)

### Prepare for Rollback
```bash
# List recent deployments
flyctl releases

# View specific release details
flyctl releases show [RELEASE_NUMBER]
```

### Execute Rollback
```bash
# Rollback to previous version
flyctl releases rollback [RELEASE_NUMBER]

# Monitor rollback progress
flyctl status

# Verify rollback success
curl https://ezedit.fly.dev/api/health
```

## Success Checklist

After completing this quickstart, verify:

- [ ] ✅ EzEdit accessible at https://ezedit.fly.dev
- [ ] ✅ SSL certificate active and valid
- [ ] ✅ Health check endpoint responding (200 status)
- [ ] ✅ Database connectivity working
- [ ] ✅ User registration/login functional
- [ ] ✅ AI website generation working
- [ ] ✅ Payment processing operational (if configured)
- [ ] ✅ Response times <2 seconds globally
- [ ] ✅ Auto-scaling configured and tested
- [ ] ✅ Monitoring and alerts active
- [ ] ✅ Rollback procedure tested and documented

## Troubleshooting

### Common Issues

**Deployment fails with "build error":**
```bash
# Check build logs
flyctl logs --search "build"

# Ensure Dockerfile is correct
docker build -t ezedit-test .
```

**Health check failing:**
```bash
# Check health endpoint locally
npm run dev
curl http://localhost:3000/api/health

# Verify database connectivity
flyctl console
```

**SSL certificate issues:**
```bash
# Check certificate status
flyctl certs list
flyctl certs check ezedit.fly.dev

# Recreate certificate if needed
flyctl certs delete ezedit.fly.dev
flyctl certs create ezedit.fly.dev
```

**High response times:**
```bash
# Check resource usage
flyctl status
flyctl metrics

# Scale up if needed
flyctl scale count 3
flyctl scale vm 4cpu8gb
```

## Next Steps

1. **Set up CI/CD pipeline** for automatic deployments
2. **Configure monitoring dashboards** for production metrics
3. **Implement backup procedures** for application state
4. **Set up staging environment** for testing changes
5. **Configure custom domains** for production use

## Support Resources

- **Fly.io Documentation**: https://fly.io/docs/
- **EzEdit Support**: support@ezedit.co
- **Deployment Dashboard**: https://fly.io/dashboard
- **Status Page**: https://status.fly.io/

---

**Deployment Complete!** 🚀

EzEdit is now running at https://ezedit.fly.dev with automatic scaling, health monitoring, and zero-downtime deployments.