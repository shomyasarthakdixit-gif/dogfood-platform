interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 28, md: 36, lg: 48 };
const fontSizes = { sm: 11, md: 14, lg: 18 };

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function colorFromName(name: string) {
  const palette = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const px = sizes[size];
  const fs = fontSizes[size];
  const bg = colorFromName(name);
  return (
    <div
      aria-hidden="true"
      style={{
        width: px, height: px, borderRadius: '50%',
        background: bg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fs, fontWeight: 600, flexShrink: 0,
        fontFamily: 'var(--font-sans)',
        userSelect: 'none',
      }}
    >
      {initials(name)}
    </div>
  );
}
