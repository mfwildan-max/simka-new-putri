import React from 'react';
import { useApp } from '../../context/AppContext';
import { PageRoute } from '../../types';
import { MosqueLogoIcon } from './IslamicPattern';
import {
  LayoutDashboard,
  Users,
  ClipboardEdit,
  Table2,
  BookOpen,
  ShieldCheck,
  UserCog,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  Database
} from 'lucide-react';
import { canRoleAccessRoute, getRoleDisplayName } from '../../lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavSection {
  groupTitle: string;
  items: {
    route: PageRoute;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { currentRoute, setCurrentRoute, user, logout, stats, openDatabaseModal } = useApp();

  if (!user) return null;

  // Sidebar Structure strictly matching USER_REQUEST:
  // DASHBOARD: Dashboard
  // PELANGGARAN: Rekap Pelanggaran, Data Santri, Catat Pelanggaran, Data Pelanggaran (Master)
  // PENGATURAN: Manajemen Pengguna, Akun Saya
  const navSections: NavSection[] = [
    {
      groupTitle: 'DASHBOARD',
      items: [
        {
          route: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      groupTitle: 'PELANGGARAN',
      items: [
        {
          route: 'rekap-pelanggaran',
          label: 'Rekap Pelanggaran',
          icon: Table2,
          badgeCount: stats.belumSelesai > 0 ? stats.belumSelesai : undefined
        },
        {
          route: 'data-santri',
          label: 'Data Santri',
          icon: Users
        },
        {
          route: 'catat-pelanggaran',
          label: 'Catat Pelanggaran',
          icon: ClipboardEdit
        },
        {
          route: 'data-pelanggaran',
          label: 'Data Pelanggaran (Master)',
          icon: BookOpen
        }
      ]
    },
    {
      groupTitle: 'PENGATURAN',
      items: [
        {
          route: 'manajemen-user',
          label: 'Manajemen Pengguna',
          icon: ShieldCheck
        },
        {
          route: 'akun',
          label: 'Akun Saya',
          icon: UserCog
        }
      ]
    }
  ];

  const handleNavClick = (route: PageRoute) => {
    setCurrentRoute(route);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#091424] border-r border-slate-200 dark:border-[#162740] transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isCollapsed ? 'w-[76px]' : 'w-[280px]'
        } ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        {/* Top Logo Section */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-[#132238]">
          <div
            onClick={() => handleNavClick(user.role === 'MUSYRIF' ? 'data-santri' : 'dashboard')}
            className={`flex items-center gap-3 cursor-pointer group ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <MosqueLogoIcon className="w-10 h-10 group-hover:scale-105 transition-transform shrink-0" />

            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-slate-900 dark:text-white tracking-wider">
                    SIMKA<span className="text-emerald-500 dark:text-emerald-400">.ID</span>
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                  Karakter &amp; Akhlak Santri
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#13223B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card in Sidebar */}
        {!isCollapsed && (
          <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-[#1A2D48]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                {user.unit === 'ALL' ? 'Semua Unit' : `Unit ${user.unit}`}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                {user.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user.nama}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email || `@${user.username}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-4 overflow-y-auto py-2">
          {navSections.map((section) => {
            const accessibleItems = section.items.filter((item) =>
              canRoleAccessRoute(user.role, item.route)
            );

            if (accessibleItems.length === 0) return null;

            return (
              <div key={section.groupTitle} className="space-y-1">
                {!isCollapsed ? (
                  <p className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {section.groupTitle}
                  </p>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-[#162740] my-2" />
                )}

                {accessibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.route;

                  return (
                    <button
                      key={item.route}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => handleNavClick(item.route)}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3.5 py-2.5'
                      } rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-[#11243E] text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-500/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#0E1A2D]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section - Collapse Toggle & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-[#162740] bg-slate-50/60 dark:bg-[#081221] space-y-1">
          <button
            onClick={() => {
              openDatabaseModal();
              onClose();
            }}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-3'
            } px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0E1A2D] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer`}
            title="Pengaturan Database Supabase"
          >
            <Database className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {!isCollapsed && <span>Database & Sinkronisasi</span>}
          </button>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex w-full items-center ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0E1A2D] transition-all cursor-pointer`}
              title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {!isCollapsed && <span>Ciutkan Menu</span>}
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-3'
            } px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 transition-all cursor-pointer`}
            title="Keluar Sistem"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
