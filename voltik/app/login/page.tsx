import { Suspense } from 'react';
import { LoginPageClient } from './LoginPageClient';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted">Loading…</div>}>
      <LoginPageClient />
    </Suspense>
  );
}
