import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Card, CardBody } from '@/components/ui/Card';

/** Sign in / Sign up page using Supabase Auth UI */
export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-grailiq-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-grailiq-dark">
            Grail<span className="text-grailiq-purple">IQ</span>
          </h1>
          <p className="text-gray-500 mt-2">Know what your grails are worth</p>
        </div>
        <Card>
          <CardBody className="p-6">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#7F77DD',
                      brandAccent: '#6B63C4',
                    },
                    borderWidths: { buttonBorderWidth: '1px' },
                    radii: { borderRadiusButton: '8px', inputBorderRadius: '8px' },
                  },
                },
              }}
              providers={['google', 'apple']}
              redirectTo={window.location.origin}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
