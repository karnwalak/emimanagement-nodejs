import { useState, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import TextInput from '../../components/ui/TextInput';
import SelectInput from '../../components/ui/SelectInput';
import InputLabel from '../../components/ui/InputLabel';
import InputError from '../../components/ui/InputError';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { loansApi, documentsApi } from '../../services/api';
import { AxiosError } from 'axios';

interface DocEntry { name: string; file: File }

export default function LoanCreate() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    provider: '', amount: '', processingFee: '', interestRate: '',
    loanType: 'tenure', tenure: '', emiAmount: '', disbursedDate: '',
  });
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const addDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocs((d) => [...d, ...files.map((f) => ({ name: f.name, file: f }))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeDoc = (i: number) => setDocs((d) => d.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

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

      const res = await loansApi.create(payload);
      const loanId = res.data.data._id;

      // Upload documents if any
      if (docs.length > 0) {
        const fd = new FormData();
        docs.forEach((d, i) => {
          fd.append('files', d.file);
          fd.append('names', d.name);
        });
        await documentsApi.upload(loanId, fd);
      }

      navigate('/loans');
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      const data = axiosErr.response?.data;
      if (Array.isArray(data?.errors)) {
        const map: Record<string, string> = {};
        data.errors.forEach((e: string) => {
          if (e.toLowerCase().includes('provider')) map.provider = e;
          else if (e.toLowerCase().includes('amount')) map.amount = e;
          else if (e.toLowerCase().includes('interest')) map.interestRate = e;
          else if (e.toLowerCase().includes('tenure')) map.tenure = e;
          else map.general = e;
        });
        setErrors(map);
      } else {
        setErrors({ general: data?.message || 'Failed to create loan.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout title="Add New Loan">
      <div className="max-w-2xl">
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <InputLabel required>Loan Provider</InputLabel>
              <TextInput value={form.provider} onChange={set('provider')} placeholder="e.g. HDFC Bank" required />
              <InputError message={errors.provider} />
            </div>
            <div>
              <InputLabel required>Loan Amount (₹)</InputLabel>
              <TextInput type="number" value={form.amount} onChange={set('amount')} placeholder="500000" min="1" required />
              <InputError message={errors.amount} />
            </div>
            <div>
              <InputLabel required>Processing Fee (₹)</InputLabel>
              <TextInput type="number" value={form.processingFee} onChange={set('processingFee')} placeholder="5000" min="0" required />
            </div>
            <div>
              <InputLabel required>Interest Rate (% per annum)</InputLabel>
              <TextInput type="number" value={form.interestRate} onChange={set('interestRate')} placeholder="10.5" min="0" max="100" step="0.01" required />
              <InputError message={errors.interestRate} />
            </div>
            <div>
              <InputLabel required>Disbursed Date</InputLabel>
              <TextInput type="date" value={form.disbursedDate} onChange={set('disbursedDate')} required />
            </div>
            <div>
              <InputLabel required>Loan Type</InputLabel>
              <SelectInput value={form.loanType} onChange={set('loanType')}>
                <option value="tenure">Fixed Tenure (months)</option>
                <option value="emi_amount">Fixed EMI Amount</option>
              </SelectInput>
            </div>

            {form.loanType === 'tenure' ? (
              <div>
                <InputLabel required>Tenure (months)</InputLabel>
                <TextInput type="number" value={form.tenure} onChange={set('tenure')} placeholder="24" min="1" required />
                <InputError message={errors.tenure} />
              </div>
            ) : (
              <div>
                <InputLabel required>EMI Amount (₹)</InputLabel>
                <TextInput type="number" value={form.emiAmount} onChange={set('emiAmount')} placeholder="25000" min="1" required />
              </div>
            )}
          </div>

          {/* Document upload */}
          <div>
            <InputLabel>Documents (PDF, DOC, DOCX — max 2MB each)</InputLabel>
            <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx" onChange={addDoc} className="hidden" />
            <SecondaryButton type="button" onClick={() => fileRef.current?.click()}>
              + Attach Document
            </SecondaryButton>
            {docs.length > 0 && (
              <ul className="mt-3 space-y-2">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                    <span className="truncate">{d.name}</span>
                    <button type="button" onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-700 ml-2">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <PrimaryButton type="submit" loading={loading}>Create Loan</PrimaryButton>
            <SecondaryButton type="button" onClick={() => navigate('/loans')}>Cancel</SecondaryButton>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
