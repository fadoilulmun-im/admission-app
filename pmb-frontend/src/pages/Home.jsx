import { useState } from 'react';
import FormPendaftaran from '../components/pmb/FormPendaftaran';
import CekStatus from '../components/pmb/CekStatus';

/**
 * Home — halaman utama publik dengan landing hero, form pendaftaran, dan cek status
 * Menggunakan tab untuk beralih antara form daftar dan cek status
 */
const Home = () => {
  const [activeTab, setActiveTab] = useState('daftar');
  const [successData, setSuccessData] = useState(null);

  const handleSuccess = (data) => {
    setSuccessData(data);
  };

  const handleDaftarLagi = () => {
    setSuccessData(null);
    setActiveTab('daftar');
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f4ff]">
      {/* Header */}
      <header className="bg-blue-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Sistem PMB</h1>
              <p className="text-xs text-blue-200">Penerimaan Mahasiswa Baru 2025</p>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs text-blue-200 hover:text-white transition-colors px-3 py-1.5 border border-white/20 rounded-lg hover:bg-white/10"
          >
            Panel Admin →
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-blue-700 text-white pb-14 pt-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Selamat Datang di PMB 2025
          </h2>
          <p className="text-blue-200 max-w-lg mx-auto text-sm sm:text-base">
            Daftarkan diri Anda dan mulai perjalanan akademik bersama kami. Proses cepat,
            mudah, dan bisa dilakukan kapan saja.
          </p>
        </div>
      </div>

      {/* Main card — overlapping hero */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-12">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => switchTab('daftar')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'daftar'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Daftar Sekarang
            </button>
            <button
              onClick={() => switchTab('cek')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === 'cek'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Cek Status
            </button>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* Form pendaftaran */}
            {activeTab === 'daftar' && !successData && (
              <FormPendaftaran onSuccess={handleSuccess} />
            )}

            {/* Sukses pendaftaran */}
            {activeTab === 'daftar' && successData && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Pendaftaran Berhasil!</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Simpan nomor pendaftaran Anda baik-baik
                  </p>
                </div>

                {/* Nomor pendaftaran highlight */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Nomor Pendaftaran</p>
                  <p className="text-2xl font-bold font-mono text-blue-600">
                    {successData.nomor_pendaftaran}
                  </p>
                </div>

                {/* Ringkasan data */}
                <div className="text-left bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  {[
                    { label: 'Nama', value: successData.nama },
                    { label: 'Program Studi', value: successData.prodi },
                    { label: 'Jalur', value: successData.jalur },
                    { label: 'Status', value: 'Menunggu', className: 'text-yellow-600 font-semibold' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-slate-500">{item.label}</span>
                      <span className={`font-medium text-slate-800 ${item.className || ''}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => switchTab('cek')}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                  >
                    Cek Status
                  </button>
                  <button
                    onClick={handleDaftarLagi}
                    className="flex-1 px-4 py-2.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors min-h-[44px]"
                  >
                    Daftar Lagi
                  </button>
                </div>
              </div>
            )}

            {/* Cek status */}
            {activeTab === 'cek' && <CekStatus />}
          </div>
        </div>

        {/* Info cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Program Studi', value: '4 Pilihan', icon: '🎓' },
            { label: 'Jalur Masuk', value: 'SNBT · Mandiri · Prestasi', icon: '📋' },
            { label: 'Pendaftaran', value: 'Online 24/7', icon: '🌐' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-slate-200 p-4 text-center"
            >
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
