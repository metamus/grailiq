import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';

// Lazy-loaded pages for code-splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Sets = lazy(() => import('@/pages/Sets'));
const SetDetail = lazy(() => import('@/pages/SetDetail'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const Alerts = lazy(() => import('@/pages/Alerts'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const SignIn = lazy(() => import('@/pages/SignIn'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  );
}

/** Root application component with Supabase auth and routing */
export default function App() {
  const { setUser, setSession, setLoading } = useAuthStore();

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

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="sets" element={<Sets />} />
          <Route path="sets/:id" element={<SetDetail />} />
          <Route path="products/:id" element={<ProductDetail />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="pricing" element={<Pricing />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
