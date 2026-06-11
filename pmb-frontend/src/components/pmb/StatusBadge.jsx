/**
 * StatusBadge — badge warna untuk menampilkan status pendaftar
 * Props: status (string)
 */
const STATUS_COLORS = {
  Menunggu: 'bg-yellow-100 text-yellow-800',
  'Lolos Seleksi': 'bg-green-100 text-green-800',
  'Tidak Lolos': 'bg-red-100 text-red-800',
};

const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
