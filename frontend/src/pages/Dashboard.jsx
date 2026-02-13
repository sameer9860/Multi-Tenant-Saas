import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PaymentHistory from "../components/PaymentHistory";
import ReceiptModal from "../components/ReceiptModal";

const Dashboard = () => {
  const [stats, setStats] = useState({
    leads_count: 0,
    clients_count: 0,
    subscription_plan: "Loading...",
    organization_name: "Loading...",
  });
  const [usage, setUsage] = useState({
    leads: { used: 0, limit: 0 },
    clients: { used: 0, limit: 0 },
    invoices: { used: 0, limit: 0 },
  });
  const [profile, setProfile] = useState({
    email: "",
    full_name: "",
    role: "",
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for payment success parameter
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get("payment_success");
    const plan = urlParams.get("plan");

    if (paymentSuccess === "true" && plan) {
      setShowSuccessMessage(true);
      setSuccessPlan(plan);

      // Clean up URL parameters
      window.history.replaceState({}, document.title, "/dashboard");

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }

    fetchDashboardData();
    fetchProfileData();
    fetchPaymentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/accounts/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Fetching analytics data
      const response = await fetch("/api/analytics/usage/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          leads_count: data.leads_count || 0,
          clients_count: data.clients_count || 0,
          subscription_plan: data.plan || "N/A",
          organization_name: data.organization_name || "My Organization",
        });
        if (data.usage) {
          setUsage(data.usage);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  };

  const fetchPaymentHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingPayments(true);
      const response = await fetch("/api/billing/api/payments/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCloseReceipt = () => {
    setSelectedPayment(null);
  };

  const UsageBar = ({ label, used, limit, colorClass }) => {
    const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
    const isUnlimited = limit === null;

    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-sm font-black text-slate-900">
            {used} / {isUnlimited ? "∞" : limit}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        )}
        {isUnlimited && (
          <div className="w-full h-3 bg-indigo-50 rounded-full overflow-hidden">
            <div className="h-full w-full bg-indigo-600/20"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <div className="flex h-screen overflow-hidden">
        <div className="w-80 bg-white border-r border-slate-100 p-8 flex flex-col shadow-sm">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              SaaS CRM
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">
              Menu
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Overview
            </button>
            <button
              onClick={() => navigate("/dashboard/crm/leads")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Leads
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Subscription
            </button>
          </nav>

          <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
            <div className="px-4">
              <div className="text-sm font-black text-slate-900 truncate">
                {profile.full_name || "User"}
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {profile.role || "Staff"}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          {/* Success Message Banner */}
          {showSuccessMessage && (
            <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-black text-lg">Payment Successful!</div>
                  <div className="text-white/90 font-medium">
                    Your plan has been upgraded to {successPlan}
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="ml-4 text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-slate-500 font-medium">
                  Overview for{" "}
                  <span className="text-indigo-600">
                    {stats.organization_name}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  {stats.subscription_plan} PLAN
                </span>
              </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                  Total Leads
                </span>
                <span className="text-4xl font-black text-slate-900">
                  {stats.leads_count}
                </span>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                  Active Clients
                </span>
                <span className="text-4xl font-black text-slate-900">
                  {stats.clients_count}
                </span>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col bg-indigo-600">
                <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
                    />
                  </svg>
                </div>
                <span className="text-white/60 font-bold text-xs uppercase tracking-widest mb-1">
                  Current Plan
                </span>
                <span className="text-4xl font-black text-white">
                  {stats.subscription_plan}
                </span>
                <button
                  onClick={() => navigate("/pricing")}
                  className="mt-6 bg-white py-3 rounded-xl font-bold text-indigo-600 text-sm hover:bg-slate-50 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>

            {/* Usage Limits Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-black text-slate-900 mb-8">
                Plan Usage & Limits
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <UsageBar
                  label="Leads Usage"
                  used={usage.leads.used}
                  limit={usage.leads.limit}
                  colorClass="bg-blue-600"
                />
                <UsageBar
                  label="Clients Usage"
                  used={usage.clients.used}
                  limit={usage.clients.limit}
                  colorClass="bg-amber-500"
                />
                <UsageBar
                  label="Invoices Usage"
                  used={usage.invoices.used}
                  limit={usage.invoices.limit}
                  colorClass="bg-indigo-600"
                />
              </div>
            </div>

            {/* Payment History Section */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-900">
                  Payment History
                </h2>
                {payments.length > 0 && (
                  <button
                    onClick={fetchPaymentHistory}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh
                  </button>
                )}
              </div>
              <PaymentHistory
                payments={payments}
                onViewReceipt={handleViewReceipt}
                loading={loadingPayments}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          organizationName={stats.organization_name}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
};

export default Dashboard;
