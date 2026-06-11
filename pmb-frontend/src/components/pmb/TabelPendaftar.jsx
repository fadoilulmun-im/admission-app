import { useState, useMemo } from 'react';
import StatusBadge from './StatusBadge';
import { PRODI_LIST, JALUR_LIST, STATUS_LIST } from '../../constants';

/**
 * TabelPendaftar — tabel utama admin untuk melihat dan mengelola data pendaftar
 * Dilengkapi filter real-time berdasarkan nama/nomor, prodi, jalur, dan status
 * Props: pendaftarList (array), onUpdateStatus (fn) — wajib dari parent
 */
const TabelPendaftar = ({ pendaftarList = [], onUpdateStatus }) => {
  const [filterProdi, setFilterProdi] = useState('');
  const [filterJalur, setFilterJalur] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Filter real-time menggunakan useMemo agar tidak menghitung ulang setiap render
  const filteredList = useMemo(() => {
    return pendaftarList.filter((p) => {
      const matchProdi = !filterProdi || p.prodi === filterProdi;
      const matchJalur = !filterJalur || p.jalur === filterJalur;
      const matchStatus = !filterStatus || p.status === filterStatus;
      const matchSearch =
        !searchQuery ||
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nomor_pendaftaran.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProdi && matchJalur && matchStatus && matchSearch;
    });
  }, [pendaftarList, filterProdi, filterJalur, filterStatus, searchQuery]);

  const formatTanggal = (isoString) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const selectClass =
    'px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] bg-white';

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari nama atau nomor pendaftaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
          />
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Prodi</option>
            {PRODI_LIST.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filterJalur}
            onChange={(e) => setFilterJalur(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Jalur</option>
            {JALUR_LIST.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Status</option>
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Menampilkan{' '}
          <span className="font-semibold text-slate-700">{filteredList.length}</span> dari{' '}
          <span className="font-semibold text-slate-700">{pendaftarList.length}</span> pendaftar
        </p>
      </div>

      {/* Empty states */}
      {pendaftarList.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500 font-medium">Belum ada data pendaftar</p>
          <p className="text-slate-400 text-sm mt-1">
            Data akan muncul setelah calon mahasiswa mengisi formulir pendaftaran.
          </p>
        </div>
      )}

      {pendaftarList.length > 0 && filteredList.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          Tidak ada data yang sesuai dengan filter.
        </div>
      )}

      {/* Table */}
      {filteredList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    No. Pendaftaran
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Program Studi
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Jalur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Tgl Daftar
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ubah Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((pendaftar) => (
                  <tr
                    key={pendaftar.nomor_pendaftaran}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {pendaftar.nomor_pendaftaran}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{pendaftar.nama}</p>
                        <p className="text-xs text-slate-400">{pendaftar.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {pendaftar.prodi}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      {pendaftar.jalur}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {formatTanggal(pendaftar.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pendaftar.status} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pendaftar.status}
                        disabled={updatingId === pendaftar.id}
                        onChange={async (e) => {
                          setUpdatingId(pendaftar.id);
                          await onUpdateStatus?.(pendaftar.id, e.target.value);
                          setUpdatingId(null);
                        }}
                        className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer disabled:opacity-50"
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabelPendaftar;
