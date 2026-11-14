import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AssistantLayout } from '@/app/layouts/AssistantLayout';
import { ClientLayout } from '@/app/layouts/ClientLayout';
import { useMe } from '@/features/auth/api';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { getAuthToken } from '@/lib/api';
import { ClientHomePage } from '@/pages/ClientHomePage';
import { ClientThreadPage } from '@/pages/ClientThreadPage';
import { InboxPage } from '@/pages/InboxPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { SettingsAccountsPage } from '@/pages/SettingsAccountsPage';
import { SignupPage } from '@/pages/SignupPage';
import { TodayPage } from '@/pages/TodayPage';

function RootRedirect() {
  const token = getAuthToken();
  const { data, isLoading } = useMe();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) return null;
  if (!data?.user) return <Navigate to="/login" replace />;
  return <Navigate to={data.user.role === 'client' ? '/c' : '/app/today'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth role="assistant" allowNoAccounts>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        <Route
          path="/app"
          element={
            <RequireAuth role="assistant">
              <AssistantLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="inbox/:segment?/:threadId?" element={<InboxPage />} />
          <Route path="settings/accounts" element={<SettingsAccountsPage />} />
        </Route>

        <Route
          path="/c"
          element={
            <RequireAuth role="client">
              <ClientLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ClientHomePage />} />
          <Route path="thread/:threadId" element={<ClientThreadPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

