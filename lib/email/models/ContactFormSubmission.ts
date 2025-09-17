/**
 * ContactFormSubmission model for managing contact form submissions
 * Supports attachment handling, spam detection, and response tracking
 */

import { z } from 'zod';

/**
 * Contact form submission status enumeration
 */
export enum SubmissionStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED',
  SPAM = 'SPAM'
}

/**
 * Contact form attachment structure
 */
export interface ContactAttachment {
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME content type */
  content_type: string;
  /** Storage path or URL */
  storage_path: string;
  /** Whether file was scanned for viruses */
  virus_scanned: boolean;
  /** Virus scan result */
  virus_scan_result?: string;
}

/**
 * Spam detection result structure
 */
export interface SpamDetectionResult {
  /** Overall spam score (0-100) */
  score: number;
  /** Whether submission is classified as spam */
  is_spam: boolean;
  /** Spam detection rules that triggered */
  triggered_rules: string[];
  /** Confidence level of detection */
  confidence: 'low' | 'medium' | 'high';
  /** Additional detection metadata */
  metadata?: Record<string, any>;
}

/**
 * ContactFormSubmission interface representing the complete submission structure
 */
export interface ContactFormSubmission {
  /** Unique identifier for the submission */
  id: string;
  /** Submitter's full name */
  name: string;
  /** Submitter's email address */
  email: string;
  /** Optional phone number */
  phone?: string | null;
  /** Message subject */
  subject: string;
  /** Message content */
  message: string;
  /** File attachments */
  attachments?: ContactAttachment[] | null;
  /** Client IP address */
  ip_address: string;
  /** Browser user agent */
  user_agent: string;
  /** HTTP referrer */
  referrer?: string | null;
  /** Submission timestamp */
  submitted_at: Date;
  /** Current submission status */
  status: SubmissionStatus;
  /** Admin user assigned to handle this submission */
  assigned_to?: string | null;
  /** Response timestamp */
  responded_at?: Date | null;
  /** Email ID of the response sent */
  response_email_id?: string | null;
  /** Spam detection results */
  spam_detection?: SpamDetectionResult | null;
  /** Additional metadata */
  metadata?: Record<string, any> | null;
}

/**
 * ContactFormSubmission creation data interface
 */
export interface CreateContactFormSubmissionData {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  attachments?: ContactAttachment[] | null;
  ip_address: string;
  user_agent: string;
  referrer?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * ContactFormSubmission update data interface
 */
export interface UpdateContactFormSubmissionData {
  status?: SubmissionStatus;
  assigned_to?: string | null;
  responded_at?: Date | null;
  response_email_id?: string | null;
  spam_detection?: SpamDetectionResult | null;
  metadata?: Record<string, any> | null;
}

/**
 * Validation schema for contact attachments
 */
export const ContactAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  size: z.number().int().min(0).max(10 * 1024 * 1024), // 10MB max per file
  content_type: z.string().min(1),
  storage_path: z.string().min(1),
  virus_scanned: z.boolean(),
  virus_scan_result: z.string().optional()
});

/**
 * Validation schema for spam detection results
 */
export const SpamDetectionResultSchema = z.object({
  score: z.number().min(0).max(100),
  is_spam: z.boolean(),
  triggered_rules: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for ContactFormSubmission creation
 */
export const CreateContactFormSubmissionSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).nullable().optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10240), // 10KB limit
  attachments: z.array(ContactAttachmentSchema).max(5).nullable().optional(),
  ip_address: z.string().ip(),
  user_agent: z.string().max(500),
  referrer: z.string().url().max(500).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional()
});

/**
 * Validation schema for ContactFormSubmission updates
 */
export const UpdateContactFormSubmissionSchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  responded_at: z.date().nullable().optional(),
  response_email_id: z.string().uuid().nullable().optional(),
  spam_detection: SpamDetectionResultSchema.nullable().optional(),
  metadata: z.record(z.any()).nullable().optional()
});

/**
 * Valid status transitions for contact form submissions
 */
