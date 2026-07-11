import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/layout/ProtectedRoute";
import { useSessionBootstrap } from "@/hooks/useSessionBootstrap";
import { useThemeSync } from "@/hooks/useThemeSync";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { OAuthCallbackPage } from "@/pages/auth/OAuthCallbackPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ChatsPage } from "@/pages/chats/ChatsPage";
import { FriendsPage } from "@/pages/friends/FriendsPage";
import { NotificationsPage } from "@/pages/notifications/NotificationsPage";
import { PeoplePage } from "@/pages/people/PeoplePage";
import { ProfilePage } from "@/pages/profile/ProfilePage";
import { RoomsPage } from "@/pages/rooms/RoomsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  useSessionBootstrap();
  useThemeSync();

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/people" replace />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/chats/:conversationId" element={<ChatsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:roomId" element={<ChatsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
