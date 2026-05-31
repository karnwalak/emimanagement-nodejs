import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import { loansApi } from '../../services/api';
import { LoanDetail, PaginatedResponse } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare, faTrash, faLock, faPlus } from '@fortawesome/free-solid-svg-icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function LoanList() {
  const [result, setResult] = useState<PaginatedResponse<LoanDetail> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLoans = (p = page, s = status) => {
    setLoading(true);
    loansApi.list({ page: p, limit: 10, status: s || undefined })
      .then((res) => setResult(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(); }, [page, status]);

  const handleDelete = async (loan: LoanDetail) => {
    const result = await Swal.fire({
      title: 'Delete Loan?',
      text: `This will permanently delete the loan from ${loan.provider} and all its EMIs.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    await loansApi.delete(loan._id);
    fetchLoans();
    Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleForeclose = async (loan: LoanDetail) => {
    const result = await Swal.fire({
      title: 'Foreclose Loan?',
      text: 'All pending EMIs will be marked as paid and the loan will be closed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Yes, foreclose',
    });
    if (!result.isConfirmed) return;
    await loansApi.foreclose(loan._id);
    fetchLoans();
    Swal.fire({ title: 'Foreclosed!', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  return (
    <AuthenticatedLayout title="Loans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {['', 'open', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <Link to="/loans/create" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          <FontAwesomeIcon icon={faPlus} />
          Add Loan
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Provider', 'Amount', 'EMI', 'Progress', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result?.data.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No loans found. <Link to="/loans/create" className="text-indigo-600">Add one!</Link></td></tr>
              )}
              {result?.data.map((loan) => {
                const progress = loan.emiSummary
                  ? Math.round((loan.emiSummary.paid / (loan.emiSummary.total || 1)) * 100)
                  : 0;
                return (
                  <tr key={loan._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{loan.provider}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(loan.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(loan.emiAmount)}/mo</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8">{progress}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{loan.emiSummary?.paid}/{loan.emiSummary?.total} paid</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/loans/${loan._id}`} className="text-indigo-600 hover:text-indigo-800" title="View">
                          <FontAwesomeIcon icon={faEye} />
                        </Link>
                        <Link to={`/loans/${loan._id}/edit`} className="text-yellow-600 hover:text-yellow-800" title="Edit">
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </Link>
                        {loan.status === 'open' && (
                          <button onClick={() => handleForeclose(loan)} className="text-purple-600 hover:text-purple-800" title="Foreclose">
                            <FontAwesomeIcon icon={faLock} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(loan)} className="text-red-600 hover:text-red-800" title="Delete">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {result && result.lastPage > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {result.page} of {result.lastPage} ({result.total} loans)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === result.lastPage} className="px-3 py-1 rounded border text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </AuthenticatedLayout>
  );
}
