// =============================================================================
// KnowSphere AI - Built-in Approved Company Knowledge Repository
// Covers approved SOPs, Service Descriptions, Pricing Rules, FAQs, & Projects
// =============================================================================

import type { Source } from './types';

export interface BuiltInDocument {
  id: string;
  filename: string;
  category: 'SOP' | 'Service' | 'Pricing' | 'FAQ' | 'Project';
  classification: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  pageNumber: number;
  section: string;
  title: string;
  content: string;
  keywords: string[];
}

export const APPROVED_COMPANY_DOCUMENTS: BuiltInDocument[] = [
  // ── Standard Operating Procedures (SOPs) ──────────────────────────────────
  {
    id: 'sop-fin-004-p1',
    filename: 'SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf',
    category: 'SOP',
    classification: 'Internal',
    pageNumber: 2,
    section: 'Section 1: Eligible Business Expenses & Daily Allowances',
    title: 'Travel & Expense Reimbursement Policy',
    content:
      'Employees traveling on official company business are eligible for expense reimbursement. ' +
      'Daily meal allowance (per diem) is capped at $75 per day without pre-approval. ' +
      'Hotel lodging is reimbursed up to $250 per night in standard metro areas and $350 per night in designated high-cost cities (SF, NYC, London). ' +
      'Personal vehicle mileage is reimbursed at the IRS standard rate of $0.67 per mile. ' +
      'Personal alcohol, in-room movies, gym fees, and traffic fines are non-reimbursable.',
    keywords: ['expense', 'reimbursement', 'travel', 'meals', 'per diem', 'hotel', 'mileage', 'allowance', 'receipt', 'finance'],
  },
  {
    id: 'sop-fin-004-p2',
    filename: 'SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf',
    category: 'SOP',
    classification: 'Internal',
    pageNumber: 3,
    section: 'Section 2: Submission Deadlines & Approval Thresholds',
    title: 'Expense Submission Timeline and Approval Limits',
    content:
      'All business expenses must be submitted via the Expensify portal within 30 calendar days of incurring the expense. ' +
      'Itemized digital receipts are mandatory for any expense exceeding $25. ' +
      'Approval thresholds: Expenses up to $500 require Direct Manager sign-off; ' +
      'expenses between $501 and $2,500 require Department Director approval; ' +
      'expenses exceeding $2,500 require Vice President of Finance sign-off. ' +
      'Approved reimbursements are deposited in the employee payroll cycle within 10 business days.',
    keywords: ['expense', 'reimbursement', 'submission', 'deadline', 'receipt', 'approval', 'manager', 'director', 'vp', 'expensify'],
  },
  {
    id: 'sop-ops-012-p1',
    filename: 'SOP-OPS-012_Remote_Work_and_Equipment_Policy.docx',
    category: 'SOP',
    classification: 'Internal',
    pageNumber: 1,
    section: 'Section 1: Home Office Stipend & Hardware Allocation',
    title: 'Remote Work & Equipment Provisioning SOP',
    content:
      'All full-time remote and hybrid employees receive a one-time, non-taxable $1,000 Home Office Stipend upon joining. ' +
      'This covers ergonomic desk chairs, external monitors, keyboards, mice, and webcams. ' +
      'Standard corporate hardware issued is an Apple MacBook Pro M3 (16GB/512GB) or Dell XPS 15 for engineering and general staff. ' +
      'Hardware remains company property and follows a strict 36-month refresh cycle.',
    keywords: ['remote', 'work', 'equipment', 'stipend', 'home office', 'laptop', 'macbook', 'dell', 'hardware', 'refresh'],
  },
  {
    id: 'sop-ops-012-p2',
    filename: 'SOP-OPS-012_Remote_Work_and_Equipment_Policy.docx',
    category: 'SOP',
    classification: 'Internal',
    pageNumber: 2,
    section: 'Section 2: Information Security & VPN Requirements',
    title: 'Remote Security & Network Access Guidelines',
    content:
      'Remote employees must always connect to the corporate Tailscale zero-trust VPN when accessing internal networks, code repositories, or customer databases. ' +
      'Full disk encryption (FileVault for macOS, BitLocker for Windows) and CrowdStrike endpoint detection must remain active at all times. ' +
      'Using unsecured public Wi-Fi networks (airports, cafes) without active VPN is strictly prohibited. ' +
      'Lost or stolen hardware must be reported to IT Security (security@knowsphere.internal) within 2 hours.',
    keywords: ['vpn', 'tailscale', 'security', 'remote', 'encryption', 'filevault', 'bitlocker', 'wifi', 'hardware loss', 'it'],
  },
  {
    id: 'sop-hr-002-p1',
    filename: 'SOP-HR-002_Employee_Onboarding_and_Access.pdf',
    category: 'SOP',
    classification: 'Internal',
    pageNumber: 1,
    section: 'Section 1: Onboarding Milestones (Day 1 to Day 90)',
    title: 'Employee Onboarding & Access Provisioning SOP',
    content:
      'The onboarding journey spans 90 days. Day 1: Okta SSO, corporate Google Workspace email, and 1Password vault credentials issued by IT. ' +
      'Week 1: Mandatory completion of Workplace Conduct, Data Privacy, and Information Security training modules on KnowSphere Academy. ' +
      'Every new hire is assigned a dedicated Department Mentor for 60 days. ' +
      'Formal check-in reviews are conducted at 30 days, 60 days, and 90 days by the People Operations team to confirm alignment and mutual fit.',
    keywords: ['onboarding', 'new hire', 'access', 'okta', 'sso', 'training', 'mentor', 'hr', '30-day', '60-day', '90-day', 'people ops'],
  },

  // ── Service Descriptions ──────────────────────────────────────────────────
  {
    id: 'srv-core-001',
    filename: 'DOC-SRV-001_KnowSphere_Enterprise_Platform_Overview.pdf',
    category: 'Service',
    classification: 'Public',
    pageNumber: 1,
    section: 'Section 1: KnowSphere Core Platform Architecture',
    title: 'KnowSphere Enterprise Knowledge Platform Overview',
    content:
      'KnowSphere AI is an internal enterprise intelligence platform providing private, retrieval-augmented generation (RAG) over corporate knowledge assets. ' +
      'Key capabilities include: Dense semantic search across unstructured documentation (PDF, DOCX, MD, TXT), ' +
      'Role-Based Access Control (RBAC) guaranteeing strict departmental privacy boundaries, ' +
      'NVIDIA NIM GPU-accelerated inference with sub-second response times, and real-time citation verification with exact document and page anchors.',
    keywords: ['platform', 'architecture', 'service', 'knowsphere', 'rag', 'semantic search', 'nvidia nim', 'rbac', 'capabilities'],
  },
  {
    id: 'srv-core-002',
    filename: 'DOC-SRV-001_KnowSphere_Enterprise_Platform_Overview.pdf',
    category: 'Service',
    classification: 'Public',
    pageNumber: 2,
    section: 'Section 2: Security Boundaries & Tenant Isolation',
    title: 'Data Privacy, Security & Tenant Isolation Standards',
    content:
      'KnowSphere AI enforces absolute tenant isolation. Customer documentation is never used to train public foundation models or shared across client environments. ' +
      'All embeddings and chat inferences run through dedicated or private NVIDIA NIM microservice instances. ' +
      'The platform is SOC 2 Type II certified, ISO 27001 compliant, and GDPR/HIPAA ready. ' +
      'Data is encrypted with AES-256 at rest and TLS 1.3 in transit.',
    keywords: ['security', 'privacy', 'soc 2', 'gdpr', 'hipaa', 'encryption', 'aes-256', 'tenant isolation', 'nvidia nim'],
  },
  {
    id: 'srv-api-003',
    filename: 'DOC-SRV-002_Connectors_and_Integrations.md',
    category: 'Service',
    classification: 'Internal',
    pageNumber: 1,
    section: 'Section 1: Enterprise Knowledge Connectors',
    title: 'Enterprise Connectors & Sync Specifications',
    content:
      'KnowSphere provides native enterprise connectors for Google Drive, Microsoft SharePoint/OneDrive, Atlassian Confluence, Jira, and Slack. ' +
      'Incremental synchronization runs on an hourly schedule or via real-time webhooks. ' +
      'Document permissions in source systems (e.g. Google Drive sharing access) are mapped directly to user query access boundaries.',
    keywords: ['connectors', 'integrations', 'google drive', 'sharepoint', 'confluence', 'jira', 'slack', 'sync'],
  },

  // ── Pricing Rules & Discount Policies ─────────────────────────────────────
  {
    id: 'prc-tier-001',
    filename: 'REV-PRC-2026_KnowSphere_Pricing_Rules.pdf',
    category: 'Pricing',
    classification: 'Confidential',
    pageNumber: 1,
    section: 'Section 1: Commercial Tier Matrix & Features',
    title: 'Platform Pricing Tiers & Seat Pricing Schedule',
    content:
      'KnowSphere Commercial Pricing Schedule (Annual Billing): ' +
      '1. Starter Tier: $15 per user/month (minimum 10 seats, maximum 50 seats). Includes 5,000 indexed documents, standard support (24-hour SLA), and basic analytics. ' +
      '2. Business Tier: $35 per user/month (minimum 25 seats, up to 500 seats). Includes 50,000 indexed documents, high-speed NVIDIA NIM models, Okta SSO, and 4-hour SLA. ' +
      '3. Enterprise Tier: Custom pricing starting at $65 per user/month (minimum 100 seats). Unlimited documents, dedicated private GPU instance, custom SLA (99.99%), air-gapped on-premise deployment, and dedicated Technical Account Manager.',
    keywords: ['pricing', 'tiers', 'starter', 'business', 'enterprise', 'cost', 'subscription', 'seats', 'plan', 'billing'],
  },
  {
    id: 'prc-disc-002',
    filename: 'REV-PRC-2026_KnowSphere_Pricing_Rules.pdf',
    category: 'Pricing',
    classification: 'Confidential',
    pageNumber: 2,
    section: 'Section 2: Approved Discounting Thresholds & Approvals',
    title: 'Sales Discounting Governance and Authorization Rules',
    content:
      'Sales representatives must strictly follow the Discount Governance Policy: ' +
      'Discounts of 0% to 10%: Authorized by Account Executives for annual prepayment contracts. ' +
      'Discounts of 11% to 20%: Require written approval from Regional Sales Director in Salesforce. ' +
      'Discounts greater than 20%: Require formal approval from Chief Revenue Officer (CRO) and VP of Finance. ' +
      'Multi-year agreements (3+ years) are eligible for an additional 5% compounding annual discount upon Director approval.',
    keywords: ['discount', 'rules', 'pricing', 'approval', 'sales', 'salesforce', 'cro', 'director', 'multi-year', 'thresholds'],
  },

  // ── FAQs & Policies ───────────────────────────────────────────────────────
  {
    id: 'faq-ref-001',
    filename: 'POL-REV-008_Refund_and_Cancellation_Policy.pdf',
    category: 'FAQ',
    classification: 'Public',
    pageNumber: 1,
    section: 'Section 1: Customer Refund Eligibility & Guarantee',
    title: 'Customer Refund & Cancellation Policy',
    content:
      'Customers may request a full refund within 30 calendar days of initial platform purchase if service usage has not exceeded 10 hours. ' +
      'Refund requests must be submitted in writing to billing@knowsphere.internal with invoice details. ' +
      'Approved refunds are credited to the original payment method within 5 to 10 business days.',
    keywords: ['refund', 'cancellation', 'money-back', '30 days', '10 hours', 'guarantee', 'billing', 'credit'],
  },
  {
    id: 'faq-ref-002',
    filename: 'POL-REV-008_Refund_and_Cancellation_Policy.pdf',
    category: 'FAQ',
    classification: 'Public',
    pageNumber: 2,
    section: 'Section 2: Non-Refundable Items & Termination',
    title: 'Refund Exclusions and Professional Services Rules',
    content:
      'The following services are strictly non-refundable: ' +
      '1. Custom enterprise integration and professional onboarding engineering fees. ' +
      '2. Annual upfront subscription plans once the initial 30-day trial period has elapsed. ' +
      '3. Dedicated reserved GPU instance fees billed through NVIDIA NIM infrastructure.',
    keywords: ['refund', 'non-refundable', 'exceptions', 'annual', 'professional services', 'onboarding fee', 'gpu reservation'],
  },
  {
    id: 'faq-it-003',
    filename: 'POL-IT-003_Incident_Escalation_and_Helpdesk.md',
    category: 'FAQ',
    classification: 'Internal',
    pageNumber: 1,
    section: 'Section 1: Helpdesk SLAs and Incident Escalation',
    title: 'IT Incident Priority Matrix & Escalation Desk',
    content:
      'The Internal IT Helpdesk classifies issues into three priority tiers: ' +
      'P1 - Critical (Entire service down, data breach threat): 15-minute response SLA, 4-hour target resolution. Dedicated war room opened on Slack #incident-p1. ' +
      'P2 - Major (Core department workflow blocked): 1-hour response SLA, 8-hour target resolution. ' +
      'P3 - Normal (General inquiries, single user password reset): 4-business-hour response SLA. ' +
      'Contact the helpdesk at it-support@knowsphere.internal or page urgent on-call at ext 911.',
    keywords: ['it', 'helpdesk', 'support', 'escalation', 'sla', 'priority', 'p1', 'p2', 'p3', 'incident', 'slack'],
  },

  // ── Project Documentation ─────────────────────────────────────────────────
  {
    id: 'doc-eng-001',
    filename: 'DOC-ENG-2026_KnowSphere_Architecture_Roadmap.md',
    category: 'Project',
    classification: 'Internal',
    pageNumber: 1,
    section: 'Section 1: Project Scope & Core Architecture',
    title: 'KnowSphere AI Technical Architecture and Engineering Roadmap',
    content:
      'KnowSphere AI is an internal company knowledge assistant designed for company AI engineering assessments and enterprise production. ' +
      'Technology stack: Next.js 16 (React 19 App Router), Vanilla CSS glassmorphic interface, Supabase pgvector for vector embeddings, ' +
      'and NVIDIA NIM inference powered by Nemotron 3.5 Bolt (nvidia/nemotron-3.5-bolt-e4b) and Nemotron 3.5 Embeddings. ' +
      'Key engineering deliverables include: semantic chunking with overlap preservation, live model failover logic, ' +
      'interactive NVIDIA API Key runtime management, and automated test coverage across core RAG pipelines.',
    keywords: ['project', 'architecture', 'engineering', 'next.js', 'react', 'supabase', 'pgvector', 'nvidia nim', 'bolt', 'roadmap'],
  },
];

