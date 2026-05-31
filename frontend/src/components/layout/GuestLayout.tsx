import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            EM
          </div>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">EMI Management</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-xl">{children}</div>
      </div>
    </div>
  );
}
