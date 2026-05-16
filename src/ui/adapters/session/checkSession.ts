export interface SessionData {
  premiumKey: string;
  email: string;
}

export async function verifyPremiumEmail(email: string) {
  const response = await fetch('/api/check-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  if (!response.ok) return null;
  const { premiumKey } = (await response.json()) as { premiumKey?: string };
  return premiumKey ? { premiumKey } : null;
}

export async function getExistingSession() {
  const response = await fetch('/api/check-session', { credentials: 'include' });
  if (!response.ok) return null;
  const data = (await response.json()) as SessionData;
  return data.premiumKey ? data : null;
}
