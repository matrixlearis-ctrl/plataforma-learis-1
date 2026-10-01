import React from 'react';
import { Link } from 'react-router-dom';
import { User, BadgeCheck } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  linkTo?: string;
  verified?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = '', size = 40, linkTo, verified, className = '' }) => {
  const inner = (
    <span
      className="relative inline-flex flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="w-full h-full rounded-full bg-gradient-to-br from-brand-blue to-brand-darkBlue overflow-hidden flex items-center justify-center shadow-sm">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
          />
        ) : (
          <User style={{ width: size * 0.5, height: size * 0.5 }} className="text-white" />
        )}
      </span>
      {verified && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm border border-gray-100">
          <BadgeCheck className="text-brand-blue" style={{ width: size * 0.3, height: size * 0.3 }} />
        </span>
      )}
    </span>
  );

  if (!linkTo) return inner;
  return <Link to={linkTo} aria-label={alt}>{inner}</Link>;
};

export default Avatar;