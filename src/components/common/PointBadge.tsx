import React from 'react';
import { PelanggaranKategori } from '../../types';

interface PointBadgeProps {
  points: number;
  showSuffix?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PointBadge: React.FC<PointBadgeProps> = ({ points, showSuffix = true, size = 'md' }) => {
  let badgeStyle = '';
  let dotColor = '';

  if (points === 0) {
    badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
  } else if (points < 50) {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else {
    badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    dotColor = 'bg-rose-400';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border tracking-wide whitespace-nowrap ${badgeStyle} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {points} {showSuffix ? (points > 1 ? 'Poin' : 'Poin') : ''}
    </span>
  );
};

export const StatusSantriBadge: React.FC<{ status?: string }> = ({ status = 'Baik' }) => {
  let style = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  if (status === 'Peringatan Lisan') {
    style = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (status === 'SP 1' || status === 'SP 2') {
    style = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  } else if (status === 'SP 3' || status === 'Dikeluarkan') {
    style = 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold';
  }

  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md border font-medium ${style}`}>
      {status}
    </span>
  );
};

export type KategoriPelanggaranType = PelanggaranKategori;

/**
 * Aturan Kategori Otomatis Berdasarkan Poin:
 * 100 -> Sangat Berat (merah)
 * 90–99 -> Berat (oranye tua)
 * 70–89 -> Sedang (oranye)
 * 50–69 -> Ringan (biru)
 * 5–49 -> Sangat Ringan (hijau)
 */
export function getKategoriFromPoin(poin: number): {
  kategori: PelanggaranKategori;
  colorName: string;
  badgeClass: string;
  dotColor: string;
} {
  const p = Number(poin) || 0;
  if (p >= 100) {
    return {
      kategori: 'Sangat Berat',
      colorName: 'merah',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      dotColor: 'bg-rose-500'
    };
  }
  if (p >= 90) {
    return {
      kategori: 'Berat',
      colorName: 'oranye tua',
      badgeClass: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800/40',
      dotColor: 'bg-orange-600'
    };
  }
  if (p >= 70) {
    return {
      kategori: 'Sedang',
      colorName: 'oranye',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      dotColor: 'bg-amber-500'
    };
  }
  if (p >= 50) {
    return {
      kategori: 'Ringan',
      colorName: 'biru',
      badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
      dotColor: 'bg-blue-500'
    };
  }
  return {
    kategori: 'Sangat Ringan',
    colorName: 'hijau',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    dotColor: 'bg-emerald-500'
  };
}

export const KategoriPelanggaranBadge: React.FC<{
  kategori?: string;
  poin?: number;
  size?: 'sm' | 'md';
}> = ({ kategori, poin, size = 'md' }) => {
  // Always derive strictly from poin if provided, otherwise resolve category name
  const resolved = poin !== undefined
    ? getKategoriFromPoin(poin)
    : kategori === 'Sangat Berat'
    ? getKategoriFromPoin(100)
    : kategori === 'Berat'
    ? getKategoriFromPoin(95)
    : kategori === 'Sedang'
    ? getKategoriFromPoin(75)
    : kategori === 'Ringan'
    ? getKategoriFromPoin(55)
    : getKategoriFromPoin(15);

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border whitespace-nowrap ${resolved.badgeClass} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${resolved.dotColor}`} />
      {resolved.kategori}
    </span>
  );
};
