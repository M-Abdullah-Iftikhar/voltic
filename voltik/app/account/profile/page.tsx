import { redirect } from 'next/navigation';
import { currentUser, publicUser } from '@/lib/auth';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/profile');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">Profile</h2>
        <p className="text-muted text-sm mt-1">Update your details and password.</p>
      </div>
      <ProfileForm user={publicUser(user)!} />
    </div>
  );
}
