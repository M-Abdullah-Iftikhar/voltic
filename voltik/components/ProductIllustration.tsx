import { Icon, type IconKey } from './Icons';

const GRADIENTS: Record<string, string> = {
  charging: 'linear-gradient(135deg,#00d4ff,#7c3aed)',
  audio:    'linear-gradient(135deg,#ff6b6b,#ee0979)',
  screens:  'linear-gradient(135deg,#11998e,#38ef7d)',
  cases:    'linear-gradient(135deg,#f093fb,#f5576c)',
  camera:   'linear-gradient(135deg,#ffd86f,#fc6262)',
  storage:  'linear-gradient(135deg,#4facfe,#00f2fe)',
  connect:  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  mounts:   'linear-gradient(135deg,#fa709a,#fee140)'
};

interface Props {
  category: string;
  icon: string;
  size?: number;
  rounded?: string;
  className?: string;
}

export function ProductIllustration({ category, icon, size = 96, rounded = 'rounded-2xl', className = '' }: Props) {
  const bg = GRADIENTS[category] || 'linear-gradient(135deg,#64748b,#1e293b)';
  const Glyph = Icon[(icon as IconKey)] || Icon.box;
  return (
    <div
      className={`illus ${rounded} flex items-center justify-center text-white ${className}`}
      style={{ background: bg }}
    >
      <Glyph width={size} height={size} strokeWidth={1.4} />
    </div>
  );
}
