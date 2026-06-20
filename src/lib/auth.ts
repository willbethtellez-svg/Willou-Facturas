const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || 'willou2026';

export function checkPassword(input: string): boolean {
  return input === APP_PASSWORD;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('willou_auth') === 'true';
}

export function login(): void {
  localStorage.setItem('willou_auth', 'true');
}

export function logout(): void {
  localStorage.removeItem('willou_auth');
}
