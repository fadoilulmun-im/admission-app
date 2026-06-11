import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { authApi, setToken } from '../../utils/api';

/**
 * AdminLogin — form login admin menggunakan Sanctum API
 * Token disimpan di sessionStorage setelah login berhasil
 * Props: onLogin (callback setelah login berhasil)
 */
const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login(credentials.username, credentials.password);
      setToken(res.data.token);
      sessionStorage.setItem('pmb_admin_session', 'true');
      onLogin?.();
    } catch (err) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Admin PMB</h1>
          <p className="text-sm text-slate-500 mt-1">Masuk ke panel admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Masukkan username"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Masukkan password"
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
            {isLoading ? 'Memverifikasi...' : 'Masuk'}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-4">
          <a href="/" className="hover:text-slate-600 transition-colors">
            ← Kembali ke halaman publik
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
