/**
 * generateNomorPendaftaran — generate nomor unik format PMB-2025-XXXX
 * @param {Array} existingList - array pendaftar yang sudah ada untuk cek duplikat
 * @returns {string} nomor pendaftaran yang dijamin unik
 */
export const generateNomorPendaftaran = (existingList = []) => {
  const existingNomors = new Set(existingList.map((p) => p.nomorPendaftaran));
  let nomor;
  let attempts = 0;
  do {
    const random = Math.floor(1000 + Math.random() * 9000);
    nomor = `PMB-2025-${random}`;
    attempts++;
  } while (existingNomors.has(nomor) && attempts < 100);
  return nomor;
};
