const TOKEN_COOKIE_NAME = "token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

export function getToken(): string | null {
  return getCookieValue(TOKEN_COOKIE_NAME);
}

export function setToken(token: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
}

export function getRefreshToken(): string | null {
  return getCookieValue(REFRESH_TOKEN_COOKIE_NAME);
}

export function setRefreshToken(token: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `${REFRESH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
}

export function setAuthTokens(accessToken: string, refreshToken?: string): void {
  setToken(accessToken);

  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

export function removeToken(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
