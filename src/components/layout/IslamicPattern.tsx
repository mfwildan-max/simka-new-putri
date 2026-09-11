import React from 'react';

export const MosqueLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 p-2 text-emerald-400 shadow-lg shadow-emerald-500/10 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
      >
        {/* Dome */}
        <path d="M12 2c-2.5 2-4 4.5-4 7.5h8c0-3-1.5-5.5-4-7.5z" fill="currentColor" fillOpacity="0.2" />
        {/* Crescent / Finial */}
        <path d="M12 2v-1" />
        <circle cx="12" cy="0.5" r="0.5" fill="currentColor" />
        {/* Main Base */}
        <path d="M4 14h16v7H4z" />
        {/* Arch Doors */}
        <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
        <path d="M6 21v-3a1 1 0 0 1 2 0v3" />
        <path d="M16 21v-3a1 1 0 0 1 2 0v3" />
        {/* Minaret Left */}
        <path d="M3 14V8l1.5-2L6 8v6" />
        {/* Minaret Right */}
        <path d="M18 14V8l1.5-2L21 8v6" />
        {/* Base line */}
        <path d="M2 21h20" />
      </svg>
    </div>
  );
};

export const MosqueStamp: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3c-2.5 2-3.5 4.5-3.5 7h7c0-2.5-1-5-3.5-7z" />
      <path d="M4 14h16v7H4z" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      <path d="M2 21h20" />
      <path d="M3 14V9l1.5-2L6 9v5" />
      <path d="M18 14V9l1.5-2L21 9v5" />
    </svg>
  );
};
