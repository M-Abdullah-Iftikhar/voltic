import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-bg">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