/**
 * Perform a keyword and semantic token score matching over the approved company repository.
 * Returns formatted Source objects suitable for RAG inference and UI citation display.
 */
export function searchBuiltInKnowledge(query: string, topK = 4): Source[] {
  if (!query || typeof query !== 'string') return [];

  const normalized = query.toLowerCase().trim();
  const queryTokens = normalized.split(/\W+/).filter((t) => t.length > 2);

  if (queryTokens.length === 0) return [];

  const scoredDocs = APPROVED_COMPANY_DOCUMENTS.map((doc, idx) => {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    const filenameLower = doc.filename.toLowerCase();
    const sectionLower = doc.section.toLowerCase();

    // Check query tokens
    for (const token of queryTokens) {
      if (doc.keywords.some((k) => k.includes(token) || token.includes(k))) score += 5;
      if (titleLower.includes(token)) score += 4;
      if (sectionLower.includes(token)) score += 3;
      if (filenameLower.includes(token)) score += 2;
      if (contentLower.includes(token)) score += 1;
    }

    // Exact phrase bonus
    if (contentLower.includes(normalized) || titleLower.includes(normalized)) {
      score += 15;
    }

    return { doc, score, idx };
  });

  // Filter docs with positive scores and sort descending
  const matches = scoredDocs
    .filter((item) => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return matches.map((item, i) => {
    const rawExcerpt = item.doc.content;
    const excerpt = rawExcerpt.length > 300 ? rawExcerpt.slice(0, 300) + '…' : rawExcerpt;
    // Normalized similarity between 0.70 and 0.98
    const baseSim = 0.75 + Math.min(0.23, (item.score / 30) * 0.23);
    const similarity = Math.round(baseSim * 100) / 100;

    return {
      chunkId: `builtin-${item.doc.id}`,
      documentId: `doc-${item.doc.id}`,
      filename: item.doc.filename,
      fileType: item.doc.filename.endsWith('.pdf') ? 'pdf' : item.doc.filename.endsWith('.docx') ? 'docx' : 'md',
      pageNumber: item.doc.pageNumber,
      excerpt,
      similarity,
      chunkIndex: i,
    };
  });
}
