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

