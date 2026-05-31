import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import { loansApi, emisApi, documentsApi } from '../../services/api';
import { LoanDetail, EmiDetail, LoanDocument } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function LoanShow() {
  const { id } = useParams<{ id: string }>();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [emis, setEmis] = useState<EmiDetail[]>([]);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    loansApi.get(id!)
      .then((res) => {
        const d = res.data.data;
        setLoan(d.loan);
        setEmis(d.emis);
        setDocuments(d.documents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [id]);

  const toggleEmiStatus = async (emi: EmiDetail) => {
    const newStatus = emi.status === 'paid' ? 'pending' : 'paid';
    await emisApi.markStatus({ id: emi._id, status: newStatus });
    fetch();
  };

  const skipEmi = async (emi: EmiDetail) => {
    const result = await Swal.fire({
      title: 'Skip this EMI?',
      text: 'This and all following EMIs will be pushed forward by 1 month.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, skip',
    });
    if (!result.isConfirmed) return;
    await emisApi.skip({ emiId: emi._id, loanId: id! });
    fetch();
  };

  const deleteDoc = async (doc: LoanDocument) => {
    const result = await Swal.fire({ title: 'Delete document?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete' });
    if (!result.isConfirmed) return;
    await documentsApi.delete(doc._id);
    fetch();
  };

  if (loading) return (
    <AuthenticatedLayout title="Loan Details">
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AuthenticatedLayout>
  );

  if (!loan) return <AuthenticatedLayout title="Loan Not Found"><p className="text-gray-500">Loan not found.</p></AuthenticatedLayout>;

  const paidCount = emis.filter((e) => e.status === 'paid').length;

  return (
    <AuthenticatedLayout title={`${loan.provider} — Loan Details`}>
      <div className="max-w-4xl space-y-6">
        {/* Loan summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{loan.provider}</h2>
            <div className="flex gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {loan.status}
              </span>
              <Link to={`/loans/${loan._id}/edit`} className="text-sm text-indigo-600 hover:underline">Edit</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Principal', fmt(loan.amount)],
              ['EMI', `${fmt(loan.emiAmount)}/mo`],
              ['Processing Fee', fmt(loan.processingFee)],
              ['Interest Rate', `${loan.interestRate}% p.a.`],
              ['Disbursed', format(new Date(loan.disbursedDate), 'dd MMM yyyy')],
              ['Total EMIs', loan.emiCount],
              ['Paid', paidCount],
              ['Remaining', loan.emiCount - paidCount],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EMI Schedule */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">EMI Schedule</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emis.map((emi, i) => (
                <tr key={emi._id} className={emi.status === 'paid' ? 'bg-green-50' : new Date(emi.dueDate) < new Date() ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">{format(new Date(emi.dueDate), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 font-medium">{fmt(emi.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emi.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {emi.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleEmiStatus(emi)} className={`text-xs font-medium ${emi.status === 'paid' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`} title={emi.status === 'paid' ? 'Mark Pending' : 'Mark Paid'}>
                        <FontAwesomeIcon icon={emi.status === 'paid' ? faRotateLeft : faCheck} />
                      </button>
                      {emi.status === 'pending' && (
                        <button onClick={() => skipEmi(emi)} className="text-xs text-indigo-600 hover:text-indigo-800" title="Skip EMI">Skip</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Documents</h3>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <a href={`/uploads/${doc.path}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                    {doc.document}
                  </a>
                  <button onClick={() => deleteDoc(doc)} className="text-red-500 hover:text-red-700">
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
