const TONES = [
  'bg-fog-200 text-charcoal-800',
  'bg-charcoal-700 text-paper-50',
  'bg-paper-200 text-charcoal-700 ring-1 ring-inset ring-fog-300',
  'bg-charcoal-500 text-paper-50',
  'bg-fog-300 text-charcoal-900',
];

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-24 w-24 text-2xl sm:h-28 sm:w-28 sm:text-3xl',
} as const;

interface AvatarProps {
  id: string;
  name: string;
  avatarUrl?: string;
  size?: keyof typeof SIZES;
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function toneFor(id: string) {
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return TONES[hash % TONES.length];
}

export function Avatar({ id, name, avatarUrl, size = 'md' }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-medium tracking-wide ${SIZES[size]} ${toneFor(id)}`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
}
