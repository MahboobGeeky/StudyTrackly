import { ReactNode, Suspense, lazy, useSyncExternalStore } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { getAuthServerSnapshot, getAuthSnapshot, subscribeAuth } from "@/lib/auth";

const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })));
const SignInPage = lazy(() => import("@/pages/SignInPage").then((m) => ({ default: m.SignInPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const SessionsPage = lazy(() => import("@/pages/SessionsPage").then((m) => ({ default: m.SessionsPage })));
const CoursesPage = lazy(() => import("@/pages/CoursesPage").then((m) => ({ default: m.CoursesPage })));
const CalendarPage = lazy(() => import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const TermPage = lazy(() => import("@/pages/TermPage").then((m) => ({ default: m.TermPage })));
const DataRoomPage = lazy(() => import("@/pages/DataRoomPage").then((m) => ({ default: m.DataRoomPage })));
const TrophiesPage = lazy(() => import("@/pages/TrophiesPage").then((m) => ({ default: m.TrophiesPage })));
const TermConfigPage = lazy(() => import("@/pages/TermConfigPage").then((m) => ({ default: m.TermConfigPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

function ProtectedRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <>{children}</> : <Navigate to="/signin" replace />;
}

function GuestRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const authed = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/signin"
          element={
            <GuestRoute authed={authed}>
              <SignInPage />
            </GuestRoute>
          }
        />
        <Route path="/signup" element={<Navigate to="/signin" replace />} />

        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute authed={authed}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute authed={authed}>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute authed={authed}>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute authed={authed}>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/term"
            element={
              <ProtectedRoute authed={authed}>
                <TermPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data-room"
            element={
              <ProtectedRoute authed={authed}>
                <DataRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trophies"
            element={
              <ProtectedRoute authed={authed}>
                <TrophiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/term-config"
            element={
              <ProtectedRoute authed={authed}>
                <TermConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute authed={authed}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to={authed ? "/dashboard" : "/signin"} replace />} />
        <Route path="*" element={<Navigate to={authed ? "/dashboard" : "/signin"} replace />} />
      </Routes>
    </Suspense>
  );
}
