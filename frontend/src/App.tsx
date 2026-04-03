import { ReactNode, useSyncExternalStore } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DataRoomPage } from "@/pages/DataRoomPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SignInPage } from "@/pages/SignInPage";
import { TermConfigPage } from "@/pages/TermConfigPage";
import { TermPage } from "@/pages/TermPage";
import { TrophiesPage } from "@/pages/TrophiesPage";
import { getAuthServerSnapshot, getAuthSnapshot, subscribeAuth } from "@/lib/auth";

function ProtectedRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <>{children}</> : <Navigate to="/signin" replace />;
}

function GuestRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const authed = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/signin" element={<GuestRoute authed={authed}><SignInPage /></GuestRoute>} />
      <Route path="/signup" element={<Navigate to="/signin" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute authed={authed}><DashboardPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute authed={authed}><SessionsPage /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute authed={authed}><CoursesPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute authed={authed}><CalendarPage /></ProtectedRoute>} />
        <Route path="/term" element={<ProtectedRoute authed={authed}><TermPage /></ProtectedRoute>} />
        <Route path="/data-room" element={<ProtectedRoute authed={authed}><DataRoomPage /></ProtectedRoute>} />
        <Route path="/trophies" element={<ProtectedRoute authed={authed}><TrophiesPage /></ProtectedRoute>} />
        <Route path="/term-config" element={<ProtectedRoute authed={authed}><TermConfigPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute authed={authed}><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to={authed ? "/dashboard" : "/signin"} replace />} />
      <Route path="*" element={<Navigate to={authed ? "/dashboard" : "/signin"} replace />} />
    </Routes>
  );
}
