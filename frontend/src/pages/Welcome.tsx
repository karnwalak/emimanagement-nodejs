import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-400 rounded-lg flex items-center justify-center font-bold">EM</div>
          <span className="text-lg font-semibold">EMI Management</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-indigo-200 hover:text-white text-sm">Sign In</Link>
              <Link to="/register" className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Manage Your EMIs<br />
          <span className="text-indigo-300">With Confidence</span>
        </h1>
        <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
          Track all your loans in one place. Never miss an EMI payment. Get reminders, analytics, and full control over your financial obligations.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors">
            Start Free →
          </Link>
          <Link to="/support" className="text-indigo-200 hover:text-white px-6 py-3 rounded-xl font-medium transition-colors border border-indigo-600 hover:border-indigo-400">
            Learn More
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Smart Calculations', desc: 'Auto-generates EMI schedules using tenure or fixed EMI amount with compound interest formulas.' },
            { title: 'Payment Tracking', desc: 'Mark EMIs as paid, skip months, and watch your loan progress in real-time.' },
            { title: 'Analytics Dashboard', desc: 'Visual charts for payment history, repayment progress, and portfolio distribution.' },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-indigo-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
