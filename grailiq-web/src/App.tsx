import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePageTracking } from '@/hooks/usePageTracking';

// Lazy-loaded pages for code-splitting
const Landing = lazy(() => import('@/pages/Landing'));
const Score = lazy(() => import('@/pages/Score'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Sets = lazy(() => import('@/pages/Sets'));
const SetDetail = lazy(() => import('@/pages/SetDetail'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const Alerts = lazy(() => import('@/pages/Alerts'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const SignIn = lazy(() => import('@/pages/SignIn'));
const Admin = lazy(() => import('@/pages/Admin'));
const AdminRetailers = lazy(() => import('@/pages/AdminRetailers'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const Status = lazy(() => import('@/pages/Status'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Compare = lazy(() => import('@/pages/Compare'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}

/** Protected route wrapper — requires authentication */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

/** Public-only route — redirects to /app if already logged in */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

/** Root application component with Supabase auth and routing */
export default function App() {
  const { setUser, setSession, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setLoading]);

  usePageTracking();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          index
          element={
            <PublicOnlyRoute>
              <Landing />
            </PublicOnlyRoute>
          }
        />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/score" element={<Score />} />
        <Route path="/status" element={<Status />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="sets" element={<Sets />} />
          <Route path="sets/:id" element={<SetDetail />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="compare" element={<Compare />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="admin" element={<Admin />} />
          <Route path="admin/retailers" element={<AdminRetailers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
