import React from 'react';
import { THREELION_LOGO_DATA_URI } from '../assets/threeLlionLogoData';

interface ThreeLlionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export const ThreeLlionLogo: React.FC<ThreeLlionLogoProps> = React.memo(
  ({ className = '', size = 'md', animated = false }) => {
    const sizeClasses = {
      sm: 'h-10 sm:h-12 max-w-[180px]',
      md: 'h-16 sm:h-20 max-w-[260px]',
      lg: 'h-24 sm:h-32 max-w-[380px]',
      xl: 'h-36 sm:h-48 max-w-[500px]',
    }[size];

    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden select-none pointer-events-none ${
          animated ? 'animate-threelion-entrance' : ''
        } ${className}`}
      >
        <img
          src={THREELION_LOGO_DATA_URI}
          alt="3LLION"
          decoding="sync"
          loading="eager"
          className={`${sizeClasses} w-auto object-contain block`}
        />
        {animated && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-threelion-sheen"
          />
        )}
      </div>
    );
  }
);
