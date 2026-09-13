import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  PageRoute, 
  Santri, 
  Pelanggaran, 
  PelanggaranKategori,
  RiwayatPelanggaran, 
  UserAccount, 
  MasterPembinaan,
  PembinaanRecord,
  UnitPesantren,
  UnitFilter,
  UserRole
} from '../types';
import { 
  initialUsers, 
  initialPelanggaranList, 
  initialSantriList, 
  initialRiwayatPelanggaran,
  initialMasterPembinaanList,
  initialPembinaanRecords
} from '../data/mockData';
import { 
  fetchMasterPembinaanFromDB, 
  findPembinaanBySinglePoin,
  authenticateUser,
  fetchMasterPelanggaranFromDB,
  insertMasterPelanggaranToDB,
  updateMasterPelanggaranInDB,
  deleteMasterPelanggaranFromDB,
  deleteAllMasterPelanggaranFromDB,
  importMasterPelanggaranBatchToDB,
  deleteSantriFromDB
} from '../lib/supabase';
import { 
  canRoleAccessRoute, 
  getDefaultRouteForRole, 
  getRoleDisplayName,
  getUnitDisplayName,
  hashPassword,
  hashPasswordSync 
} from '../lib/auth';
import { getKategoriFromPoin } from '../components/common/PointBadge';

export interface ToastInfo {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  timestamp: string;
  timeFormatted: string;
  type: 'pelanggaran' | 'pembinaan' | 'santri' | 'user';
  unit: UnitPesantren;
}

