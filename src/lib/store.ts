// =============================================================================
// KnowSphere AI - Client Data Store & App Mode Manager (Demo vs Clean Start)
// Manages dynamic document counts, chat history persistence, and mode switching.
// =============================================================================

import type { Document, DashboardStats, Source } from './types';

export type AppMode = 'demo' | 'clean';

const MODE_STORAGE_KEY = 'knowsphere_app_mode';
const CONVERSATIONS_STORAGE_KEY = 'knowsphere_conversations';
const DOCUMENTS_STORAGE_KEY = 'knowsphere_uploaded_docs';

export interface StoredConversation {
  id: string;
  title: string;
  model_used: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: Source[];
    modelUsed?: string;
  }>;
}

// ── Approved Demo Documents ──────────────────────────────────────────────────
export const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'demo-doc-1',
    filename: 'SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf',
    file_type: 'pdf',
    file_size: 245760, // 240 KB
    status: 'indexed',
    chunk_count: 8,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'demo-doc-2',
    filename: 'SOP-OPS-012_Remote_Work_and_Equipment_Policy.docx',
    file_type: 'docx',
    file_size: 118784, // 116 KB
    status: 'indexed',
    chunk_count: 4,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-doc-3',
    filename: 'SOP-HR-002_Employee_Onboarding_and_Access.pdf',
    file_type: 'pdf',
    file_size: 184320, // 180 KB
    status: 'indexed',
    chunk_count: 5,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-doc-4',
    filename: 'REV-PRC-2026_KnowSphere_Pricing_Rules.pdf',
    file_type: 'pdf',
    file_size: 94208, // 92 KB
    status: 'indexed',
    chunk_count: 3,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'demo-doc-5',
    filename: 'POL-REV-008_Refund_and_Cancellation_Policy.pdf',
    file_type: 'pdf',
    file_size: 77824, // 76 KB
    status: 'indexed',
    chunk_count: 4,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// ── Approved Demo Conversations ──────────────────────────────────────────────
export const DEMO_CONVERSATIONS: StoredConversation[] = [
  {
    id: 'demo-conv-1',
    title: 'Expense Reimbursement & Hotel Allowance',
    model_used: 'nvidia/nemotron-3.5-bolt-e4b',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'What is our expense reimbursement policy for meals and hotel stays?',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content:
          '**Expense Reimbursement Guidelines:**\n\n' +
          '* **Daily Meal Allowance (Per Diem):** Capped at **$75 per day** without requiring pre-approval [Source: SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf, Page 2].\n' +
          '* **Hotel Lodging:** Reimbursed up to **$250/night** in standard metros, and up to **$350/night** in high-cost cities [Source: SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf, Page 2].\n' +
          '* **Submission Deadline:** Must be submitted via Expensify within **30 calendar days** of the expense date [Source: SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf, Page 3].\n' +
          '* **Receipts:** Mandatory for transactions exceeding **$25**.\n' +
          '* **Approval Limits:** Under $500: Direct Manager; $501–$2,500: Department Director; >$2,500: VP of Finance [Source: SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf, Page 3].',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        modelUsed: 'nvidia/nemotron-3.5-bolt-e4b',
        sources: [
          {
            chunkId: 'builtin-sop-fin-004-p1',
            documentId: 'doc-sop-fin-004-p1',
            filename: 'SOP-FIN-004_Travel_and_Expense_Reimbursement.pdf',
            fileType: 'pdf',
            pageNumber: 2,
            excerpt: 'Employees traveling on official company business are eligible for expense reimbursement. Daily meal allowance is capped at $75 per day...',
            similarity: 0.94,
            chunkIndex: 0,
          },
        ],
      },
    ],
  },
  {
    id: 'demo-conv-2',
    title: 'Customer Refund Policy & Eligibility',
    model_used: 'nvidia/nemotron-3.5-bolt-e4b',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'What is our refund and cancellation policy?',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content:
          '**Customer Refund & Cancellation Terms:**\n\n' +
          '* **30-Day Money-Back Guarantee:** Customers can request a full refund within **30 calendar days** of purchase if platform usage is under 10 hours [Source: POL-REV-008_Refund_and_Cancellation_Policy.pdf, Page 1].\n' +
          '* **Processing Time:** Credited to original payment method within **5–10 business days**.\n' +
          '* **Non-Refundable Services:** Custom integration fees, professional onboarding engineering, and reserved GPU instances are strictly non-refundable [Source: POL-REV-008_Refund_and_Cancellation_Policy.pdf, Page 2].',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        modelUsed: 'nvidia/nemotron-3.5-bolt-e4b',
      },
    ],
  },
  {
    id: 'demo-conv-3',
    title: 'Remote Work Equipment Stipend & VPN',
    model_used: 'nvidia/nemotron-3.5-bolt-e4b',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: 'How much is the remote work stipend and what are the security rules?',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content:
          '**Remote Work Setup & Security Rules:**\n\n' +
          '* **Home Office Stipend:** Full-time employees receive a one-time, non-taxable **$1,000 allowance** for desk, monitor, and chair setup [Source: SOP-OPS-012_Remote_Work_and_Equipment_Policy.docx, Page 1].\n' +
          '* **Hardware Refresh:** Corporate laptops are renewed every **36 months**.\n' +
          '* **Tailscale VPN:** Remote staff must connect to Tailscale VPN whenever accessing internal company resources. Public Wi-Fi without VPN is prohibited [Source: SOP-OPS-012_Remote_Work_and_Equipment_Policy.docx, Page 2].',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        modelUsed: 'nvidia/nemotron-3.5-bolt-e4b',
      },
    ],
  },
];

