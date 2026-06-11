import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { PRODI_LIST, JALUR_LIST } from '../../constants';
import { pendaftarApi } from '../../utils/api';

/**
 * FormPendaftaran — Form utama untuk calon mahasiswa mendaftar PMB
 * Props: onSuccess (callback setelah submit berhasil, menerima object data pendaftar)
 */
const FormPendaftaran = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    nama: '',
    nomor_hp: '',
    email: '',
    asal_sekolah: '',
    prodi: '',
    jalur: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = (data) => {
    const errs = {};
    if (!data.nama || data.nama.trim().length < 3) {
      errs.nama = 'Nama minimal 3 karakter';
    }
    if (!/^\d{10,13}$/.test(data.nomor_hp)) {
      errs.nomor_hp = 'Nomor HP harus 10–13 digit angka';
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!data.asal_sekolah || data.asal_sekolah.trim().length < 3) {
      errs.asal_sekolah = 'Asal sekolah minimal 3 karakter';
    }
    if (!data.prodi) {
      errs.prodi = 'Pilih program studi';
    }
    if (!data.jalur) {
      errs.jalur = 'Pilih jalur pendaftaran';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Hapus error field yang sedang diubah
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    try {
      const res = await pendaftarApi.store({
        ...formData,
        nama: formData.nama.trim(),
        asal_sekolah: formData.asal_sekolah.trim(),
      });
      onSuccess?.(res.data);
    } catch (err) {
      // Tangani validation errors dari backend
      if (err.errors) {
        const backendErrs = {};
        Object.keys(err.errors).forEach((key) => {
          backendErrs[key] = err.errors[key][0];
        });
        setErrors(backendErrs);
      } else {
        setApiError(err.message || 'Gagal mengirim data. Coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nama Lengkap"
        name="nama"
        value={formData.nama}
        onChange={handleChange}
        error={errors.nama}
        placeholder="Masukkan nama lengkap"
        required
      />
      <Input
        label="Nomor HP / WhatsApp"
        name="nomor_hp"
        value={formData.nomor_hp}
        onChange={handleChange}
        error={errors.nomor_hp}
        placeholder="Contoh: 08123456789"
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="contoh@email.com"
        required
      />
      <Input
        label="Asal Sekolah"
        name="asal_sekolah"
        value={formData.asal_sekolah}
        onChange={handleChange}
        error={errors.asal_sekolah}
        placeholder="Nama sekolah asal"
        required
      />
      <Input
        label="Program Studi"
        name="prodi"
        as="select"
        value={formData.prodi}
        onChange={handleChange}
        error={errors.prodi}
        options={PRODI_LIST}
        required
      />
      <Input
        label="Jalur Pendaftaran"
        name="jalur"
        as="select"
        value={formData.jalur}
        onChange={handleChange}
        error={errors.jalur}
        options={JALUR_LIST}
        required
      />
      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
      </Button>
    </form>
  );
};

export default FormPendaftaran;