interface AppContextType {
  currentRoute: PageRoute;
  setCurrentRoute: (route: PageRoute) => void;
  user: UserAccount | null;
  isAuthenticated: boolean;
  usersList: UserAccount[];
  selectedKasieUnitFilter: UnitFilter;
  setSelectedKasieUnitFilter: (filter: UnitFilter) => void;
  // Scoped lists based on active user and selected unit filter
  santriList: Santri[];
  allSantriList: Santri[];
  pelanggaranList: Pelanggaran[];
  masterPembinaanList: MasterPembinaan[];
  riwayatList: RiwayatPelanggaran[];
  allRiwayatList: RiwayatPelanggaran[];
  pembinaanList: PembinaanRecord[];
  allPembinaanList: PembinaanRecord[];
  selectedSantriForDetail: Santri | null;
  setSelectedSantriForDetail: (santri: Santri | null) => void;
  // Auth & Session
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  // Rekap Pelanggaran Record Management
  deleteRiwayatPelanggaran: (id: string) => { success: boolean; message: string };
  // Master Pelanggaran Management (Kasie Superadmin)
  addPelanggaran: (data: {
    kode?: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
  }) => { success: boolean; message?: string };
  updatePelanggaran: (
    id: string,
    data: {
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
    }
  ) => { success: boolean; message?: string };
  deletePelanggaran: (id: string) => Promise<{ success: boolean; message?: string }>;
  deleteAllMasterPelanggaran: (onlyUnused?: boolean) => Promise<{
    success: boolean;
    deletedCount: number;
    remainingCount: number;
    message: string;
  }>;
  checkMasterPelanggaranUsage: (masterId?: string) => {
    isUsed: boolean;
    count: number;
    totalMasterCount: number;
    usedCount: number;
    unusedCount: number;
    totalTransactionsCount: number;
    affectedTransactionsCount: number;
    usedIds: string[];
    unusedIds: string[];
  };
  importPelanggaranBatch: (
    items: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori?: string;
    }>
  ) => { success: boolean; insertedCount: number; message: string };
  // User Management (Kasie/Kabid Superadmin)
  addUser: (data: {
    id?: string;
    nama: string;
    username: string;
    password: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    email?: string;
    title?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  editUser: (
    id: string,
    data: {
      nama: string;
      username: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
      is_active?: boolean;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  importUsersBatch: (
    usersData: Array<{
      id?: string;
      nama: string;
      username: string;
      password: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
    }>
  ) => Promise<{ success: boolean; insertedCount: number; message: string }>;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  toggleUserActive: (userId: string) => void;
  // Santri Management
  addSantri: (data: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifId?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
  }) => { success: boolean; message?: string };
  updateSantri: (
    id: string,
    data: {
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      asrama?: string;
      kamar?: string;
      keterangan?: string;
      statusPembinaan?: Santri['statusPembinaan'];
    }
  ) => { success: boolean; message?: string };
  deleteSantri: (
    id: string,
    options?: { deleteViolations?: boolean }
  ) => Promise<{ success: boolean; message?: string; violationCount?: number }>;
  importSantriBatch: (
    santriDataList: Array<{
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      musyrifNama?: string;
      asrama?: string;
      kamar?: string;
      statusPembinaan?: Santri['statusPembinaan'];
      keterangan?: string;
    }>
  ) => { success: boolean; insertedCount: number; message: string };
  // Pembinaan Management
  addPembinaan: (data: {
    santriId: string;
    jenisPembinaan: string;
    catatan: string;
    pembina?: string;
    tanggalTargetSelesai?: string;
  }) => { success: boolean; message?: string };
  updatePembinaanStatus: (
    id: string,
    status: 'BELUM DIMULAI' | 'PROSES' | 'SELESAI',
    catatan?: string,
    tanggalSelesai?: string
  ) => { success: boolean; message?: string };
  deletePembinaan: (id: string) => { success: boolean; message?: string };
  // Notifications
  toasts: ToastInfo[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  // Core Business Logic
  getPembinaanBySinglePoin: (poin: number) => MasterPembinaan | null;
  catatPelanggaranBaru: (data: {
    santriId: string;
    pelanggaranId: string;
    catatan?: string;
  }) => boolean;
  toggleStatusPelanggaran: (id: string) => void;
  updateUserPassword: (oldPass: string, newPass: string, confirmPass: string) => Promise<{ success: boolean; message: string }>;
  // Dynamic Scoped Dashboard Statistics
  stats: {
    pelanggaranHariIni: number;
    totalSantri: number;
    belumSelesai: number;
    terseelesaikan: number;
  };
  getMonthlyData: () => { bulan: string; jumlah: number }[];
  getDonutData: () => { name: string; value: number; color: string }[];
  getTop5Santri: () => Santri[];
  getTopPelanggaran: () => Array<{ id: string; nama: string; kategori: string; count: number; totalPoin: number }>;
  getRecentPembinaan: () => PembinaanRecord[];
  getRecentActivities: () => ActivityItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. User & Session State (Persistent across reload or session storage)
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const savedSession = localStorage.getItem('simka_session') || sessionStorage.getItem('simka_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id && parsed.username && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved session:', e);
    }
    return null;
  });

  const isAuthenticated = Boolean(user);

  // Current Route: if not logged in, enforce login page
  const [currentRoute, setCurrentRouteState] = useState<PageRoute>(() => {
    try {
      const savedSession = localStorage.getItem('simka_session') || sessionStorage.getItem('simka_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.role) {
          return getDefaultRouteForRole(parsed.role);
        }
      }
    } catch (e) {
      // fallback
    }
    return 'login';
  });

  // Safe route navigator that checks role authorization
  const setCurrentRoute = (route: PageRoute) => {
    if (!user && route !== 'login') {
      setCurrentRouteState('login');
      return;
    }
    if (user && !canRoleAccessRoute(user.role, route)) {
      showToast('Akses Ditolak', `Role ${user.role} tidak memiliki hak akses ke halaman tersebut.`, 'warning');
      return;
    }
    setCurrentRouteState(route);
  };

  // Unit filter for Superadmin (Kasie/Kabid)
  const [selectedKasieUnitFilter, setSelectedKasieUnitFilter] = useState<UnitFilter>('ALL');

  // Users database
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('simka_users');
      return saved ? JSON.parse(saved) : initialUsers;
    } catch (e) {
      return initialUsers;
    }
  });

  // Master Pelanggaran & Master Pembinaan
  const [pelanggaranList, setPelanggaranList] = useState<Pelanggaran[]>(() => {
    try {
      const saved = localStorage.getItem('simka_master_pelanggaran');
      if (saved) {
        const parsed: Pelanggaran[] = JSON.parse(saved);
        return parsed.map((p) => ({
          ...p,
          kategori: getKategoriFromPoin(p.poin).kategori
        }));
      }
      return initialPelanggaranList.map((p) => ({
        ...p,
        kategori: getKategoriFromPoin(p.poin).kategori
      }));
    } catch (e) {
      return initialPelanggaranList.map((p) => ({
        ...p,
        kategori: getKategoriFromPoin(p.poin).kategori
      }));
    }
  });

  const [masterPembinaanList, setMasterPembinaanList] = useState<MasterPembinaan[]>(() => {
    try {
      const saved = localStorage.getItem('simka_master_pembinaan');
      return saved ? JSON.parse(saved) : initialMasterPembinaanList;
    } catch (e) {
      return initialMasterPembinaanList;
    }
  });

  // Santri & Riwayat Dataset
  const [allSantriList, setAllSantriList] = useState<Santri[]>(() => {
    try {
      const saved = localStorage.getItem('simka_santri');
      return saved ? JSON.parse(saved) : initialSantriList;
    } catch (e) {
      return initialSantriList;
    }
  });

  const [allRiwayatList, setAllRiwayatList] = useState<RiwayatPelanggaran[]>(() => {
    try {
      const saved = localStorage.getItem('simka_riwayat');
      return saved ? JSON.parse(saved) : initialRiwayatPelanggaran;
    } catch (e) {
      return initialRiwayatPelanggaran;
    }
  });

  const [allPembinaanList, setAllPembinaanList] = useState<PembinaanRecord[]>(() => {
    try {
      const saved = localStorage.getItem('simka_pembinaan_records');
      return saved ? JSON.parse(saved) : initialPembinaanRecords;
    } catch (e) {
      return initialPembinaanRecords;
    }
  });

  const [selectedSantriForDetail, setSelectedSantriForDetail] = useState<Santri | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Sync users to storage
  useEffect(() => {
    localStorage.setItem('simka_users', JSON.stringify(usersList));
  }, [usersList]);

  // Sync pelanggaran to storage
  useEffect(() => {
    localStorage.setItem('simka_master_pelanggaran', JSON.stringify(pelanggaranList));
  }, [pelanggaranList]);

  // Sync santri to storage
  useEffect(() => {
    localStorage.setItem('simka_santri', JSON.stringify(allSantriList));
  }, [allSantriList]);

  // Sync riwayat to storage
  useEffect(() => {
    localStorage.setItem('simka_riwayat', JSON.stringify(allRiwayatList));
  }, [allRiwayatList]);

  // Sync pembinaan to storage
  useEffect(() => {
    localStorage.setItem('simka_pembinaan_records', JSON.stringify(allPembinaanList));
  }, [allPembinaanList]);

  // Fetch Supabase master pembinaan & master pelanggaran on mount if available
  useEffect(() => {
    let isMounted = true;
    fetchMasterPembinaanFromDB().then((data) => {
      if (isMounted && data && data.length > 0) {
        setMasterPembinaanList(data);
        localStorage.setItem('simka_master_pembinaan', JSON.stringify(data));
      }
    });

    fetchMasterPelanggaranFromDB().then((data) => {
      if (isMounted && data && data.length > 0) {
        setPelanggaranList(data);
        localStorage.setItem('simka_master_pelanggaran', JSON.stringify(data));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // DATA ISOLATION LOGIC (CRITICAL MANDATE)
  // --------------------------------------------------------------------------
  // User Unit isolation:
  // - MUSYRIF / KOORDINATOR: strictly locked to user.unit (SMP only sees SMP, MA only sees MA, SMA only sees SMA)
  // - KASIE / KABID: global access with dynamic unit filter selector (ALL / SMP / MA / SMA)
  const activeUnitScope = useMemo((): UnitFilter => {
    if (!user) return 'ALL';
    if (user.role === 'KASIE_KEPESANTRENAN') {
      return selectedKasieUnitFilter;
    }
    return user.unit as UnitPesantren;
  }, [user, selectedKasieUnitFilter]);

  // Scoped Santri
  const santriList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allSantriList;
      return allSantriList.filter((s) => s.unit === selectedKasieUnitFilter);
    }
    // Strict isolation for Musyrif & Koordinator
    return allSantriList.filter((s) => s.unit === user.unit);
  }, [user, selectedKasieUnitFilter, allSantriList]);

  // Scoped Riwayat
  const riwayatList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allRiwayatList;
      return allRiwayatList.filter((r) => r.santriUnit === selectedKasieUnitFilter);
    }
    // Strict isolation for Musyrif & Koordinator
    return allRiwayatList.filter((r) => r.santriUnit === user.unit);
  }, [user, selectedKasieUnitFilter, allRiwayatList]);

  // Scoped Pembinaan
  const pembinaanList = useMemo(() => {
    if (!user) return [];
    if (user.role === 'KASIE_KEPESANTRENAN') {
      if (selectedKasieUnitFilter === 'ALL') return allPembinaanList;
      return allPembinaanList.filter((p) => p.santriUnit === selectedKasieUnitFilter);
    }
    return allPembinaanList.filter((p) => p.santriUnit === user.unit);
  }, [user, selectedKasieUnitFilter, allPembinaanList]);

  // Toast Helper
  const showToast = (title: string, message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // --------------------------------------------------------------------------
  const login = async (
    usernameInput: string,
    passwordInput: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; message?: string }> => {
    const result = await authenticateUser(usernameInput, passwordInput, usersList);
    if (result.success && result.user) {
      setUser(result.user);
      if (rememberMe) {
        localStorage.setItem('simka_session', JSON.stringify(result.user));
        sessionStorage.removeItem('simka_session');
      } else {
        sessionStorage.setItem('simka_session', JSON.stringify(result.user));
        localStorage.removeItem('simka_session');
      }
      const targetRoute = getDefaultRouteForRole(result.user.role);
      setCurrentRouteState(targetRoute);
      showToast(
        'Login Berhasil',
        `Selamat datang, ${result.user.nama} (${getRoleDisplayName(result.user.role)} - ${getUnitDisplayName(result.user.unit)}).`,
        'success'
      );
      return { success: true };
    }
    return { success: false, message: result.message || 'Kombinasi username atau password salah.' };
  };

  const logout = () => {
    localStorage.removeItem('simka_session');
    sessionStorage.removeItem('simka_session');
    setUser(null);
    setCurrentRouteState('login');
    showToast('Sesi Berakhir', 'Anda telah keluar dari sistem SIMKA.ID dengan aman.', 'info');
  };

  // --------------------------------------------------------------------------
  // MASTER PELANGGARAN MANAGEMENT (KASIE / KABID SUPERADMIN ONLY)
  // --------------------------------------------------------------------------
  const addPelanggaran = (data: {
    kode?: string;
    jenis: string;
    poin: number;
    konsekuensi: string;
  }): { success: boolean; message?: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang menambah Master Pelanggaran.' };
    }

    const cleanJenis = data.jenis.trim();
    if (!cleanJenis) {
      return { success: false, message: 'Item Pelanggaran wajib diisi!' };
    }

    const cleanPoin = Number(data.poin);
    if (isNaN(cleanPoin) || cleanPoin < 1) {
      return { success: false, message: 'Poin pelanggaran harus berupa angka positif!' };
    }

    // Check duplicate
    const isDuplicate = pelanggaranList.some(
      (p) => p.jenis.trim().toLowerCase() === cleanJenis.toLowerCase()
    );
    if (isDuplicate) {
      return { success: false, message: `Item pelanggaran "${cleanJenis}" sudah terdaftar di sistem.` };
    }

    const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;
    const nextKode = data.kode?.trim() || `P${String(pelanggaranList.length + 1).padStart(3, '0')}`;
    const newPelanggaran: Pelanggaran = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kode: nextKode,
      jenis: cleanJenis,
      poin: cleanPoin,
      kategori: calculatedKategori,
      konsekuensi: data.konsekuensi?.trim() || '-'
    };

    // Optimistically update state
    setPelanggaranList((prev) => [newPelanggaran, ...prev]);

    // Async sync to Supabase
    insertMasterPelanggaranToDB(
      {
        kode: newPelanggaran.kode,
        jenis: newPelanggaran.jenis,
        poin: newPelanggaran.poin,
        kategori: newPelanggaran.kategori,
        konsekuensi: newPelanggaran.konsekuensi
      },
      user.role
    ).then((res) => {
      if (res.success && res.data) {
        // Update item with the real Supabase generated database UUID
        setPelanggaranList((prev) =>
          prev.map((p) => (p.id === newPelanggaran.id ? res.data! : p))
        );
      }
    });

    showToast(
      'Pelanggaran Ditambahkan',
      `Item "${newPelanggaran.jenis}" (${newPelanggaran.poin} Poin - ${newPelanggaran.kategori}) berhasil ditambahkan.`,
      'success'
    );
    return { success: true };
  };

  const updatePelanggaran = (
    id: string,
    data: {
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
    }
  ): { success: boolean; message?: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mengubah Master Pelanggaran.' };
    }

    const existing = pelanggaranList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Item Pelanggaran tidak ditemukan.' };
    }

    const cleanJenis = data.jenis.trim();
    const cleanPoin = Number(data.poin);
    if (!cleanJenis || isNaN(cleanPoin) || cleanPoin < 1) {
      return { success: false, message: 'Item Pelanggaran dan Poin (angka > 0) wajib diisi!' };
    }

    const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;
    const updatedRecord: Pelanggaran = {
      ...existing,
      kode: data.kode?.trim() || existing.kode,
      jenis: cleanJenis,
      poin: cleanPoin,
      kategori: calculatedKategori,
      konsekuensi: data.konsekuensi !== undefined ? data.konsekuensi.trim() : existing.konsekuensi
    };

    // Update state locally
    setPelanggaranList((prev) => prev.map((p) => (p.id === id ? updatedRecord : p)));

    // Sync update to Supabase using the database UUID
    updateMasterPelanggaranInDB(
      id,
      {
        kode: updatedRecord.kode,
        jenis: updatedRecord.jenis,
        poin: updatedRecord.poin,
        kategori: updatedRecord.kategori,
        konsekuensi: updatedRecord.konsekuensi
      },
      user.role
    );

    showToast('Pelanggaran Diperbarui', `Item "${cleanJenis}" berhasil diperbarui.`, 'success');
    return { success: true };
  };

  /**
   * Check if master pelanggaran is currently referenced by any student violation history
   */
  const checkMasterPelanggaranUsage = (masterId?: string) => {
    if (masterId) {
      const target = pelanggaranList.find((p) => p.id === masterId);
      const usageCount = allRiwayatList.filter((r) => {
        return (
          r.jenisPelanggaranId === masterId ||
          (target && r.jenisPelanggaranNama.toLowerCase() === target.jenis.toLowerCase())
        );
      }).length;

      return {
        isUsed: usageCount > 0,
        count: usageCount,
        totalMasterCount: pelanggaranList.length,
        usedCount: usageCount > 0 ? 1 : 0,
        unusedCount: usageCount > 0 ? 0 : 1,
        totalTransactionsCount: allRiwayatList.length,
        affectedTransactionsCount: usageCount,
        usedIds: usageCount > 0 ? [masterId] : [],
        unusedIds: usageCount === 0 ? [masterId] : []
      };
    }

    // Global check across all master items
    const usedIdsSet = new Set<string>();
    let totalMatchedTransactions = 0;

    for (const r of allRiwayatList) {
      const matched = pelanggaranList.find(
        (p) => p.id === r.jenisPelanggaranId || p.jenis.toLowerCase() === r.jenisPelanggaranNama.toLowerCase()
      );
      if (matched) {
        usedIdsSet.add(matched.id);
        totalMatchedTransactions++;
      }
    }

    const usedIds = Array.from(usedIdsSet);
    const unusedIds = pelanggaranList.filter((p) => !usedIdsSet.has(p.id)).map((p) => p.id);

    return {
      isUsed: usedIds.length > 0,
      count: totalMatchedTransactions,
      totalMasterCount: pelanggaranList.length,
      usedCount: usedIds.length,
      unusedCount: unusedIds.length,
      totalTransactionsCount: allRiwayatList.length,
      affectedTransactionsCount: totalMatchedTransactions,
      usedIds,
      unusedIds
    };
  };

  /**
   * Individual delete for master pelanggaran record with Supabase persistence and reference protection.
   * Strictly uses the record's database UUID for deletion queries.
   */
  const deletePelanggaran = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang menghapus Master Pelanggaran.' };
    }

    const existing = pelanggaranList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Item Pelanggaran tidak ditemukan.' };
    }

    // Debug logging
    console.log('[DELETE MASTER]', {
      databaseId: existing.id,
      kode: existing.kode,
      nama: existing.jenis
    });

    // Check if referenced in transactions
    const usage = checkMasterPelanggaranUsage(id);
    if (usage.isUsed) {
      return {
        success: false,
        message: `Item "${existing.jenis}" tidak dapat dihapus karena tercatat dalam ${usage.count} riwayat pelanggaran santri.`
      };
    }

    // Perform database deletion from Supabase using real database UUID
    const dbResult = await deleteMasterPelanggaranFromDB(existing, user.role);
    if (!dbResult.success) {
      return { success: false, message: dbResult.error || 'Gagal menghapus data dari Supabase.' };
    }

    // Update local state and storage
    const updated = pelanggaranList.filter((p) => p.id !== id);
    setPelanggaranList(updated);
    localStorage.setItem('simka_master_pelanggaran', JSON.stringify(updated));

    showToast('Data Pelanggaran Dihapus', `Data pelanggaran "${existing.jenis}" berhasil dihapus.`, 'success');
    return { success: true, message: 'Data pelanggaran berhasil dihapus.' };
  };

  /**
   * Bulk deletion / Reset master pelanggaran with multi-layer confirmation and safe transaction protection
   */
  const deleteAllMasterPelanggaran = async (
    onlyUnused = false
  ): Promise<{
    success: boolean;
    deletedCount: number;
    remainingCount: number;
    message: string;
  }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: pelanggaranList.length,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mereset Master Pelanggaran.'
      };
    }

    if (pelanggaranList.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        remainingCount: 0,
        message: 'Master Pelanggaran sudah dalam keadaan kosong.'
      };
    }

    const usageStats = checkMasterPelanggaranUsage();

    if (usageStats.unusedCount === 0 && pelanggaranList.length > 0) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: `Tidak dapat menghapus master karena seluruh data (${usageStats.usedCount} item) sedang digunakan dalam ${usageStats.affectedTransactionsCount} riwayat pelanggaran santri.`
      };
    }

    if (usageStats.usedCount > 0 && !onlyUnused) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: `${usageStats.unusedCount} master dapat dihapus. ${usageStats.usedCount} master sedang digunakan oleh data transaksi dan tidak dapat dihapus.`
      };
    }

    const idsToDelete = usageStats.unusedIds;
    if (idsToDelete.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        remainingCount: usageStats.usedCount,
        message: 'Tidak ada master pelanggaran yang bebas transaksi untuk dihapus.'
      };
    }

    const recordsToDelete = pelanggaranList.filter((p) => idsToDelete.includes(p.id));

    // Call Supabase batch deletion with record objects
    const dbResult = await deleteAllMasterPelanggaranFromDB(recordsToDelete, user.role);
    if (!dbResult.success) {
      return {
        success: false,
        deletedCount: 0,
        remainingCount: pelanggaranList.length,
        message: dbResult.error || 'Gagal menghapus data master dari database Supabase.'
      };
    }

    // Update state and persistence
    const updated = pelanggaranList.filter((p) => !idsToDelete.includes(p.id));
    setPelanggaranList(updated);
    localStorage.setItem('simka_master_pelanggaran', JSON.stringify(updated));

    const isTotalReset = updated.length === 0;
    const msg = isTotalReset
      ? 'Semua master pelanggaran berhasil dihapus.'
      : `${idsToDelete.length} master pelanggaran yang tidak digunakan berhasil dihapus. ${updated.length} master tetap disimpan.`;

    showToast('Master Pelanggaran Dihapus', msg, 'success');

    return {
      success: true,
      deletedCount: idsToDelete.length,
      remainingCount: updated.length,
      message: msg
    };
  };

  const importPelanggaranBatch = (
    items: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori?: string;
    }>
  ): { success: boolean; insertedCount: number; message: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, insertedCount: 0, message: 'Hanya Kasie Kepesantrenan yang berwenang melakukan import Master Pelanggaran.' };
    }

    if (items.length === 0) {
      return { success: false, insertedCount: 0, message: 'Tidak ada data valid yang dapat diimport.' };
    }

    const existingJenisSet = new Set(
      pelanggaranList.map((p) => p.jenis.trim().toLowerCase().replace(/\s+/g, ' '))
    );

    const validNewItems: Array<{
      kode?: string;
      jenis: string;
      poin: number;
      konsekuensi: string;
      kategori: PelanggaranKategori;
    }> = [];

    for (const item of items) {
      const cleanJenis = item.jenis.trim();
      const normKey = cleanJenis.toLowerCase().replace(/\s+/g, ' ');
      if (!cleanJenis || existingJenisSet.has(normKey)) {
        continue;
      }
      existingJenisSet.add(normKey);

      const cleanPoin = Number(item.poin) || 15;
      const calculatedKategori = getKategoriFromPoin(cleanPoin).kategori;

      validNewItems.push({
        kode: item.kode?.trim() || undefined,
        jenis: cleanJenis,
        poin: cleanPoin,
        kategori: calculatedKategori,
        konsekuensi: item.konsekuensi?.trim() || '-'
      });
    }

    if (validNewItems.length === 0) {
      return { success: false, insertedCount: 0, message: 'Semua item pelanggaran dalam file sudah ada di database.' };
    }

    // Sync to Supabase in batch and obtain real database UUIDs
    importMasterPelanggaranBatchToDB(validNewItems, user.role).then((dbRes) => {
      if (dbRes.success && dbRes.insertedData && dbRes.insertedData.length > 0) {
        setPelanggaranList((prev) => {
          // Replace or merge with the database UUID version
          const nonImported = prev.filter((p) => !validNewItems.some((v) => v.jenis.toLowerCase() === p.jenis.toLowerCase()));
          return [...nonImported, ...dbRes.insertedData!];
        });
      }
    });

    // Optimistic entries for instantaneous UI response
    const optimisticEntries: Pelanggaran[] = validNewItems.map((v, idx) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${idx}`,
      kode: v.kode || `P${String(pelanggaranList.length + idx + 1).padStart(3, '0')}`,
      jenis: v.jenis,
      poin: v.poin,
      kategori: v.kategori,
      konsekuensi: v.konsekuensi
    }));

    setPelanggaranList((prev) => [...prev, ...optimisticEntries]);
    showToast(
      'Import Pelanggaran Berhasil',
      `Sebanyak ${validNewItems.length} item pelanggaran baru berhasil ditambahkan ke master database.`,
      'success'
    );
    return {
      success: true,
      insertedCount: validNewItems.length,
      message: `${validNewItems.length} data pelanggaran berhasil diimport.`
    };
  };

  // --------------------------------------------------------------------------
  // USER MANAGEMENT (KASIE / KABID ONLY)
  // --------------------------------------------------------------------------
  const addUser = async (data: {
    id?: string;
    nama: string;
    username: string;
    password: string;
    role: UserRole;
    unit: 'ALL' | UnitPesantren;
    email?: string;
    title?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan / Superadmin yang berwenang menambah user.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername || !data.password || !data.nama) {
      return { success: false, message: 'Nama, username, dan password wajib diisi!' };
    }

    // Check existing username
    const exists = usersList.some((u) => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan oleh user lain.` };
    }

    const password_hash = await hashPassword(data.password);
    const assignedId = data.id?.trim() || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const assignedUnit = data.role === 'KASIE_KEPESANTRENAN' ? 'ALL' : data.unit;

    const newUser: UserAccount = {
      id: assignedId,
      nama: data.nama.trim(),
      username: cleanUsername,
      role: data.role,
      unit: assignedUnit,
      is_active: true,
      email: data.email?.trim() || `${cleanUsername}@simka.id`,
      title: data.title?.trim() || `${data.role} ${assignedUnit}`,
      password_hash,
      created_at: new Date().toISOString()
    };

    setUsersList((prev) => [newUser, ...prev]);
    showToast('User Ditambahkan!', `Pengguna ${newUser.nama} (@${newUser.username}) siap login langsung.`, 'success');
    return { success: true };
  };

  const editUser = async (
    id: string,
    data: {
      nama: string;
      username: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mengubah profil user.' };
    }

    const existing = usersList.find((u) => u.id === id);
    if (!existing) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername || !data.nama.trim()) {
      return { success: false, message: 'Nama dan username wajib diisi!' };
    }

    // Check username conflict with others
    const usernameTaken = usersList.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername);
    if (usernameTaken) {
      return { success: false, message: `Username "@${cleanUsername}" sudah digunakan pengguna lain.` };
    }

    const assignedUnit = data.role === 'KASIE_KEPESANTRENAN' ? 'ALL' : data.unit;

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return {
            ...u,
            nama: data.nama.trim(),
            username: cleanUsername,
            email: data.email?.trim() || `${cleanUsername}@simka.id`,
            role: data.role,
            unit: assignedUnit,
            is_active: data.is_active !== undefined ? data.is_active : u.is_active,
            title: `${data.role} ${assignedUnit}`
          };
        }
        return u;
      })
    );

    showToast('Profil User Diperbarui', `Data akun ${data.nama} berhasil disimpan.`, 'success');
    return { success: true };
  };

  const resetUserPassword = async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang mereset password.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password baru minimal 6 karakter!' };
    }

    const existing = usersList.find((u) => u.id === userId);
    if (!existing) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    const newHash = await hashPassword(newPassword);

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            password_hash: newHash
          };
        }
        return u;
      })
    );

    showToast('Password Berhasil Direset', `Password baru untuk @${existing.username} telah tersimpan aman.`, 'success');
    return { success: true };
  };

  const importUsersBatch = async (
    usersData: Array<{
      id?: string;
      nama: string;
      username: string;
      password: string;
      email?: string;
      role: UserRole;
      unit: 'ALL' | UnitPesantren;
    }>
  ): Promise<{ success: boolean; insertedCount: number; message: string }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, insertedCount: 0, message: 'Hanya Kasie Kepesantrenan yang berwenang mengimport data pengguna.' };
    }

    if (usersData.length === 0) {
      return { success: false, insertedCount: 0, message: 'Tidak ada data pengguna valid yang dapat diimport.' };
    }

    const existingUsernameSet = new Set(usersList.map((u) => u.username.toLowerCase().trim()));
    const newAccounts: UserAccount[] = [];

    for (const item of usersData) {
      const cleanUsername = item.username.toLowerCase().trim();
      if (!cleanUsername || existingUsernameSet.has(cleanUsername)) {
        continue;
      }
      existingUsernameSet.add(cleanUsername);

      const password_hash = await hashPassword(item.password || 'simka123');
      const assignedUnit = item.role === 'KASIE_KEPESANTRENAN' ? 'ALL' : item.unit;
      const assignedId = item.id?.trim() || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      newAccounts.push({
        id: assignedId,
        nama: item.nama.trim(),
        username: cleanUsername,
        role: item.role,
        unit: assignedUnit,
        is_active: true,
        email: item.email?.trim() || `${cleanUsername}@simka.id`,
        title: `${item.role} ${assignedUnit}`,
        password_hash,
        created_at: new Date().toISOString()
      });
    }

    if (newAccounts.length === 0) {
      return { success: false, insertedCount: 0, message: 'Semua akun pengguna di file sudah terdaftar (duplikat username).' };
    }

    setUsersList((prev) => [...newAccounts, ...prev]);
    showToast(
      'Import Pengguna Berhasil',
      `Sebanyak ${newAccounts.length} akun pengguna baru berhasil ditambahkan dan dapat login langsung.`,
      'success'
    );
    return {
      success: true,
      insertedCount: newAccounts.length,
      message: `${newAccounts.length} pengguna berhasil diimport.`
    };
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return { success: false, message: 'Hanya Kasie Kepesantrenan yang berwenang menghapus pengguna.' };
    }
    if (userId === user.id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!' };
    }

    const existing = usersList.find((u) => u.id === userId);
    if (!existing) {
      return { success: false, message: 'Pengguna tidak ditemukan.' };
    }

    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    showToast('Pengguna Dihapus', `Akun @${existing.username} (${existing.nama}) telah dihapus.`, 'info');
    return { success: true };
  };

  const toggleUserActive = (userId: string) => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      showToast('Akses Ditolak', 'Hanya Kasie Kepesantrenan yang dapat mengubah status user.', 'error');
      return;
    }
    if (userId === user.id) {
      showToast('Peringatan', 'Anda tidak dapat menonaktifkan akun sendiri yang sedang aktif.', 'warning');
      return;
    }

    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedStatus = !u.is_active;
          showToast('Status Pengguna Diperbarui', `Akun ${u.nama} ${updatedStatus ? 'diaktifkan' : 'dinonaktifkan'}.`, 'info');
          return { ...u, is_active: updatedStatus };
        }
        return u;
      })
    );
  };

  // --------------------------------------------------------------------------
  // SANTRI MANAGEMENT
  // --------------------------------------------------------------------------
  const addSantri = (data: {
    nis: string;
    nama: string;
    kelas: string;
    unit: UnitPesantren;
    musyrifId?: string;
    asrama?: string;
    kamar?: string;
    keterangan?: string;
  }): { success: boolean; message?: string } => {
    if (!user) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    // Role check: Musyrif & Koordinator can only add santri to their OWN unit
    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== data.unit) {
      return { success: false, message: `Akses Ditolak: Anda (${user.unit}) tidak diizinkan menambah santri Unit ${data.unit}!` };
    }

    if (!data.nis || !data.nama || !data.kelas || !data.unit) {
      return { success: false, message: 'NIS, Nama, Kelas, dan Unit wajib diisi!' };
    }

    // Lookup Musyrif Name
    let musyrifNama: string | undefined;
    if (data.musyrifId) {
      const musy = usersList.find((u) => u.id === data.musyrifId);
      musyrifNama = musy ? musy.nama : undefined;
    }

    const newSantri: Santri = {
      id: `s-${data.unit.toLowerCase()}-${Date.now()}`,
      nis: data.nis.trim(),
      nama: data.nama.trim().toUpperCase(),
      kelas: data.kelas.trim(),
      unit: data.unit,
      totalPoin: 0,
      statusPembinaan: 'Baik',
      musyrifId: data.musyrifId,
      musyrifNama,
      asrama: data.asrama?.trim() || `Asrama ${data.unit}`,
      kamar: data.kamar?.trim() || '-',
      keterangan: data.keterangan?.trim()
    };

    setAllSantriList((prev) => [newSantri, ...prev]);
    showToast('Santri Berhasil Ditambahkan', `Santri ${newSantri.nama} (${newSantri.unit}) telah terdaftar.`, 'success');
    return { success: true };
  };

  const updateSantri = (
    id: string,
    data: {
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      asrama?: string;
      kamar?: string;
      keterangan?: string;
      statusPembinaan?: Santri['statusPembinaan'];
    }
  ): { success: boolean; message?: string } => {
    if (!user) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    const existing = allSantriList.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Data santri tidak ditemukan.' };
    }

    // Role check: Musyrif & Koordinator can only edit their own unit
    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== existing.unit) {
      return { success: false, message: `Akses Ditolak: Anda (${user.unit}) tidak diizinkan mengubah santri Unit ${existing.unit}!` };
    }

    // Lookup Musyrif Name
    let musyrifNama = existing.musyrifNama;
    if (data.musyrifId !== undefined) {
      if (data.musyrifId) {
        const musy = usersList.find((u) => u.id === data.musyrifId);
        musyrifNama = musy ? musy.nama : undefined;
      } else {
        musyrifNama = undefined;
      }
    }

    setAllSantriList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            nis: data.nis.trim(),
            nama: data.nama.trim().toUpperCase(),
            kelas: data.kelas.trim(),
            unit: data.unit,
            musyrifId: data.musyrifId,
            musyrifNama,
            asrama: data.asrama !== undefined ? data.asrama.trim() : s.asrama,
            kamar: data.kamar !== undefined ? data.kamar.trim() : s.kamar,
            keterangan: data.keterangan !== undefined ? data.keterangan.trim() : s.keterangan,
            statusPembinaan: data.statusPembinaan || s.statusPembinaan
          };
        }
        return s;
      })
    );

    showToast('Santri Berhasil Diperbarui', `Data santri ${data.nama.toUpperCase()} berhasil disimpan.`, 'success');
    return { success: true };
  };

  const deleteSantri = async (
    id: string,
    options?: { deleteViolations?: boolean }
  ): Promise<{ success: boolean; message?: string; violationCount?: number }> => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang menghapus data santri.'
      };
    }

    const existing = allSantriList.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Data santri tidak ditemukan.' };
    }

    // Calculate local related violation count
    const relatedViolations = allRiwayatList.filter(
      (r) =>
        r.santriId === id ||
        (r.santriNama && r.santriNama.toLowerCase() === existing.nama.toLowerCase() && r.santriUnit === existing.unit)
    );
    const violationCount = relatedViolations.length;

    // If santri has violations and user did not confirm deleting them, warn first
    if (violationCount > 0 && !options?.deleteViolations) {
      return {
        success: false,
        violationCount,
        message: `Santri ${existing.nama} tidak dapat dihapus karena masih memiliki ${violationCount} data pelanggaran.`
      };
    }

    // Database deletion (Order: 1. public.pelanggaran -> 2. public.santri)
    const dbResult = await deleteSantriFromDB(
      existing,
      { deleteViolations: options?.deleteViolations },
      user.role,
      user.unit
    );

    if (!dbResult.success) {
      return {
        success: false,
        violationCount,
        message: dbResult.error || 'Gagal menghapus data santri dari database.'
      };
    }

    // State & Storage Synchronization
    // 1. Clean up child transaction records from local state
    if (violationCount > 0 || options?.deleteViolations) {
      setAllRiwayatList((prev) =>
        prev.filter(
          (r) =>
            r.santriId !== id &&
            !(r.santriNama && r.santriNama.toLowerCase() === existing.nama.toLowerCase() && r.santriUnit === existing.unit)
        )
      );

      // Clean up any pembinaan records for this santri
      setAllPembinaanList((prev) =>
        prev.filter(
          (p) =>
            p.santriId !== id &&
            !(p.santriNama && p.santriNama.toLowerCase() === existing.nama.toLowerCase() && p.santriUnit === existing.unit)
        )
      );
    }

    // 2. Remove Santri from list
    setAllSantriList((prev) => prev.filter((s) => s.id !== id));

    // 3. Clear selected detail modal if currently open for this santri
    if (selectedSantriForDetail?.id === id) {
      setSelectedSantriForDetail(null);
    }

    if (violationCount > 0) {
      showToast(
        'Data Santri & Pelanggaran Dihapus',
        `Data santri ${existing.nama} beserta ${violationCount} data pelanggaran contoh berhasil dibersihkan.`,
        'info'
      );
    } else {
      showToast(
        'Santri Berhasil Dihapus',
        `Data santri ${existing.nama} telah dihapus dari sistem.`,
        'info'
      );
    }

    return { success: true, message: 'Data santri berhasil dihapus.' };
  };

  const importSantriBatch = (
    santriDataList: Array<{
      nis: string;
      nama: string;
      kelas: string;
      unit: UnitPesantren;
      musyrifId?: string;
      musyrifNama?: string;
      asrama?: string;
      kamar?: string;
      statusPembinaan?: Santri['statusPembinaan'];
      keterangan?: string;
    }>
  ): { success: boolean; insertedCount: number; message: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      return {
        success: false,
        insertedCount: 0,
        message: 'Akses Ditolak: Hanya Kasie Kepesantrenan yang berwenang mengimpor data santri.'
      };
    }

    if (santriDataList.length === 0) {
      return { success: false, insertedCount: 0, message: 'Tidak ada data valid yang dapat diimport.' };
    }

    const existingNisSet = new Set(allSantriList.map((s) => s.nis.toLowerCase().trim()));
    const newSantriEntries: Santri[] = [];

    for (const item of santriDataList) {
      const cleanNis = item.nis.trim();
      if (!cleanNis || existingNisSet.has(cleanNis.toLowerCase())) {
        continue;
      }
      existingNisSet.add(cleanNis.toLowerCase());

      // Resolve musyrif nama if needed
      let finalMusyrifNama = item.musyrifNama;
      if (!finalMusyrifNama && item.musyrifId) {
        const musy = usersList.find((u) => u.id === item.musyrifId);
        finalMusyrifNama = musy ? musy.nama : undefined;
      }

      newSantriEntries.push({
        id: `s-${item.unit.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nis: cleanNis,
        nama: item.nama.trim().toUpperCase(),
        kelas: item.kelas.trim(),
        unit: item.unit,
        totalPoin: 0,
        statusPembinaan: item.statusPembinaan || 'Baik',
        musyrifId: item.musyrifId,
        musyrifNama: finalMusyrifNama,
        asrama: item.asrama?.trim() || `Asrama ${item.unit}`,
        kamar: item.kamar?.trim() || '-',
        keterangan: item.keterangan?.trim()
      });
    }

    if (newSantriEntries.length === 0) {
      return { success: false, insertedCount: 0, message: 'Semua data di dalam file sudah ada (duplikat NIS) di sistem.' };
    }

    // Insert new data (preserves all existing MA and other santri records)
    setAllSantriList((prev) => [...newSantriEntries, ...prev]);
    showToast(
      'Import Excel Berhasil',
      `Sebanyak ${newSantriEntries.length} santri baru berhasil ditambahkan ke database.`,
      'success'
    );
    return {
      success: true,
      insertedCount: newSantriEntries.length,
      message: `${newSantriEntries.length} data santri berhasil diimport.`
    };
  };

  // --------------------------------------------------------------------------
  // REKOMENDASI PEMBINAAN & PENCATATAN PELANGGARAN
  // --------------------------------------------------------------------------
  const getPembinaanBySinglePoin = (poin: number): MasterPembinaan | null => {
    return findPembinaanBySinglePoin(poin, masterPembinaanList);
  };

  const catatPelanggaranBaru = (data: {
    santriId: string;
    pelanggaranId: string;
    catatan?: string;
  }): boolean => {
    if (!user) {
      showToast('Gagal Mencatat', 'Sesi login tidak valid. Silakan login kembali.', 'error');
      return false;
    }

    const targetSantri = allSantriList.find((s) => s.id === data.santriId);
    const targetPelanggaran = pelanggaranList.find((p) => p.id === data.pelanggaranId);

    if (!targetSantri || !targetPelanggaran) {
      showToast('Gagal Mencatat', 'Data santri atau jenis pelanggaran tidak valid.', 'error');
      return false;
    }

    // STRICT UNIT ISOLATION CHECK: Reject if actor is not Kasie and units don't match
    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== targetSantri.unit) {
      showToast(
        'Akses Ditolak!',
        `Keamanan Database: Anda (${user.unit}) tidak diizinkan mencatat pelanggaran santri Unit ${targetSantri.unit}!`,
        'error'
      );
      return false;
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const formattedTanggal = `${day} ${month} ${year}, ${hours}.${mins} WIB`;

    // 8-Level coaching recommendation based on SINGLE POINT
    const singlePoin = targetPelanggaran.poin;
    const rekomendasi = getPembinaanBySinglePoin(singlePoin);

    const newRecord: RiwayatPelanggaran = {
      id: `log-${Date.now()}`,
      tanggal: formattedTanggal,
      timestamp: now.toISOString(),
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriKelas: targetSantri.kelas,
      santriUnit: targetSantri.unit,
      jenisPelanggaranId: targetPelanggaran.id,
      jenisPelanggaranNama: targetPelanggaran.jenis,
      poin: targetPelanggaran.poin,
      hukuman: targetPelanggaran.konsekuensi,
      pembinaanTingkat: rekomendasi ? rekomendasi.nama_tingkat : undefined,
      rekomendasiPembinaan: rekomendasi ? rekomendasi.jenis_pembinaan : undefined,
      status: targetPelanggaran.poin >= 50 ? 'Belum Selesai' : 'Selesai',
      catatan: data.catatan || 'Tercatat melalui sistem SIMKA.ID',
      pencatat: user.nama,
      pencatatId: user.id
    };

    // Prepend to all riwayat
    setAllRiwayatList((prev) => [newRecord, ...prev]);

    // Update Santri total point & aggregate status
    setAllSantriList((prev) =>
      prev.map((s) => {
        if (s.id === targetSantri.id) {
          const newPoin = s.totalPoin + targetPelanggaran.poin;
          let newStatus: Santri['statusPembinaan'] = s.statusPembinaan;
          if (newPoin >= 100) newStatus = 'SP 3';
          else if (newPoin >= 70) newStatus = 'SP 2';
          else if (newPoin >= 40) newStatus = 'SP 1';
          else if (newPoin > 0) newStatus = 'Peringatan Lisan';
          return {
            ...s,
            totalPoin: newPoin,
            statusPembinaan: newStatus
          };
        }
        return s;
      })
    );

    showToast(
      'Pelanggaran Tercatat!',
      `Pelanggaran santri ${targetSantri.nama} (${targetPelanggaran.poin} poin tunggal - Unit ${targetSantri.unit}) berhasil disimpan.`,
      'success'
    );

    return true;
  };

  const toggleStatusPelanggaran = (id: string) => {
    setAllRiwayatList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStatus = item.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
          showToast(
            'Status Diperbarui',
            `Status hukuman diubah menjadi "${newStatus}".`,
            'info'
          );
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const deleteRiwayatPelanggaran = (id: string): { success: boolean; message: string } => {
    if (!user || user.role !== 'KASIE_KEPESANTRENAN') {
      showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk menghapus data pelanggaran.', 'error');
      return { success: false, message: 'Anda tidak memiliki izin untuk menghapus data pelanggaran.' };
    }

    const targetRecord = allRiwayatList.find((r) => r.id === id);
    if (!targetRecord) {
      showToast('Gagal Menghapus', 'Catatan pelanggaran tidak ditemukan.', 'error');
      return { success: false, message: 'Catatan pelanggaran tidak ditemukan.' };
    }

    // 1. Remove from all riwayat list
    setAllRiwayatList((prev) => prev.filter((r) => r.id !== id));

    // 2. Recalculate Santri's total point & status pembinaan
    setAllSantriList((prev) =>
      prev.map((s) => {
        if (s.id === targetRecord.santriId || s.nama === targetRecord.santriNama) {
          const newPoin = Math.max(0, s.totalPoin - targetRecord.poin);
          let newStatus: Santri['statusPembinaan'] = 'Baik';
          if (newPoin >= 100) newStatus = 'SP 3';
          else if (newPoin >= 70) newStatus = 'SP 2';
          else if (newPoin >= 40) newStatus = 'SP 1';
          else if (newPoin > 0) newStatus = 'Peringatan Lisan';
          return {
            ...s,
            totalPoin: newPoin,
            statusPembinaan: newStatus
          };
        }
        return s;
      })
    );

    showToast(
      'Pelanggaran Dihapus',
      `Catatan pelanggaran ${targetRecord.santriNama} (${targetRecord.jenisPelanggaranNama}) berhasil dihapus permanen. Poin santri telah disesuaikan.`,
      'success'
    );
    return { success: true, message: 'Catatan pelanggaran berhasil dihapus.' };
  };

  const updateUserPassword = async (oldPass: string, newPass: string, confirmPass: string): Promise<{ success: boolean; message: string }> => {
    if (!oldPass || !newPass || !confirmPass) {
      return { success: false, message: 'Semua field kata sandi wajib diisi!' };
    }
    if (newPass.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter!' };
    }
    if (newPass !== confirmPass) {
      return { success: false, message: 'Konfirmasi kata sandi baru tidak cocok!' };
    }

    if (user) {
      const newHash = await hashPassword(newPass);
      setUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, password_hash: newHash } : u))
      );
    }

    showToast('Berhasil', 'Kata sandi akun Anda berhasil diperbarui.', 'success');
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  };

  // --------------------------------------------------------------------------
  // PEMBINAAN MANAGEMENT
  // --------------------------------------------------------------------------
  const addPembinaan = (data: {
    santriId: string;
    jenisPembinaan: string;
    catatan: string;
    pembina?: string;
    tanggalTargetSelesai?: string;
  }): { success: boolean; message?: string } => {
    if (!user) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }

    const targetSantri = allSantriList.find((s) => s.id === data.santriId);
    if (!targetSantri) {
      return { success: false, message: 'Santri tidak ditemukan.' };
    }

    if (user.role !== 'KASIE_KEPESANTRENAN' && user.unit !== targetSantri.unit) {
      return { success: false, message: `Akses ditolak: Anda tidak diizinkan membuat pembinaan untuk Unit ${targetSantri.unit}.` };
    }

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const formattedTanggal = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    const newPembinaan: PembinaanRecord = {
      id: `pbn-${Date.now()}`,
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriKelas: targetSantri.kelas,
      santriUnit: targetSantri.unit,
      jenisPembinaan: data.jenisPembinaan,
      tanggal: formattedTanggal,
      tanggalTargetSelesai: data.tanggalTargetSelesai || '',
      pembina: data.pembina || user.nama,
      pembinaId: user.id,
      catatan: data.catatan,
      status: 'PROSES',
      created_at: now.toISOString()
    };

    setAllPembinaanList((prev) => [newPembinaan, ...prev]);
    showToast('Pembinaan Dibuat', `Tindakan pembinaan untuk ${targetSantri.nama} berhasil didaftarkan.`, 'success');
    return { success: true };
  };

  const updatePembinaanStatus = (
    id: string,
    status: 'BELUM DIMULAI' | 'PROSES' | 'SELESAI',
    catatan?: string,
    tanggalSelesai?: string
  ): { success: boolean; message?: string } => {
    const existing = allPembinaanList.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Data pembinaan tidak ditemukan.' };
    }

    setAllPembinaanList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const now = new Date();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const defaultTglSelesai = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
          return {
            ...p,
            status,
            catatan: catatan !== undefined ? catatan : p.catatan,
            tanggalSelesai: status === 'SELESAI' ? (tanggalSelesai || defaultTglSelesai) : undefined
          };
        }
        return p;
      })
    );

    showToast('Status Pembinaan Diperbarui', `Status diubah menjadi "${status}".`, 'info');
    return { success: true };
  };

  const deletePembinaan = (id: string): { success: boolean; message?: string } => {
    setAllPembinaanList((prev) => prev.filter((p) => p.id !== id));
    showToast('Pembinaan Dihapus', 'Data pembinaan telah dihapus.', 'info');
    return { success: true };
  };

  // --------------------------------------------------------------------------
  // SCOPED DASHBOARD STATISTICS & ANALYTICS
  // --------------------------------------------------------------------------
  const belumSelesai = riwayatList.filter((r) => r.status === 'Belum Selesai').length;
  const terseelesaikan = riwayatList.filter((r) => r.status === 'Selesai').length;
  const totalSantri = santriList.length;

  const stats = {
    pelanggaranHariIni: riwayatList.filter((r) => {
      const now = new Date();
      const rDate = new Date(r.timestamp);
      return !isNaN(rDate.getTime()) &&
        rDate.getDate() === now.getDate() &&
        rDate.getMonth() === now.getMonth() &&
        rDate.getFullYear() === now.getFullYear();
    }).length,
    totalSantri,
    belumSelesai,
    terseelesaikan
  };

  const getTopPelanggaran = () => {
    const map: Record<string, { id: string; nama: string; kategori: string; count: number; totalPoin: number }> = {};
    riwayatList.forEach((r) => {
      if (!map[r.jenisPelanggaranNama]) {
        const pObj = pelanggaranList.find((p) => p.id === r.jenisPelanggaranId);
        map[r.jenisPelanggaranNama] = {
          id: r.jenisPelanggaranId,
          nama: r.jenisPelanggaranNama,
          kategori: pObj ? pObj.kategori : 'Ringan',
          count: 0,
          totalPoin: 0
        };
      }
      map[r.jenisPelanggaranNama].count += 1;
      map[r.jenisPelanggaranNama].totalPoin += r.poin;
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getRecentPembinaan = (): PembinaanRecord[] => {
    return [...pembinaanList].slice(0, 5);
  };

  const getRecentActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add recent violations
    riwayatList.slice(0, 5).forEach((r) => {
      activities.push({
        id: `act-plg-${r.id}`,
        title: `Pelanggaran: ${r.santriNama}`,
        desc: `${r.jenisPelanggaranNama} (${r.poin} poin) - Dicatat oleh ${r.pencatat}`,
        timestamp: r.timestamp || new Date().toISOString(),
        timeFormatted: r.tanggal,
        type: 'pelanggaran',
        unit: r.santriUnit
      });
    });

    // Add recent coaching
    pembinaanList.slice(0, 5).forEach((p) => {
      activities.push({
        id: `act-pbn-${p.id}`,
        title: `Pembinaan: ${p.santriNama}`,
        desc: `${p.jenisPembinaan} (${p.status}) - Pembina: ${p.pembina}`,
        timestamp: p.created_at || new Date().toISOString(),
        timeFormatted: p.tanggal,
        type: 'pembinaan',
        unit: p.santriUnit
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const counts = months.map((m) => ({ bulan: m, jumlah: 0 }));

    riwayatList.forEach((r) => {
      const date = new Date(r.timestamp);
      if (!isNaN(date.getTime())) {
        const mIdx = date.getMonth();
        if (mIdx >= 0 && mIdx < 12) {
          counts[mIdx].jumlah += 1;
        }
      } else {
        months.forEach((mName, idx) => {
          if (r.tanggal.includes(mName)) {
            counts[idx].jumlah += 1;
          }
        });
      }
    });

    return counts;
  };

  const getDonutData = () => {
    if (user?.role === 'KASIE_KEPESANTRENAN' && selectedKasieUnitFilter === 'ALL') {
      let countSMP = 0;
      let countMA = 0;
      let countSMA = 0;

      riwayatList.forEach((r) => {
        if (r.santriUnit === 'SMP') countSMP++;
        else if (r.santriUnit === 'MA') countMA++;
        else if (r.santriUnit === 'SMA') countSMA++;
      });

      const total = countSMP + countMA + countSMA || 1;
      return [
        { name: 'Unit SMP', value: Math.round((countSMP / total) * 100) || 0, color: '#3B82F6' },
        { name: 'Unit MA', value: Math.round((countMA / total) * 100) || 0, color: '#10B981' },
        { name: 'Unit SMA', value: Math.round((countSMA / total) * 100) || 0, color: '#F97316' }
      ];
    }

    let groupA = 0;
    let groupB = 0;
    let groupC = 0;
    let labelA = 'Kelas 10';
    let labelB = 'Kelas 11';
    let labelC = 'Kelas 12';

    if (activeUnitScope === 'SMP') {
      labelA = 'Kelas 7';
      labelB = 'Kelas 8';
      labelC = 'Kelas 9';
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('7')) groupA++;
        else if (r.santriKelas.startsWith('8')) groupB++;
        else if (r.santriKelas.startsWith('9')) groupC++;
      });
    } else if (activeUnitScope === 'SMA') {
      labelA = 'Kelas X';
      labelB = 'Kelas XI';
      labelC = 'Kelas XII';
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('X') || r.santriKelas.startsWith('10')) groupA++;
        else if (r.santriKelas.startsWith('XI') || r.santriKelas.startsWith('11')) groupB++;
        else if (r.santriKelas.startsWith('XII') || r.santriKelas.startsWith('12')) groupC++;
      });
    } else {
      // MA
      riwayatList.forEach((r) => {
        if (r.santriKelas.startsWith('10')) groupA++;
        else if (r.santriKelas.startsWith('11')) groupB++;
        else if (r.santriKelas.startsWith('12')) groupC++;
      });
    }

    const total = groupA + groupB + groupC || 1;
    return [
      { name: labelA, value: Math.round((groupA / total) * 100) || 50, color: '#3B82F6' },
      { name: labelB, value: Math.round((groupB / total) * 100) || 25, color: '#F97316' },
      { name: labelC, value: Math.round((groupC / total) * 100) || 25, color: '#10B981' }
    ];
  };

  const getTop5Santri = (): Santri[] => {
    return [...santriList]
      .sort((a, b) => b.totalPoin - a.totalPoin)
      .slice(0, 5);
  };

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        user,
        isAuthenticated,
        usersList,
        selectedKasieUnitFilter,
        setSelectedKasieUnitFilter,
        santriList,
        allSantriList,
        pelanggaranList,
        masterPembinaanList,
        riwayatList,
        allRiwayatList,
        pembinaanList,
        allPembinaanList,
        selectedSantriForDetail,
        setSelectedSantriForDetail,
        login,
        logout,
        deleteRiwayatPelanggaran,
        addPelanggaran,
        updatePelanggaran,
        deletePelanggaran,
        deleteAllMasterPelanggaran,
        checkMasterPelanggaranUsage,
        importPelanggaranBatch,
        addUser,
        editUser,
        resetUserPassword,
        importUsersBatch,
        deleteUser,
        toggleUserActive,
        addSantri,
        updateSantri,
        deleteSantri,
        importSantriBatch,
        addPembinaan,
        updatePembinaanStatus,
        deletePembinaan,
        toasts,
        showToast,
        removeToast,
        getPembinaanBySinglePoin,
        catatPelanggaranBaru,
        toggleStatusPelanggaran,
        updateUserPassword,
        stats,
        getMonthlyData,
        getDonutData,
        getTop5Santri,
        getTopPelanggaran,
        getRecentPembinaan,
        getRecentActivities
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
