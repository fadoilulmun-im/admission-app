import useLocalStorage from './useLocalStorage';
import { LOCALSTORAGE_KEY } from '../constants';

/**
 * usePendaftar — hook utama untuk mengelola data pendaftar dari localStorage
 * Menyediakan: pendaftarList, tambahPendaftar, updateStatus, cariPendaftar
 */
const usePendaftar = () => {
  const [pendaftarList, setPendaftarList] = useLocalStorage(LOCALSTORAGE_KEY, []);

  const tambahPendaftar = (data) => {
    setPendaftarList((prev) => [...prev, data]);
  };

  const updateStatus = (nomorPendaftaran, statusBaru) => {
    setPendaftarList((prev) =>
      prev.map((p) =>
        p.nomorPendaftaran === nomorPendaftaran
          ? { ...p, status: statusBaru, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const cariPendaftar = (nomor) => {
    return pendaftarList.find((p) => p.nomorPendaftaran === nomor) || null;
  };

  return { pendaftarList, tambahPendaftar, updateStatus, cariPendaftar };
};

export default usePendaftar;
