import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { CalendarPage } from "@/pages/CalendarPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DataRoomPage } from "@/pages/DataRoomPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SignInPage } from "@/pages/SignInPage";
import { SignUpPage } from "@/pages/SignUpPage";
import { TermConfigPage } from "@/pages/TermConfigPage";
import { TermPage } from "@/pages/TermPage";
import { TrophiesPage } from "@/pages/TrophiesPage";
import { AUTH_CHANGE_EVENT, isAuthenticated } from "@/lib/auth";

function ProtectedRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <>{children}</> : <Navigate to="/signin" replace />;
}

function GuestRoute({ authed, children }: { authed: boolean; children: ReactNode | null }) {
  return authed ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_CHANGE_EVENT, sync);

    // Ensure tab starts with latest value from localStorage
    sync();

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
    };
  }, []);

  return (
    <Routes>
      <Route path="/signin" element={<GuestRoute authed={authed}><SignInPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute authed={authed}><SignUpPage /></GuestRoute>} />

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
