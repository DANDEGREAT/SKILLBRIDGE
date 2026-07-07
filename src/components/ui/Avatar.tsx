import { getInitials, getAvatarColor } from '../../lib/utils';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const dotSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

export function Avatar({ firstName, lastName, size = 'md', online, className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const color = getAvatarColor(firstName + lastName);

  return (
    <div className={`relative inline-flex ${className || ''}`}>
      <div
        className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      >
        {initials}
      </div>
      {online !== undefined && (
        <div
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-bg-2 ${online ? 'bg-success online-pulse' : 'bg-text-3'}`}
        />
      )}
    </div>
  );
}
