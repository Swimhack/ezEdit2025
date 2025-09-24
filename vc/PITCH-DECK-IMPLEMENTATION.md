# Investor Pitch Deck System - Complete Implementation Guide

## Overview
This document contains the complete implementation details for the EzEdit investor pitch deck system, including all code, API endpoints, and deployment instructions.

## Quick Re-Implementation Prompt

If you need to recreate this entire system, use this prompt with Claude:

```markdown
Please create a comprehensive investor pitch deck API system for my web application. I need:

## Core Requirements:
1. Create a complete backend system for an investor pitch deck presentation at route /VC
2. Support standard pitch deck sections (problem, solution, market, team, financials, ask)
3. Track investor engagement and analytics
4. Capture investor contact information with lead scoring
5. Serve optimized media assets (images, videos, documents)

## Technical Stack:
- Next.js 14+ with App Router
- TypeScript with strict typing
- Tailwind CSS for styling
- API routes under /api/pitch-deck/

## Data Models Needed:
1. PitchSection - Core pitch deck sections with ordering
2. ContentBlock - Flexible content (text, images, charts)
3. ViewerAnalytics - Track engagement metrics
4. ContactSubmission - Investor contact forms
5. PresentationConfig - Global settings

## API Endpoints Required:
1. GET /api/pitch-deck/config - Presentation settings
2. GET /api/pitch-deck/sections - All sections
3. GET /api/pitch-deck/sections/[id] - Specific section
4. POST /api/pitch-deck/analytics/event - Track events
5. POST /api/pitch-deck/contact - Contact form
6. GET /api/pitch-deck/assets/[id] - Media assets

## Features:
- Rate limiting on contact form (5/minute per IP)
- Session-based analytics tracking
- Engagement scoring for lead prioritization
- CORS support for cross-origin access
- Comprehensive error handling
- Cache optimization for assets
- Security headers on all endpoints

## Next.js 15 Compatibility:
- Use Promise-based params in dynamic routes
- Await headers() calls
- Include all SecurityEventType definitions

Please implement the complete backend system with all models, services, and API routes. Focus on enterprise-grade quality suitable for presenting to professional investors.
```

---

## Complete Implementation Details

### 1. File Structure Created

```
ezedit/
├── lib/
│   ├── types/
│   │   └── pitch-deck.ts          # TypeScript type definitions
│   ├── models/
│   │   ├── pitch-section.ts       # PitchSection model class
│   │   ├── contact-submission.ts  # ContactSubmission model
│   │   └── viewer-analytics.ts    # ViewerAnalytics model
│   └── services/
│       └── pitch-deck-service.ts  # Service layer implementation
└── app/
    └── api/
        └── pitch-deck/
            ├── config/
            │   └── route.ts        # GET /api/pitch-deck/config
            ├── sections/
            │   ├── route.ts        # GET /api/pitch-deck/sections
            │   └── [sectionId]/
            │       └── route.ts    # GET /api/pitch-deck/sections/[id]
            ├── analytics/
            │   └── event/
            │       └── route.ts    # POST /api/pitch-deck/analytics/event
            ├── contact/
            │   └── route.ts        # POST /api/pitch-deck/contact
            └── assets/
                └── [assetId]/
                    └── route.ts    # GET /api/pitch-deck/assets/[id]
```

### 2. Data Models

#### PitchSection Model
- **id**: Unique identifier
- **slug**: URL-friendly identifier
- **order**: Display order (1-based)
- **title**: Section title
- **subtitle**: Optional subtitle
- **content_blocks**: Array of ContentBlock items
- **background_color**: Optional background color
- **background_image**: Optional background image URL
- **layout**: Section layout type
- **is_visible**: Visibility flag
- **metadata**: Additional section metadata

#### ContentBlock Types
- **text**: Rich text content
- **image**: Image with caption
- **chart**: Data visualization
- **quote**: Testimonial or quote
- **video**: Embedded video
- **metric**: Key metric display
- **list**: Bullet points
- **team_member**: Team member profile

#### ViewerAnalytics
- **session_id**: Unique session identifier
- **section_id**: Viewed section
- **event_type**: Type of event (view, click, scroll)
- **duration**: Time spent (milliseconds)
- **device_info**: Browser and device details
- **ip_address**: Viewer IP
- **timestamp**: Event timestamp

#### ContactSubmission
- **name**: Full name
- **email**: Email address
- **company**: Optional company name
- **investor_type**: Angel, VC, Strategic, Family Office, Other
- **message**: Optional message
- **interested_sections**: Array of section IDs
- **lead_score**: Calculated lead score
- **submission_metadata**: IP, user agent, etc.

### 3. API Endpoints Detail

#### GET /api/pitch-deck/config
Returns global presentation configuration including theme, branding, and settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "professional",
    "primary_color": "#2563eb",
    "company_name": "EzEdit",
    "logo_url": "/logo.png",
    "contact_email": "invest@ezedit.co"
  }
}
```

#### GET /api/pitch-deck/sections
Returns all visible pitch deck sections in order.

**Query Parameters:**
- `includeHidden` (boolean): Include hidden sections

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cover",
      "slug": "cover",
      "order": 1,
      "title": "EzEdit",
      "subtitle": "AI-Powered Website Editing",
      "content_blocks": [...]
    }
  ]
}
```

#### GET /api/pitch-deck/sections/[sectionId]
Returns detailed content for a specific section.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "problem",
    "slug": "problem",
    "order": 2,
    "title": "The Problem",
    "content_blocks": [
      {
        "type": "text",
        "content": "60% of small businesses struggle with website updates..."
      }
    ]
  }
}
```

#### POST /api/pitch-deck/analytics/event
Track viewer engagement events.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "event": "section_view",
  "sectionId": "market",
  "duration": 5000,
  "timestamp": "2025-01-20T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```

