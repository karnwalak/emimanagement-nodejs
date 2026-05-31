import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${color}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AuthenticatedLayout title="Dashboard">
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!stats) return null;

  const repaymentData = {
    labels: ['Paid EMIs', 'Pending EMIs'],
    datasets: [{
      data: [stats.paid_emi, stats.pending_emi],
      backgroundColor: ['#10b981', '#f59e0b'],
      borderWidth: 0,
    }],
  };

  const monthlyLabels = Object.keys(stats.monthly_chart);
  const monthlyValues = Object.values(stats.monthly_chart);
  const monthlyData = {
    labels: monthlyLabels,
    datasets: [{
      label: 'Amount Paid (₹)',
      data: monthlyValues,
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }],
  };

  return (
    <AuthenticatedLayout title="Dashboard">
      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Principal" value={fmt(stats.total_amount)} color="border-indigo-500" />
        <StatCard label="Amount Paid" value={fmt(stats.paid_amount)} color="border-green-500" />
        <StatCard label="Outstanding" value={fmt(stats.remaining_amount)} color="border-orange-500" />
      </div>

      {/* Loan stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Loans" value={stats.total_loan} color="border-gray-400" />
        <StatCard label="Open Loans" value={stats.total_open_loan} color="border-blue-400" />
        <StatCard label="Closed Loans" value={stats.total_closed_loan} color="border-green-400" />
        <StatCard label="Overdue Loans" value={stats.total_overdue_loan} color="border-red-400" />
      </div>

      {/* EMI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total EMIs" value={stats.total_emi} color="border-gray-400" />
        <StatCard label="Paid EMIs" value={stats.paid_emi} color="border-green-400" />
        <StatCard label="Pending EMIs" value={stats.pending_emi} color="border-yellow-400" />
        <StatCard label="Overdue EMIs" value={stats.overdue_emi} color="border-red-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Repayment Progress</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={repaymentData} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Monthly Payment History</h3>
          {monthlyLabels.length > 0 ? (
            <Bar
              data={monthlyData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: (v) => `₹${Number(v).toLocaleString('en-IN')}` } } },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400">No payment history yet.</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link to="/loans/create" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          + Add Loan
        </Link>
        <Link to="/loans" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          View All Loans
        </Link>
      </div>
    </AuthenticatedLayout>
  );
}