export const ValidStatusTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  [SubmissionStatus.NEW]: [SubmissionStatus.IN_PROGRESS, SubmissionStatus.SPAM, SubmissionStatus.CLOSED],
  [SubmissionStatus.IN_PROGRESS]: [SubmissionStatus.RESPONDED, SubmissionStatus.CLOSED],
  [SubmissionStatus.RESPONDED]: [SubmissionStatus.CLOSED],
  [SubmissionStatus.CLOSED]: [], // Terminal state
  [SubmissionStatus.SPAM]: [SubmissionStatus.NEW] // Can be unmarked as spam
};

/**
 * Allowed file types for attachments
 */
export const AllowedAttachmentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip'
];

/**
 * Spam detection rules and their weights
 */
export const SpamDetectionRules = {
  // Content-based rules
  excessive_caps: { weight: 15, pattern: /[A-Z]{10,}/ },
  excessive_exclamation: { weight: 10, pattern: /!{3,}/ },
  suspicious_links: { weight: 25, pattern: /https?:\/\/[^\s]+/g },
  common_spam_words: {
    weight: 20,
    words: ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'urgent', 'limited time']
  },

  // Email-based rules
  suspicious_email_domain: { weight: 30, domains: ['tempmail.org', '10minutemail.com', 'guerrillamail.com'] },
  disposable_email: { weight: 35 },

  // Behavioral rules
  duplicate_content: { weight: 40 },
  rapid_submission: { weight: 25 }, // Multiple submissions from same IP
  suspicious_user_agent: { weight: 15 }
};

/**
 * ContactFormSubmission model class with validation and helper methods
 */
export class ContactFormSubmissionModel {
  /**
   * Validates submission creation data
   */
  static validate(data: unknown): CreateContactFormSubmissionData {
    const validated = CreateContactFormSubmissionSchema.parse(data);

    // Validate attachment file types
    if (validated.attachments) {
      for (const attachment of validated.attachments) {
        if (!AllowedAttachmentTypes.includes(attachment.content_type)) {
          throw new Error(`File type ${attachment.content_type} is not allowed`);
        }
      }

      // Check total attachment size (50MB total limit)
      const totalSize = validated.attachments.reduce((sum, att) => sum + att.size, 0);
      if (totalSize > 50 * 1024 * 1024) {
        throw new Error('Total attachment size exceeds 50MB limit');
      }
    }

    return validated;
  }

  /**
   * Validates submission update data
   */
  static validateUpdate(data: unknown): UpdateContactFormSubmissionData {
    return UpdateContactFormSubmissionSchema.parse(data);
  }

  /**
   * Creates a new ContactFormSubmission instance with spam detection
   */
  static async create(data: CreateContactFormSubmissionData): Promise<ContactFormSubmission> {
    const validated = this.validate(data);

    // Perform spam detection
    const spamDetection = await this.detectSpam(validated);

    return {
      id: crypto.randomUUID(),
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      subject: validated.subject,
      message: validated.message,
      attachments: validated.attachments,
      ip_address: validated.ip_address,
      user_agent: validated.user_agent,
      referrer: validated.referrer,
      submitted_at: new Date(),
      status: spamDetection.is_spam ? SubmissionStatus.SPAM : SubmissionStatus.NEW,
      assigned_to: null,
      responded_at: null,
      response_email_id: null,
      spam_detection: spamDetection,
      metadata: validated.metadata
    };
  }

  /**
   * Updates submission status with validation
   */
  static updateStatus(submission: ContactFormSubmission, newStatus: SubmissionStatus, updateData?: Partial<UpdateContactFormSubmissionData>): Partial<ContactFormSubmission> {
    // Validate state transition
    if (!this.canTransitionTo(submission.status, newStatus)) {
      throw new Error(`Invalid status transition from ${submission.status} to ${newStatus}`);
    }

    const updates: Partial<ContactFormSubmission> = {
      status: newStatus,
      ...updateData
    };

    // Set responded_at when transitioning to RESPONDED
    if (newStatus === SubmissionStatus.RESPONDED && !submission.responded_at) {
      updates.responded_at = new Date();
    }

    return updates;
  }