// ── Mode Management ──────────────────────────────────────────────────────────
export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'demo';
  const saved = localStorage.getItem(MODE_STORAGE_KEY);
  return saved === 'clean' ? 'clean' : 'demo';
}

export function setAppMode(mode: AppMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent('knowsphere_mode_changed', { detail: { mode } }));
}

// ── Dynamic Document Stats ───────────────────────────────────────────────────
export function getStoredDocuments(): Document[] {
  if (typeof window === 'undefined') return DEMO_DOCUMENTS;
  const mode = getAppMode();

  let userDocs: Document[] = [];
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (raw) userDocs = JSON.parse(raw);
  } catch {}

  if (mode === 'clean') {
    return userDocs;
  }
  // Demo mode: combine demo docs with any user uploaded docs
  return [...DEMO_DOCUMENTS, ...userDocs];
}

export function addStoredDocument(doc: Document): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    const existing: Document[] = raw ? JSON.parse(raw) : [];
    const updated = [doc, ...existing.filter((d) => d.id !== doc.id)];
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('knowsphere_docs_updated'));
  } catch {}
}

export function deleteStoredDocument(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (raw) {
      const existing: Document[] = JSON.parse(raw);
      const updated = existing.filter((d) => d.id !== id);
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(updated));
    }
    window.dispatchEvent(new Event('knowsphere_docs_updated'));
  } catch {}
}

export function getDashboardStats(): DashboardStats {
  const docs = getStoredDocuments();
  const convs = getStoredConversations();
  const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 1), 0);

  return {
    totalDocuments: docs.length,
    indexedDocuments: docs.filter((d) => d.status === 'indexed').length,
    processingDocuments: docs.filter((d) => d.status === 'processing').length,
    failedDocuments: docs.filter((d) => d.status === 'failed').length,
    totalChunks,
    totalConversations: convs.length,
  };
}

// ── Persistent Chat History ──────────────────────────────────────────────────
export function getStoredConversations(): StoredConversation[] {
  if (typeof window === 'undefined') return DEMO_CONVERSATIONS;
  const mode = getAppMode();

  let userConvs: StoredConversation[] = [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) userConvs = JSON.parse(raw);
  } catch {}

  if (mode === 'clean') {
    return userConvs;
  }
  // Demo mode: demo conversations + user conversations
  const userIds = new Set(userConvs.map((c) => c.id));
  const uniqueDemos = DEMO_CONVERSATIONS.filter((d) => !userIds.has(d.id));
  return [...userConvs, ...uniqueDemos];
}

export function saveStoredConversation(conv: StoredConversation): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    const existing: StoredConversation[] = raw ? JSON.parse(raw) : [];
    const updated = [conv, ...existing.filter((c) => c.id !== conv.id)];
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('knowsphere_history_updated'));
  } catch {}
}

export function deleteStoredConversation(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (raw) {
      const existing: StoredConversation[] = JSON.parse(raw);
      const updated = existing.filter((c) => c.id !== id);
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
    }
    window.dispatchEvent(new Event('knowsphere_history_updated'));
  } catch {}
}

export function clearAllUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONVERSATIONS_STORAGE_KEY);
  localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  window.dispatchEvent(new Event('knowsphere_docs_updated'));
  window.dispatchEvent(new Event('knowsphere_history_updated'));
}
