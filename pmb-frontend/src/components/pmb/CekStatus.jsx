import { useState } from 'react';
import Button from '../ui/Button';
import StatusBadge from './StatusBadge';
import { pendaftarApi } from '../../utils/api';

/**
 * CekStatus — komponen untuk calon mahasiswa mengecek status pendaftaran
 * Jika status Lolos Seleksi, tampilkan tombol heregistrasi
 */
const CekStatus = () => {
  const [nomor, setNomor] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [heregLoading, setHeregLoading] = useState(false);
  const [heregSuccess, setHeregSuccess] = useState('');

  const handleCek = async (e) => {
    e.preventDefault();
    if (!nomor.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setHeregSuccess('');
    try {
      const res = await pendaftarApi.getByNomor(nomor.trim().toUpperCase());
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Nomor pendaftaran tidak ditemukan. Pastikan format benar (PMB-2025-XXXX).');
    } finally {
      setLoading(false);
    }
  };

  const handleHeregistrasi = async () => {
    setHeregLoading(true);
    try {
      const res = await pendaftarApi.heregistrasi(result.nomor_pendaftaran);
      setResult(res.data);
      setHeregSuccess(res.message);
    } catch (err) {
      setError(err.message || 'Gagal melakukan heregistrasi');
    } finally {
      setHeregLoading(false);
    }
  };

  const formatTanggal = (isoString) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Masukkan nomor pendaftaran yang Anda terima setelah mendaftar.
      </p>
      <form onSubmit={handleCek} className="flex gap-2">
        <input
          type="text"
          value={nomor}
          onChange={(e) => {
            setNomor(e.target.value);
            setError('');
            setResult(null);
          }}
          placeholder="Contoh: PMB-2025-1234"
          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] text-sm"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Mencari...' : 'Cek'}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{result.nama}</h3>
            <StatusBadge status={result.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Nomor Pendaftaran</p>
              <p className="font-mono font-semibold text-blue-600">{result.nomor_pendaftaran}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Program Studi</p>
              <p className="font-medium text-slate-800">{result.prodi}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Jalur</p>
              <p className="font-medium text-slate-800">{result.jalur}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Tanggal Daftar</p>
              <p className="font-medium text-slate-800">{formatTanggal(result.created_at)}</p>
            </div>
          </div>
          {result.status === 'Menunggu' && (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              Pendaftaran Anda sedang dalam proses seleksi. Pantau terus status di halaman ini.
            </p>
          )}
          {result.status === 'Lolos Seleksi' && !result.heregistrasi_at && !heregSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-green-700 font-medium">
                Selamat! Anda lolos seleksi. Lakukan heregistrasi untuk mengkonfirmasi kehadiran Anda.
              </p>
              <Button
                variant="success"
                disabled={heregLoading}
                onClick={handleHeregistrasi}
                className="w-full text-xs py-2"
              >
                {heregLoading ? 'Memproses...' : 'Lakukan Heregistrasi Sekarang'}
              </Button>
            </div>
          )}
          {(result.heregistrasi_at || heregSuccess) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-semibold">✓ Heregistrasi selesai</p>
              {result.heregistrasi_at && (
                <p className="text-xs text-green-600 mt-0.5">
                  {formatTanggal(result.heregistrasi_at)}
                </p>
              )}
              {heregSuccess && (
                <p className="text-xs text-green-700 mt-1">{heregSuccess}</p>
              )}
            </div>
          )}
          {result.status === 'Tidak Lolos' && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Maaf, Anda belum lolos seleksi periode ini. Terima kasih sudah mendaftar.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CekStatus;
