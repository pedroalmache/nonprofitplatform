export function claimAccountUrl(userId: string, token: string, origin?: string): string {
  const base = origin ?? window.location.origin;
  const url = new URL('/claim-account', base.endsWith('/') ? base : `${base}/`);
  url.searchParams.set('userId', userId);
  url.searchParams.set('token', token);
  return url.toString();
}
