import { useState } from 'react';

/**
 * useLocalStorage — custom hook untuk membaca dan menyimpan data ke localStorage
 * @param {string} key - kunci localStorage
 * @param {any} initialValue - nilai awal jika data belum ada
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Gagal menyimpan ke localStorage:', error);
    }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
