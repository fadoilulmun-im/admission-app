import { useState, useEffect } from 'react';
import AdminLogin from '../components/pmb/AdminLogin';
import TabelPendaftar from '../components/pmb/TabelPendaftar';
import { pendaftarApi, statistikApi, authApi, removeToken, getToken, getExportCsvUrl } from '../utils/api';
import { STATUS_LIST } from '../constants';

/**
 * Admin — halaman dashboard admin dengan gate login
 * Sesi tersimpan di sessionStorage (hilang saat tab/browser ditutup)
 */
const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendaftarList, setPendaftarList] = useState([]);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cek sesi yang sudah ada saat komponen dimuat
  useEffect(() => {
    const session = sessionStorage.getItem('pmb_admin_session');
    if (session === 'true' && getToken()) setIsLoggedIn(true);
  }, []);

  // Fetch data dan statistik dari API setelah login
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [pendaftarRes, statRes] = await Promise.all([
          pendaftarApi.getAll(),
          statistikApi.get(),
        ]);
        setPendaftarList(pendaftarRes.data);
        setStatistik(statRes.data);
      } catch (err) {
        if (err.status === 401) {
          handleLogout();
        } else {
          setError(err.message || 'Gagal memuat data. Coba lagi.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* abaikan error */ }
    removeToken();
    sessionStorage.removeItem('pmb_admin_session');
    setIsLoggedIn(false);
    setPendaftarList([]);
    setStatistik(null);
  };

  // Ubah status via API dan update state lokal
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await pendaftarApi.updateStatus(id, status);
      const updated = res.data;
      setPendaftarList((prev) => prev.map((p) => (p.id === id ? updated : p)));
      // Refresh statistik
      const statRes = await statistikApi.get();
      setStatistik(statRes.data);
    } catch (err) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const handleExportCsv = () => {
    const token = getToken();
    // Buat link sementara dengan header auth via blob
    fetch(getExportCsvUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pendaftar-pmb-2025.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Gagal mengunduh CSV'));
  };

  // Hitung statistik per status dari data lokal (sinkron dengan perubahan)
  const statsByStatus = STATUS_LIST.map((status) => ({
    label: status,
    count: pendaftarList.filter((p) => p.status === status).length,
    color:
      status === 'Lolos Seleksi'
        ? 'text-green-600'
        : status === 'Tidak Lolos'
        ? 'text-red-600'
        : 'text-yellow-600',
  }));

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base">Admin PMB 2025</h1>
              <p className="text-xs text-slate-400">Panel Pengelolaan Pendaftar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <a
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors hidden sm:block"
            >
              ← Publik
            </a>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stat cards — status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Total Pendaftar</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{pendaftarList.length}</p>
          </div>
          {statsByStatus.map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 truncate">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Statistik per prodi dan jalur */}
        {statistik && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Per prodi */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Pendaftar per Prodi</h3>
              <div className="space-y-2">
                {statistik.per_prodi.map((item) => {
                  const pct = statistik.total > 0 ? Math.round((item.total / statistik.total) * 100) : 0;
                  return (
                    <div key={item.prodi}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span className="truncate">{item.prodi}</span>
                        <span className="font-semibold ml-2">{item.total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-1.5 bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Per jalur */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Pendaftar per Jalur</h3>
              <div className="space-y-2">
                {statistik.per_jalur.map((item) => {
                  const pct = statistik.total > 0 ? Math.round((item.total / statistik.total) * 100) : 0;
                  return (
                    <div key={item.jalur}>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{item.jalur}</span>
                        <span className="font-semibold">{item.total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-1.5 bg-amber-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Table section */}
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">Data Pendaftar</h2>
          {loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              Memuat data...
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && (
            <TabelPendaftar pendaftarList={pendaftarList} onUpdateStatus={handleUpdateStatus} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
