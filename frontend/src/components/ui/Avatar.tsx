type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, { px: string; text: string }> = {
  sm: { px: 'h-6 w-6', text: 'text-[0.5rem]' },
  md: { px: 'h-8 w-8', text: 'text-[0.6rem]' },
  lg: { px: 'h-10 w-10', text: 'text-[0.7rem]' },
  xl: { px: 'h-14 w-14', text: 'text-[0.85rem]' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const { px, text } = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${px} rounded-full object-cover`}
        width={parseInt(px.split('-')[1]) * 4}
        height={parseInt(px.split('-')[1]) * 4}
      />
    );
  }

  return (
    <div
      className={[
        px,
        'rounded-full flex items-center justify-center',
        'bg-[var(--bg-secondary)] text-[var(--accent)]',
        'font-body font-semibold',
        text,
      ].join(' ')}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
