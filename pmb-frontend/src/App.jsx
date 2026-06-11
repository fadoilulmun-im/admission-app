import Home from './pages/Home';
import Admin from './pages/Admin';

/**
 * App — root component yang menangani routing sederhana via window.location.pathname
 * /       → Home (halaman publik)
 * /admin  → Admin (dashboard admin, butuh login)
 */
const App = () => {
  const path = window.location.pathname;

  if (path === '/admin' || path === '/admin/') {
    return <Admin />;
  }

  return <Home />;
};

export default App;
