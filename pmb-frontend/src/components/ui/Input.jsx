/**
 * Input — komponen input form generik dengan dukungan text input dan select
 * Props: label, name, value, onChange, error, type, placeholder, required, as, options
 */
const Input = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder = '',
  required = false,
  as = 'input',
  options = [],
}) => {
  const inputClass = `w-full px-3 py-2.5 border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] ${
    error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {as === 'select' ? (
        <select id={name} name={name} value={value} onChange={onChange} className={inputClass}>
          <option value="">-- Pilih --</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
