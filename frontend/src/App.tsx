import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { CalendarPage } from "@/pages/CalendarPage";
import { CoursesPage } from "@/pages/CoursesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DataRoomPage } from "@/pages/DataRoomPage";
import { LoginPage } from "@/pages/LoginPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TermConfigPage } from "@/pages/TermConfigPage";
import { TermPage } from "@/pages/TermPage";
import { TrophiesPage } from "@/pages/TrophiesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/term" element={<TermPage />} />
        <Route path="/data-room" element={<DataRoomPage />} />
        <Route path="/trophies" element={<TrophiesPage />} />
        <Route path="/term-config" element={<TermConfigPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
