import { useEffect, useState, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import TextInput from '../../components/ui/TextInput';
import SelectInput from '../../components/ui/SelectInput';
import InputLabel from '../../components/ui/InputLabel';
import InputError from '../../components/ui/InputError';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import DangerButton from '../../components/ui/DangerButton';
import { loansApi, emisApi, documentsApi } from '../../services/api';
import { LoanDetail, EmiDetail, LoanDocument } from '../../types';

interface DocEntry { name: string; file: File }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function LoanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [emis, setEmis] = useState<EmiDetail[]>([]);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [newDocs, setNewDocs] = useState<DocEntry[]>([]);
  const [form, setForm] = useState<any>({});
  const [editedEmis, setEditedEmis] = useState<Record<string, { amount: string; dueDate: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emiSaving, setEmiSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = () => {
    loansApi.get(id!)
      .then((res) => {
        const d = res.data.data;
        setLoan(d.loan);
        setEmis(d.emis);
        setDocuments(d.documents);
        setForm({
          provider: d.loan.provider,
          amount: d.loan.amount.toString(),
          processingFee: d.loan.processingFee.toString(),
          interestRate: d.loan.interestRate.toString(),
          loanType: d.loan.loanType,
          tenure: d.loan.emiCount.toString(),
          emiAmount: d.loan.emiAmount.toString(),
          disbursedDate: format(new Date(d.loan.disbursedDate), 'yyyy-MM-dd'),
        });
        const map: Record<string, { amount: string; dueDate: string }> = {};
        d.emis.forEach((e: EmiDetail) => {
          map[e._id] = { amount: e.amount.toString(), dueDate: format(new Date(e.dueDate), 'yyyy-MM-dd') };
        });
        setEditedEmis(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const handleLoanUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      const payload: any = {
        provider: form.provider,
        amount: parseFloat(form.amount),
        processingFee: parseFloat(form.processingFee),
        interestRate: parseFloat(form.interestRate),
        loanType: form.loanType,
        disbursedDate: form.disbursedDate,
      };
      if (form.loanType === 'tenure') payload.tenure = parseInt(form.tenure);
      else payload.emiAmount = parseFloat(form.emiAmount);

      await loansApi.update(id!, payload);

      if (newDocs.length > 0) {
        const fd = new FormData();
        newDocs.forEach((d) => { fd.append('files', d.file); fd.append('names', d.name); });
        await documentsApi.upload(id!, fd);
      }

      Swal.fire({ icon: 'success', title: 'Loan updated!', timer: 1500, showConfirmButton: false });
      fetchData();
      setNewDocs([]);
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmiUpdate = async () => {
    setEmiSaving(true);
    try {
      const emiDetails = emis.map((emi) => ({
        id: emi._id,
        amount: parseFloat(editedEmis[emi._id]?.amount || emi.amount.toString()),
        dueDate: editedEmis[emi._id]?.dueDate || emi.dueDate,
      }));
      await emisApi.bulkUpdate({ loanDetailId: id!, emiDetails });
      Swal.fire({ icon: 'success', title: 'EMIs updated!', timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: err.response?.data?.message || 'EMI update failed.' });
    } finally {
      setEmiSaving(false);
    }
  };

  const deleteDoc = async (doc: LoanDocument) => {
    const res = await Swal.fire({ title: 'Delete document?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Delete' });
    if (!res.isConfirmed) return;
    await documentsApi.delete(doc._id);
    fetchData();
  };

  if (loading || !loan) return (
    <AuthenticatedLayout title="Edit Loan">
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AuthenticatedLayout>
  );

  return (
    <AuthenticatedLayout title={`Edit — ${loan.provider}`}>
      <div className="max-w-4xl space-y-6">
        {/* Loan details form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Loan Details</h3>
          {errors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{errors.general}</div>}
          <form onSubmit={handleLoanUpdate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><InputLabel required>Provider</InputLabel><TextInput value={form.provider || ''} onChange={set('provider')} required /></div>
              <div><InputLabel required>Amount (₹)</InputLabel><TextInput type="number" value={form.amount || ''} onChange={set('amount')} required /></div>
              <div><InputLabel required>Processing Fee (₹)</InputLabel><TextInput type="number" value={form.processingFee || ''} onChange={set('processingFee')} required /></div>
              <div><InputLabel required>Interest Rate (%)</InputLabel><TextInput type="number" value={form.interestRate || ''} onChange={set('interestRate')} step="0.01" required /></div>
              <div><InputLabel required>Disbursed Date</InputLabel><TextInput type="date" value={form.disbursedDate || ''} onChange={set('disbursedDate')} required /></div>
              <div><InputLabel required>Loan Type</InputLabel>
                <SelectInput value={form.loanType || 'tenure'} onChange={set('loanType')}>
                  <option value="tenure">Fixed Tenure</option>
                  <option value="emi_amount">Fixed EMI Amount</option>
                </SelectInput>
              </div>
              {form.loanType === 'tenure' ? (
                <div><InputLabel required>Tenure (months)</InputLabel><TextInput type="number" value={form.tenure || ''} onChange={set('tenure')} required /></div>
              ) : (
                <div><InputLabel required>EMI Amount (₹)</InputLabel><TextInput type="number" value={form.emiAmount || ''} onChange={set('emiAmount')} required /></div>
              )}
            </div>

            {/* New documents */}
            <div>
              <InputLabel>Attach More Documents</InputLabel>
              <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx" onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setNewDocs((d) => [...d, ...files.map((f) => ({ name: f.name, file: f }))]);
                if (fileRef.current) fileRef.current.value = '';
              }} className="hidden" />
              <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>+ Attach</SecondaryButton>
              {newDocs.map((d, i) => (
                <div key={i} className="flex items-center justify-between mt-2 p-2 bg-gray-50 rounded text-sm">
                  <span>{d.name}</span>
                  <button type="button" onClick={() => setNewDocs((ds) => ds.filter((_, idx) => idx !== i))} className="text-red-500">✕</button>
                </div>
              ))}
            </div>

            <PrimaryButton type="submit" loading={saving}>Save Loan Details</PrimaryButton>
          </form>
        </div>

        {/* EMI Schedule editor */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Edit EMI Schedule</h3>
            <PrimaryButton onClick={handleEmiUpdate} loading={emiSaving} className="text-xs py-1.5">Save EMIs</PrimaryButton>
          </div>
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emis.map((emi, i) => (
                <tr key={emi._id}>
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2">
                    <TextInput type="date" className="py-1 text-sm" value={editedEmis[emi._id]?.dueDate || ''} onChange={(e) => setEditedEmis((m) => ({ ...m, [emi._id]: { ...m[emi._id], dueDate: e.target.value } }))} />
                  </td>
                  <td className="px-4 py-2">
                    <TextInput type="number" className="py-1 text-sm w-32" value={editedEmis[emi._id]?.amount || ''} onChange={(e) => setEditedEmis((m) => ({ ...m, [emi._id]: { ...m[emi._id], amount: e.target.value } }))} />
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emi.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{emi.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Existing documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Existing Documents</h3>
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <a href={`/uploads/${doc.path}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{doc.document}</a>
                  <DangerButton onClick={() => deleteDoc(doc)} className="text-xs py-1 px-2">Delete</DangerButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
