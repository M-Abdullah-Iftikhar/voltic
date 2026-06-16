import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password · Voltik',
  description: 'Get a password-reset link by email.'
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