  /**
   * Checks if a status transition is valid
   */
  static canTransitionTo(currentStatus: SubmissionStatus, newStatus: SubmissionStatus): boolean {
    return ValidStatusTransitions[currentStatus].includes(newStatus);
  }

  /**
   * Performs spam detection on submission content
   */
  static async detectSpam(data: CreateContactFormSubmissionData): Promise<SpamDetectionResult> {
    const triggered_rules: string[] = [];
    let score = 0;

    // Content analysis
    const fullText = `${data.subject} ${data.message}`.toLowerCase();

    // Check for excessive caps
    if (SpamDetectionRules.excessive_caps.pattern.test(data.message)) {
      triggered_rules.push('excessive_caps');
      score += SpamDetectionRules.excessive_caps.weight;
    }

    // Check for excessive exclamation marks
    if (SpamDetectionRules.excessive_exclamation.pattern.test(data.message)) {
      triggered_rules.push('excessive_exclamation');
      score += SpamDetectionRules.excessive_exclamation.weight;
    }

    // Check for suspicious links
    const linkMatches = data.message.match(SpamDetectionRules.suspicious_links.pattern);
    if (linkMatches && linkMatches.length > 2) {
      triggered_rules.push('suspicious_links');
      score += SpamDetectionRules.suspicious_links.weight;
    }

    // Check for common spam words
    const spamWords = SpamDetectionRules.common_spam_words.words;
    const foundSpamWords = spamWords.filter(word => fullText.includes(word));
    if (foundSpamWords.length > 0) {
      triggered_rules.push('common_spam_words');
      score += SpamDetectionRules.common_spam_words.weight * foundSpamWords.length;
    }

    // Email domain analysis
    const emailDomain = data.email.split('@')[1]?.toLowerCase();
    if (emailDomain && SpamDetectionRules.suspicious_email_domain.domains.includes(emailDomain)) {
      triggered_rules.push('suspicious_email_domain');
      score += SpamDetectionRules.suspicious_email_domain.weight;
    }

    // Check for disposable email patterns
    if (this.isDisposableEmail(data.email)) {
      triggered_rules.push('disposable_email');
      score += SpamDetectionRules.disposable_email.weight;
    }

    // User agent analysis
    if (this.isSuspiciousUserAgent(data.user_agent)) {
      triggered_rules.push('suspicious_user_agent');
      score += SpamDetectionRules.suspicious_user_agent.weight;
    }

    // Determine confidence based on number of triggered rules
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (triggered_rules.length >= 4) confidence = 'high';
    else if (triggered_rules.length >= 2) confidence = 'medium';

    const is_spam = score >= 50 || confidence === 'high';

    return {
      score: Math.min(score, 100),
      is_spam,
      triggered_rules,
      confidence,
      metadata: {
        email_domain: emailDomain,
        spam_word_count: foundSpamWords?.length || 0,
        link_count: linkMatches?.length || 0
      }
    };
  }

