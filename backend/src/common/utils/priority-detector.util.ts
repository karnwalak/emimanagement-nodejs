const URGENT_KEYWORDS = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'hack', 'breach', 'security'];
const HIGH_KEYWORDS = ['important', 'problem', 'issue', 'error', 'bug', 'broken', 'not working'];

export function detectContactPriority(subject: string, message: string): 'urgent' | 'high' | 'medium' {
  const text = `${subject} ${message}`.toLowerCase();

  if (URGENT_KEYWORDS.some((kw) => text.includes(kw))) return 'urgent';
  if (HIGH_KEYWORDS.some((kw) => text.includes(kw))) return 'high';
  return 'medium';
}