#### POST /api/pitch-deck/contact
Submit investor contact form.

**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@vcfirm.com",
  "company": "Venture Capital Firm",
  "investorType": "vc",
  "message": "Interested in learning more",
  "interestedSections": ["market", "financials"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your interest. We'll be in touch soon.",
  "data": {
    "submissionId": "uuid",
    "leadScore": 85
  }
}
```

#### GET /api/pitch-deck/assets/[assetId]
Serve optimized media assets.

**Query Parameters:**
- `format`: thumbnail | medium | large | original

**Response:** Binary file with appropriate headers

### 4. Key Features Implemented

#### Rate Limiting
```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
```

#### Security Headers
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
}
```

#### Caching Strategy
```typescript
'Cache-Control': 'public, max-age=31536000, immutable' // Images
'Cache-Control': 'public, max-age=600' // Config
'Cache-Control': 'public, max-age=300' // Sections
```

#### Lead Scoring Algorithm
```typescript
calculateLeadScore(submission: ContactSubmission): number {
  let score = 0

  // Investor type scoring
  if (submission.investor_type === 'vc') score += 30
  if (submission.investor_type === 'angel') score += 25
  if (submission.investor_type === 'strategic') score += 35

  // Engagement scoring
  if (submission.message && submission.message.length > 100) score += 15
  if (submission.company) score += 10
  if (submission.interested_sections.length > 3) score += 10

  return Math.min(score, 100)
}
```

### 5. Standard Pitch Deck Sections

1. **Cover/Title** - Company name, tagline, logo
2. **Problem** - Market pain points
3. **Solution** - Your unique approach
4. **Market Opportunity** - TAM, SAM, SOM
5. **Product Demo** - Key features showcase
6. **Business Model** - Revenue streams
7. **Go-to-Market** - Customer acquisition strategy
8. **Traction** - Current metrics and growth
9. **Competition** - Competitive landscape
10. **Team** - Founding team and advisors
11. **Financials** - Projections and unit economics
12. **Investment Ask** - Funding amount and use of funds
13. **Contact** - Call to action

### 6. Next.js 15 Compatibility Fixes

#### Dynamic Route Parameters
```typescript
// OLD (Next.js 14)
export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  const { assetId } = params
}

// NEW (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params
}
```

#### Headers API
```typescript
// OLD
const headersList = headers()

// NEW
const headersList = await headers()
```

#### SecurityEventType Updates
```typescript
export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'signup'
  | 'password_reset'
  | 'account_locked'
  | 'mfa_enabled'
  | 'failed_login'
  | 'login_failure'  // Added
  | 'email_verification'
  | 'session_expired'
  | 'suspicious_activity'  // Added
  | 'login_attempt'  // Added
```

### 7. Testing the Implementation

#### Test API Endpoints
```bash
# Get configuration
curl https://ezeditapp.fly.dev/api/pitch-deck/config

# Get all sections
curl https://ezeditapp.fly.dev/api/pitch-deck/sections

# Get specific section
curl https://ezeditapp.fly.dev/api/pitch-deck/sections/problem

# Track analytics event
curl -X POST https://ezeditapp.fly.dev/api/pitch-deck/analytics/event \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session","event":"section_view","sectionId":"market"}'

# Submit contact form
curl -X POST https://ezeditapp.fly.dev/api/pitch-deck/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","investorType":"angel"}'

# Get asset
curl https://ezeditapp.fly.dev/api/pitch-deck/assets/logo?format=medium
```

### 8. Deployment Commands

```bash
# Commit changes
git add -A
git commit -m "Implement comprehensive investor pitch deck API system"

# Push to remote
git push origin 005-failed-to-fetch

# Deploy to Fly.io
fly deploy --app ezeditapp --wait-timeout 600
```

### 9. Environment Variables Required

```env
# Add to .env.local
NEXT_PUBLIC_PITCH_DECK_ENABLED=true
PITCH_DECK_CONTACT_EMAIL=invest@ezedit.co
PITCH_DECK_ANALYTICS_ENABLED=true
```

### 10. Frontend Implementation (Next Steps)

To complete the investor-facing UI at `/VC`, create:

```typescript
// app/vc/page.tsx
import PitchDeckViewer from '@/components/pitch-deck/PitchDeckViewer'

export default function InvestorPitchPage() {
  return <PitchDeckViewer />
}
```

```typescript
// components/pitch-deck/PitchDeckViewer.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PitchDeckViewer() {
  const [sections, setSections] = useState([])
  const [currentSection, setCurrentSection] = useState(0)

  // Fetch sections
  // Implement navigation
  // Track analytics
  // Render sections with animations
}
```

---

## Troubleshooting

### Common Issues

1. **TypeScript Build Errors**
   - Ensure all `headers()` calls are awaited
   - Check dynamic route params use Promise pattern
   - Verify all SecurityEventTypes are defined

2. **Deployment Failures**
   - Run `npm run build` locally first
   - Check for ESLint errors
   - Verify all environment variables are set

3. **API 404 Errors**
   - Confirm routes are in correct directory structure
   - Check route.ts exports (GET, POST, etc.)
   - Verify deployment completed successfully

---

## Contact & Support

For questions about this implementation:
- GitHub: https://github.com/Swimhack/ezEdit2025
- Branch: 005-failed-to-fetch
- Last Updated: January 2025

---

*This pitch deck system was designed to help EzEdit secure seed funding by providing a professional, trackable, and engaging investor presentation platform.*