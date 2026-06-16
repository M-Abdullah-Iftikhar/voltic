import { redirect } from 'next/navigation';
import { currentUser, publicUser } from '@/lib/auth';
import { ProfileForm } from './ProfileForm';
import { AddressBook } from './AddressBook';
import { DangerZone } from './DangerZone';
import { VerifyEmailBanner } from './VerifyEmailBanner';

export const dynamic = 'force-dynamic';

export default async function AccountProfilePage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/account/profile');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">Profile</h2>
        <p className="text-muted text-sm mt-1">Update your details, password and saved addresses.</p>
      </div>
      {user.emailVerified === false && <VerifyEmailBanner email={user.email} />}
      <ProfileForm user={publicUser(user)!} />
      <AddressBook initial={user.addresses || []} />
      <DangerZone />
    </div>
  );
}
