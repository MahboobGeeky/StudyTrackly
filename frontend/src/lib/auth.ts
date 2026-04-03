export type AuthUser = { id: string; name: string; email: string; timerVolume?: number };

/** Fired in the same tab when login/logout updates localStorage (storage event only fires across tabs). */
export const AUTH_CHANGE_EVENT = "studytrackly-auth-change";

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem("studytrackly_token", token);
  localStorage.setItem("studytrackly_user", JSON.stringify(user));
  notifyAuthChanged();
}

export function clearAuth() {
  localStorage.removeItem("studytrackly_token");
  localStorage.removeItem("studytrackly_user");
  notifyAuthChanged();
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

/** Where API requests go. Empty = same origin (Vite dev proxies `/api` to the backend). */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
}

/** Full URL to start Google OAuth (must hit the backend; use absolute URL in production if needed). */
export function getGoogleAuthUrl(): string {
  const base = getApiBase();
  return base ? `${base}/api/auth/google` : "/api/auth/google";
}

/** For `useSyncExternalStore` — stays in sync with login/logout across tabs. */
export function subscribeAuth(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  };
}

export function getAuthSnapshot(): boolean {
  return isAuthenticated();
}

export function getAuthServerSnapshot(): boolean {
  return false;
}

export function getToken(): string | null {
  return localStorage.getItem("studytrackly_token");
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("studytrackly_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
