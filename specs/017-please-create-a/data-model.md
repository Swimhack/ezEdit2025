# Data Model: Investor Pitch Deck

**Feature**: Comprehensive Investor Pitch Deck
**Date**: 2025-01-15
**Status**: Draft

## Entity Definitions

### PitchSection
Represents each section/slide of the investor pitch deck.

**Fields**:
- `id`: string (unique identifier, e.g., "problem-statement")
- `title`: string (display title, e.g., "Market Opportunity")
- `order`: number (presentation sequence)
- `content`: PitchSectionContent (structured content object)
- `metadata`: PitchSectionMetadata (analytics and settings)
- `isVisible`: boolean (enable/disable sections)

**Relationships**:
- Contains multiple ContentBlocks
- Links to Analytics events
- May reference external AssetFiles

### PitchSectionContent
Structured content for each pitch section.

**Fields**:
- `headline`: string (main section heading)
- `subheadline`: string? (optional supporting text)
- `blocks`: ContentBlock[] (ordered content elements)
- `backgroundStyle`: BackgroundStyle (visual styling)
- `layout`: LayoutType (content arrangement)

**Validation Rules**:
- headline required and max 100 characters
- blocks array must contain 1-10 elements
- layout must match available templates

### ContentBlock
Individual content elements within a pitch section.

**Fields**:
- `id`: string (unique within section)
- `type`: ContentBlockType (text, image, chart, video, etc.)
- `content`: any (type-specific content structure)
- `position`: Position (layout coordinates if applicable)
- `animation`: AnimationConfig? (optional entrance animation)

**Types**:
- `TextBlock`: { text: string, formatting: TextStyle }
- `ImageBlock`: { src: string, alt: string, caption?: string }
- `ChartBlock`: { chartType: ChartType, data: ChartData }
- `VideoBlock`: { src: string, poster?: string, autoplay: boolean }
- `ButtonBlock`: { text: string, action: ActionConfig }

### AssetFile
Manages uploaded files and media assets.

**Fields**:
- `id`: string (UUID)
- `filename`: string
- `type`: AssetType (image, video, document, etc.)
- `url`: string (CDN or storage URL)
- `size`: number (file size in bytes)
- `metadata`: AssetMetadata (dimensions, duration, etc.)
- `uploadedAt`: Date
- `tags`: string[] (categorization)

**Validation Rules**:
- Maximum file size limits by type
- Supported formats validation
- Required alt text for images

### PresentationConfig
Global presentation settings and configuration.

**Fields**:
- `theme`: ThemeConfig (colors, fonts, spacing)
- `navigation`: NavigationConfig (controls and flow)
- `analytics`: AnalyticsConfig (tracking settings)
- `seo`: SEOConfig (meta tags and social sharing)
- `accessibility`: AccessibilityConfig (a11y options)

### ViewerAnalytics
Tracks investor engagement and viewing patterns.

**Fields**:
- `sessionId`: string (unique viewer session)
- `timestamp`: Date
- `event`: AnalyticsEvent (section_view, time_spent, etc.)
- `sectionId`: string? (which section if applicable)
- `metadata`: AnalyticsMetadata (device, referrer, etc.)
- `duration`: number? (time spent in milliseconds)

**Relationships**:
- Belongs to viewing session
- References PitchSection
- Aggregated into engagement reports

### ContactSubmission
Investor contact form submissions and lead tracking.

**Fields**:
- `id`: string (UUID)
- `name`: string
- `email`: string
- `company`: string?
- `investorType`: InvestorType (angel, vc, strategic, etc.)
- `message`: string
- `interestedSections`: string[] (section IDs)
- `submittedAt`: Date
- `followupStatus`: FollowupStatus

**Validation Rules**:
- Email format validation
- Required fields: name, email
- Message length limits
- Spam protection

## Type Definitions

### Enums

```typescript
enum ContentBlockType {
  TEXT = 'text',
  IMAGE = 'image',
  CHART = 'chart',
  VIDEO = 'video',
  BUTTON = 'button',
  QUOTE = 'quote',
  METRICS = 'metrics'
}

enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  FUNNEL = 'funnel'
}

enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOGO = 'logo'
}

enum LayoutType {
  HERO = 'hero',
  TWO_COLUMN = 'two_column',
  THREE_COLUMN = 'three_column',
  CENTERED = 'centered',
  FULL_BLEED = 'full_bleed'
}

enum InvestorType {
  ANGEL = 'angel',
  VC = 'vc',
  STRATEGIC = 'strategic',
  FAMILY_OFFICE = 'family_office',
  OTHER = 'other'
}

enum AnalyticsEvent {
  SECTION_VIEW = 'section_view',
  TIME_SPENT = 'time_spent',
  NAVIGATION = 'navigation',
  CONTACT_FORM = 'contact_form',
  ASSET_DOWNLOAD = 'asset_download'
}
```

### Complex Types

```typescript
interface ThemeConfig {
  primary: string
  secondary: string
  background: string
  text: string
  accent: string
  fonts: {
    heading: string
    body: string
    mono: string
  }
}

interface NavigationConfig {
  showProgress: boolean
  enableKeyboard: boolean
  autoAdvance: boolean
  showSlideNumbers: boolean
}

interface AnimationConfig {
  type: 'fade' | 'slide' | 'zoom' | 'none'
  duration: number
  delay: number
  easing: string
}

interface Position {
  x: number
  y: number
  width?: number
  height?: number
}
```

## State Transitions

### Presentation Navigation States
```
Loading → Ready → Presenting → Complete
     ↓      ↓         ↓          ↓
   Error   Error    Error    Analytics
```

### Content Management States
```
Draft → Review → Published → Archived
  ↓       ↓         ↓          ↓
Edit ← Revision ← Update   Historical
```

### Contact Lead States
```
Submitted → Reviewed → Contacted → Converted/Closed
     ↓         ↓          ↓           ↓
  Validation  Triage   Follow-up   Archive
```

## Relationships and Constraints

### Data Relationships
- One PresentationConfig per installation
- Many PitchSections per presentation
- Many ContentBlocks per PitchSection
- Many AssetFiles referenced by ContentBlocks
- Many ViewerAnalytics events per session
- Many ContactSubmissions independent of other entities

### Business Rules
- Section order must be sequential (1, 2, 3...)
- Maximum 15 sections for optimal presentation length
- Required sections: Problem, Solution, Market, Team, Funding
- Asset files must be validated before use
- Analytics retention period: 2 years
- Contact submissions require email verification

### Performance Constraints
- Section content should load <1s
- Images optimized to <500KB each
- Videos limited to 30s clips for performance
- Total presentation size <50MB
- Analytics batch processing every 5 minutes

## Validation Schema

### Required Content Validation
```typescript
interface ValidationRules {
  requiredSections: string[] // ['problem', 'solution', 'market', 'team', 'funding']
  maxSectionsCount: number   // 15
  maxContentBlocks: number   // 10 per section
  maxAssetSize: number       // 10MB per file
  requiredFields: {
    section: ['id', 'title', 'content']
    contact: ['name', 'email']
  }
}
```

### Content Quality Gates
- All images must have alt text
- Financial projections require data sources
- Team photos must be professional quality
- Contact information must be current
- Legal disclaimers on forward-looking statements

This data model supports a professional investor pitch deck with comprehensive analytics, content management, and lead capture capabilities while maintaining performance and accessibility standards.