  /**
   * Checks if an email is from a disposable email service
   */
  static isDisposableEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'throwaway.email', 'temp-mail.org', 'sharklasers.com', 'yopmail.com'
    ];
    return disposableDomains.includes(domain);
  }

  /**
   * Checks if a user agent appears suspicious
   */
  static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspicious = [
      'python', 'curl', 'wget', 'bot', 'crawler', 'spider', 'scraper'
    ];
    const ua = userAgent.toLowerCase();
    return suspicious.some(term => ua.includes(term)) || userAgent.length < 10;
  }

  /**
   * Gets submissions requiring attention (new, in progress)
   */
  static requiresAttention(submission: ContactFormSubmission): boolean {
    return [SubmissionStatus.NEW, SubmissionStatus.IN_PROGRESS].includes(submission.status) &&
           submission.status !== SubmissionStatus.SPAM;
  }

  /**
   * Calculates response time for closed submissions
   */
  static getResponseTime(submission: ContactFormSubmission): number | null {
    if (!submission.responded_at) {
      return null;
    }
    return submission.responded_at.getTime() - submission.submitted_at.getTime();
  }

  /**
   * Gets submission status display with color coding
   */
  static getStatusDisplay(status: SubmissionStatus): { text: string; color: string; priority: number } {
    const displays = {
      [SubmissionStatus.NEW]: { text: 'New', color: 'blue', priority: 1 },
      [SubmissionStatus.IN_PROGRESS]: { text: 'In Progress', color: 'yellow', priority: 2 },
      [SubmissionStatus.RESPONDED]: { text: 'Responded', color: 'green', priority: 3 },
      [SubmissionStatus.CLOSED]: { text: 'Closed', color: 'gray', priority: 4 },
      [SubmissionStatus.SPAM]: { text: 'Spam', color: 'red', priority: 5 }
    };
    return displays[status];
  }

  /**
   * Formats attachment info for display
   */
  static formatAttachments(attachments: ContactAttachment[]): string {
    if (!attachments || attachments.length === 0) {
      return 'No attachments';
    }

    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const sizeStr = this.formatFileSize(totalSize);
    return `${attachments.length} file(s), ${sizeStr}`;
  }

  /**
   * Formats byte size for display
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  /**
   * Formats submission for display
   */
  static format(submission: ContactFormSubmission): string {
    const timestamp = submission.submitted_at.toISOString();
    const status = submission.status.toLowerCase();
    const attachments = this.formatAttachments(submission.attachments || []);
    const spamScore = submission.spam_detection?.score || 0;

    return `${timestamp} | ${status} | ${submission.email} | ${submission.subject} | ${attachments} | Spam: ${spamScore}%`;
  }

  /**
   * Creates a submission filter for querying
   */
  static createFilter(options: {
    status?: SubmissionStatus;
    assignedTo?: string;
    email?: string;
    ipAddress?: string;
    isSpam?: boolean;
    hasAttachments?: boolean;
    startTime?: Date;
    endTime?: Date;
    spamScoreMin?: number;
    spamScoreMax?: number;
  }) {
    const filter: any = {};

    if (options.status) filter.status = options.status;
    if (options.assignedTo) filter.assigned_to = options.assignedTo;
    if (options.email) filter.email = { contains: options.email };
    if (options.ipAddress) filter.ip_address = options.ipAddress;

    if (options.startTime || options.endTime) {
      filter.submitted_at = {};
      if (options.startTime) filter.submitted_at.gte = options.startTime;
      if (options.endTime) filter.submitted_at.lte = options.endTime;
    }

    if (options.hasAttachments !== undefined) {
      filter.attachments = options.hasAttachments ? { not: null } : null;
    }

    if (options.isSpam !== undefined) {
      filter.spam_detection = {
        path: ['is_spam'],
        equals: options.isSpam
      };
    }

    return filter;
  }

  /**
   * Generates submission statistics
   */
  static generateStats(submissions: ContactFormSubmission[]): {
    total: number;
    by_status: Record<SubmissionStatus, number>;
    spam_rate: number;
    avg_response_time: number;
    with_attachments: number;
    unique_ips: number;
  } {
    const total = submissions.length;
    const by_status = Object.values(SubmissionStatus).reduce((acc, status) => {
      acc[status] = submissions.filter(s => s.status === status).length;
      return acc;
    }, {} as Record<SubmissionStatus, number>);

    const spam_rate = total > 0 ? (by_status[SubmissionStatus.SPAM] / total) * 100 : 0;

    const responseTimes = submissions
      .map(s => this.getResponseTime(s))
      .filter(time => time !== null) as number[];

    const avg_response_time = responseTimes.length > 0 ?
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;

    const with_attachments = submissions.filter(s => s.attachments && s.attachments.length > 0).length;
    const unique_ips = new Set(submissions.map(s => s.ip_address)).size;

    return {
      total,
      by_status,
      spam_rate,
      avg_response_time,
      with_attachments,
      unique_ips
    };
  }
}

/**
 * Type guard to check if an object is a valid ContactFormSubmission
 */
export function isContactFormSubmission(obj: any): obj is ContactFormSubmission {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.ip_address === 'string' &&
    typeof obj.user_agent === 'string' &&
    obj.submitted_at instanceof Date &&
    Object.values(SubmissionStatus).includes(obj.status)
  );
}

export default ContactFormSubmissionModel;