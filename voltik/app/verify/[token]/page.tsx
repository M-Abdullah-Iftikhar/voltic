import type { Metadata } from 'next';
import { VerifyEmailClient } from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify email · Voltik',
  description: 'Confirm your Voltik account email.'
};

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <VerifyEmailClient token={token} />;
}
