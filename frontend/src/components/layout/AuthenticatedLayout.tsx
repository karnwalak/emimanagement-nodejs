import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGaugeHigh, faFileInvoiceDollar, faUser, faRightFromBracket, faBars, faXmark,
} from '@fortawesome/free-solid-svg-icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: faGaugeHigh },
  { to: '/loans', label: 'Loans', icon: faFileInvoiceDollar },
  { to: '/profile', label: 'Profile', icon: faUser },
];

export default function AuthenticatedLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-indigo-900 text-white transform transition-transform duration-200 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-700">
          <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold text-sm">EM</div>
          <span className="font-semibold text-lg">EMI Management</span>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="mt-4 px-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.to)
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors w-full"
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button className="lg:hidden text-gray-500" onClick={() => setMobileOpen(true)}>
            <FontAwesomeIcon icon={faBars} size="lg" />
          </button>
          {title && <h1 className="text-lg font-semibold text-gray-800">{title}</h1>}
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
