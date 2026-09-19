import React from 'react';

interface MosqueLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'badge';
  withText?: boolean;
}

export const MosqueLogo: React.FC<MosqueLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon-only',
  withText = false
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Premium Mosque Icon Container */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A878] via-[#008761] to-[#044734] p-2 text-white shadow-lg shadow-emerald-900/30 border border-[#00B686]/40 shrink-0 ${iconSize}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Crescent & Star at top - Gold #F4B942 */}
          <path
            d="M16 2.5C16.8 2.5 17.5 2.8 18 3.3C17.2 3.5 16.6 4.2 16.6 5C16.6 5.8 17.2 6.5 18 6.7C17.5 7.2 16.8 7.5 16 7.5C14.6 7.5 13.5 6.4 13.5 5C13.5 3.6 14.6 2.5 16 2.5Z"
            fill="#F4B942"
          />
          <circle cx="17.8" cy="5" r="0.6" fill="#F4B942" />

          {/* Center Main Dome */}
          <path
            d="M16 7.5C12.5 7.5 10 10.5 10 14.5H22C22 10.5 19.5 7.5 16 7.5Z"
            fill="url(#dome-gradient)"
          />
          {/* Dome Accent Arch */}
          <path
            d="M16 9C13.8 9 12 11.2 12 14.5H20C20 11.2 18.2 9 16 9Z"
            stroke="#F4B942"
            strokeWidth="0.8"
            strokeDasharray="1.2 1.2"
            fill="none"
          />

          {/* Left Minaret */}
          <path d="M5.5 8L6.5 6.5L7.5 8V18.5H5.5V8Z" fill="#F4B942" />
          <path d="M4.5 18.5H8.5V26.5H4.5V18.5Z" fill="#006C4E" stroke="#00B686" strokeWidth="0.5" />
          <path d="M5.5 20H7.5V23H5.5V20Z" fill="#042C20" />

          {/* Right Minaret */}
          <path d="M24.5 8L25.5 6.5L26.5 8V18.5H24.5V8Z" fill="#F4B942" />
          <path d="M23.5 18.5H27.5V26.5H23.5V18.5Z" fill="#006C4E" stroke="#00B686" strokeWidth="0.5" />
          <path d="M24.5 20H26.5V23H24.5V20Z" fill="#042C20" />

          {/* Main Building Base */}
          <path
            d="M8.5 14.5H23.5V26.5H8.5V14.5Z"
            fill="url(#base-gradient)"
            stroke="#00B686"
            strokeWidth="0.5"
          />

          {/* Central Gate / Mihrab Arch */}
          <path
            d="M13.5 26.5V20.5C13.5 19.1 14.6 18 16 18C17.4 18 18.5 19.1 18.5 20.5V26.5H13.5Z"
            fill="#031F17"
            stroke="#F4B942"
            strokeWidth="0.8"
          />

          {/* Side Arches */}
          <path
            d="M10 26.5V22C10 21.2 10.7 20.5 11.5 20.5V26.5H10Z"
            fill="#031F17"
          />
          <path
            d="M20.5 26.5V20.5C21.3 20.5 22 21.2 22 22V26.5H20.5Z"
            fill="#031F17"
          />

          {/* Ground Base Line */}
          <path d="M3 26.5H29" stroke="#F4B942" strokeWidth="1.2" strokeLinecap="round" />

          {/* Gradients */}
          <defs>
            <linearGradient id="dome-gradient" x1="16" y1="7.5" x2="16" y2="14.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D69D" />
              <stop offset="1" stopColor="#008761" />
            </linearGradient>
            <linearGradient id="base-gradient" x1="16" y1="14.5" x2="16" y2="26.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#009E71" />
              <stop offset="1" stopColor="#005A40" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Optional Brand Text */}
      {withText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-black tracking-tight text-white">
              SIMKA<span className="text-[#00B686]">.ID</span>
            </span>
          </div>
          <span className="text-[10.5px] font-medium text-emerald-200/80 tracking-normal mt-0.5">
            Sistem Monitoring Karakter
          </span>
        </div>
      )}
    </div>
  );
};
