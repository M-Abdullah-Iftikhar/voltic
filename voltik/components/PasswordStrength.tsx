'use client';
import { useMemo } from 'react';
import { Icon } from './Icons';
import { assessPassword, MIN_PASSWORD_SCORE } from '@/lib/passwordStrength';

interface Props {
  password: string;
}

/**
 * Live password-strength meter — four-bar gauge + checklist of unmet
 * criteria. Renders nothing for an empty password so the field looks
 * clean until the user starts typing. Scoring lives in
 * `lib/passwordStrength.ts` so the server gate and the client meter
 * agree on what "strong enough" means.
 */
export function PasswordStrength({ password }: Props) {
  const strength = useMemo(() => assessPassword(password), [password]);
  if (!password) return null;

  const toneByScore: Record<number, { bar: string; text: string }> = {
    0: { bar: 'bg-danger',  text: 'text-danger' },
    1: { bar: 'bg-danger',  text: 'text-danger' },
    2: { bar: 'bg-warn',    text: 'text-warn' },
    3: { bar: 'bg-success', text: 'text-success' },
    4: { bar: 'bg-success', text: 'text-success' }
  };
  const tone = toneByScore[strength.score];
  const passes = strength.score >= MIN_PASSWORD_SCORE;

  return (
    <div className="mt-1.5 space-y-1.5" aria-live="polite">
      <div className="flex gap-1" aria-label={`Strength: ${strength.label}`}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? tone.bar : 'bg-elev'}`}
          />
        ))}
      </div>
      <div className={`text-[11px] font-semibold ${tone.text}`}>
        {strength.label}
        {passes && <span className="text-muted font-normal"> · meets policy</span>}
      </div>
      {strength.tips.length > 0 && !passes && (
        <ul className="text-[11px] text-muted space-y-0.5">
          {strength.tips.map(t => (
            <li key={t} className="flex items-center gap-1.5">
              <Icon.plus width={9} height={9} className="text-muted" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
