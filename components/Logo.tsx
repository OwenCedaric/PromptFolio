import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * Renders the site logo by reusing the external /favicon.svg file.
 * Uses CSS masking to ensure the logo inherits the text color (currentColor)
 * allowing for seamless Dark/Light mode support.
 */
export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div 
        className={`bg-current ${className}`}
        style={{
            maskImage: 'url(/favicon.svg)',
            WebkitMaskImage: 'url(/favicon.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center'
        }}
        role="img"
        aria-label="Logo"
    />
  );
};