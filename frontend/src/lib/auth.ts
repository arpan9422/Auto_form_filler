export function getToken(): string | null {
  return "local-auth-token";
}

export function setToken(token: string): void {}

export function getRefreshToken(): string | null {
  return "local-refresh-token";
}

export function setRefreshToken(token: string): void {}

export function setAuthTokens(accessToken: string, refreshToken?: string): void {}

export function removeToken(): void {}

export function isAuthenticated(): boolean {
  return true;
}
