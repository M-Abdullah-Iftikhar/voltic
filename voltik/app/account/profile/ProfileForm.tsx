'use client';
import { useState } from 'react';
import { Icon } from '@/components/Icons';
import { useUser } from '@/components/UserContext';
import type { PublicUser } from '@/lib/types';

export function ProfileForm({ user }: { user: PublicUser }) {
  const { refresh } = useUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null); setSavingProfile(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    setSavingProfile(false);
    if (!res.ok) { setProfileMsg({ ok: false, text: data.error || 'Could not save.' }); return; }
    await refresh();
    setProfileMsg({ ok: true, text: 'Profile updated.' });
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirm) { setPasswordMsg({ ok: false, text: 'New password and confirmation do not match.' }); return; }
    setSavingPassword(true);
    const res = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    setSavingPassword(false);
    if (!res.ok) { setPasswordMsg({ ok: false, text: data.error || 'Could not update password.' }); return; }
    setPasswordMsg({ ok: true, text: 'Password updated.' });
    setCurrent(''); setNewPwd(''); setConfirm('');
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div className="space-y-6">
        {/* Profile details */}
        <form onSubmit={saveProfile} className="card p-6 space-y-4">
          <h3 className="font-display font-bold text-lg">Personal details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
          </div>
          {profileMsg && (
            <Banner kind={profileMsg.ok ? 'success' : 'danger'}>{profileMsg.text}</Banner>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary text-sm disabled:opacity-60">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="card p-6 space-y-4">
          <h3 className="font-display font-bold text-lg">Change password</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Current password">
              <div className="relative">
                <input className="input pr-12" type={showPwd ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrent(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs">
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </Field>
            <div className="hidden sm:block" />
            <Field label="New password (min. 6)">
              <input className="input" type={showPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPwd(e.target.value)} required minLength={6} />
            </Field>
            <Field label="Confirm new password">
              <input className="input" type={showPwd ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
            </Field>
          </div>
          {passwordMsg && (
            <Banner kind={passwordMsg.ok ? 'success' : 'danger'}>{passwordMsg.text}</Banner>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword} className="btn-primary text-sm disabled:opacity-60">
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <aside className="space-y-4 self-start">
        <div className="card p-5">
          <h4 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Account</h4>
          <div className="text-sm space-y-2">
            <Row label="Member since" value={user.createdAt} />
            <Row label="User ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            <Row label="Cart lines" value={String(user.cart.length)} />
            <Row label="Favorites" value={String(user.favorites.length)} />
          </div>
        </div>
        <div className="card p-5 border-danger/30">
          <h4 className="text-xs uppercase tracking-wide text-danger font-semibold mb-2">Need to leave?</h4>
          <p className="text-xs text-muted">Your data stays on your account if you log out. You can come back any time.</p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink font-semibold">{value}</span>
    </div>
  );
}

function Banner({ kind, children }: { kind: 'success' | 'danger'; children: React.ReactNode }) {
  const style = kind === 'success'
    ? 'bg-success/10 text-success'
    : 'bg-danger/10 text-danger';
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${style}`}>
      {kind === 'success' ? <Icon.check width={14} height={14} /> : <Icon.close width={14} height={14} />}
      {children}
    </div>
  );
}
