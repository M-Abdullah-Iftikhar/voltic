import { Suspense } from 'react';
import { SignupPageClient } from './SignupPageClient';

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted">Loading…</div>}>
      <SignupPageClient />
    </Suspense>
  );
}
