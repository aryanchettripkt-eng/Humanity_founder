import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AssistantLayout } from '@/app/layouts/AssistantLayout';
import { ClientLayout } from '@/app/layouts/ClientLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/features/auth/api';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { getAuthToken } from '@/lib/api';

const AboutPage = lazy(() =>
  import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const AuthCallbackPage = lazy(() =>
  import('@/pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage }))
);
const ClientHomePage = lazy(() =>
  import('@/pages/ClientHomePage').then((m) => ({ default: m.ClientHomePage }))
);
const ClientThreadPage = lazy(() =>
  import('@/pages/ClientThreadPage').then((m) => ({ default: m.ClientThreadPage }))
);
const InboxPage = lazy(() =>
  import('@/pages/InboxPage').then((m) => ({ default: m.InboxPage }))
);
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const OnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
const SettingsAccountsPage = lazy(() =>
  import('@/pages/SettingsAccountsPage').then((m) => ({ default: m.SettingsAccountsPage }))
);
const StatsPage = lazy(() =>
  import('@/pages/StatsPage').then((m) => ({ default: m.StatsPage }))
);
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const TodayPage = lazy(() =>
  import('@/pages/TodayPage').then((m) => ({ default: m.TodayPage }))
);

function RouteFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function RootRedirect() {
  const token = getAuthToken();
  const { data, isLoading } = useMe();

  if (!token) return <LandingPage />;
  if (isLoading) return null;
  if (!data?.user) return <Navigate to="/login" replace />;
  return <Navigate to={data.user.role === 'client' ? '/c' : '/app/today'} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
          <Route path="stats" element={<StatsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="settings/accounts" element={<SettingsAccountsPage />} />
        </Route>

        <Route
          path="/c"
          element={
            <RequireAuth role="client" allowAssistantPreview>
              <ClientLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ClientHomePage />} />
          <Route path="thread/:threadId" element={<ClientThreadPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

