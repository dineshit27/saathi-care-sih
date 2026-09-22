import React from 'react';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showWordmark?: boolean;
  showTagline?: boolean;
  taglineText?: string;
  variant?: 'dark' | 'light';
  className?: string;
  imgClassName?: string;
  alt?: string;
  badge?: string;
}

const SIZE_MAP: Record<string, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = false,
  showTagline = false,
  taglineText = 'Connected care. Closer to home.',
  variant = 'dark',
  className = '',
  imgClassName = '',
  alt = 'Saathi Care',
  badge
}) => {
  const sizeClass = typeof size === 'number' ? '' : (SIZE_MAP[size] || SIZE_MAP.md);
  const inlineSizeStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Saathi Care Emblem (Green + Yellow Heart & Medical Cross) */}
      <div
        className={`relative shrink-0 flex items-center justify-center bg-white rounded-xl overflow-hidden shadow-2xs p-0.5 border border-stone-100 ${sizeClass}`}
        style={inlineSizeStyle}
      >
        <img
          src="/logo.png"
          srcSet="/logo-sm.png 512w, /logo.png 1024w"
          sizes="(max-width: 640px) 48px, 96px"
          alt={alt}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-contain ${imgClassName}`}
        />
      </div>

      {/* Wordmark and Optional Tagline */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight ${
                size === 'lg' || size === 'xl' || size === '2xl'
                  ? 'text-2xl sm:text-3xl'
                  : size === 'sm' || size === 'xs'
                  ? 'text-base font-extrabold'
                  : 'text-xl'
              } ${isLight ? 'text-white' : 'text-[#164E43]'}`}
            >
              Saathi Care
            </span>
            {badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  isLight
                    ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          {showTagline && (
            <p
              className={`text-xs mt-1 font-medium tracking-normal ${
                isLight ? 'text-emerald-200/90' : 'text-stone-600'
              }`}
            >
              {taglineText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
