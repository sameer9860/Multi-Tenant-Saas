import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PaymentHistory from "../components/PaymentHistory";
import ReceiptModal from "../components/ReceiptModal";
import DashboardLayout from "../components/DashboardLayout";
import {
  useDashboardData,
  usePaymentHistory,
  useUserProfile,
} from "../services/hooks";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successPlan, setSuccessPlan] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);

  // Use custom hooks for data fetching
  const { analytics, error: analyticsError } = useDashboardData();
  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePaymentHistory();
  const { profile, error: profileError } = useUserProfile();

  // Determine overall error state (only show if not dismissed)
  const error = !dismissedError
    ? analyticsError || paymentsError || profileError
    : null;

  // Format analytics data for display
  const stats = {
    leads_count: analytics?.total_leads || 0,
    clients_count: analytics?.total_clients || 0,
    invoices_count: analytics?.total_invoices || 0,
    total_customers: analytics?.total_customers || 0,
    total_revenue: analytics?.total_revenue || 0,
    total_due: analytics?.total_due || 0,
    monthly_revenue: analytics?.monthly_revenue || [],
    subscription_plan: analytics?.plan || "Loading...",
    organization_name: analytics?.organization_name || "Loading...",
    conversion_rate: analytics?.conversion_rate || 0,
    status_counts: analytics?.status_counts || {
      NEW: 0,
      CONTACTED: 0,
      CONVERTED: 0,
      LOST: 0,
    },
  };

  const chartData = {
    labels: ["New", "Contacted", "Converted", "Lost"],
    datasets: [
      {
        data: [
          stats.status_counts.NEW,
          stats.status_counts.CONTACTED,
          stats.status_counts.CONVERTED,
          stats.status_counts.LOST,
        ],
        backgroundColor: ["#3B82F6", "#FACC15", "#22C55E", "#EF4444"],
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: stats.monthly_revenue.map((item) => {
      // Create a nice month label, e.g., "Jan", "Feb"
      if (!item.month) return "";
      const date = new Date(item.month + "-01");
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }),
    datasets: [
      {
        label: "Monthly Revenue",
        data: stats.monthly_revenue.map((item) => item.total),
        borderColor: "#10B981", // Emerald 500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#10B981",
        fill: true,
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const usage = {
    leads: analytics?.usage?.leads || { used: 0, limit: 0 },
    clients: analytics?.usage?.clients || { used: 0, limit: 0 },
    invoices: analytics?.usage?.invoices || { used: 0, limit: 0 },
  };
  // convert negative limits (from backend) to null (infinite)
  if (usage.invoices.limit != null && usage.invoices.limit < 0) {
    usage.invoices.limit = null;
  }

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

    // Redirect to login if not authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login");
    }

    // Auto-logout after inactivity or timeout
    const logoutAfterMs = 15 * 60 * 1000; // 15 minutes
    let timer = setTimeout(() => {
      console.info("Session timed out, logging out");
      localStorage.removeItem("token");
      navigate("/login");
    }, logoutAfterMs);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.info("Session timed out, logging out");
        localStorage.removeItem("token");
        navigate("/login");
      }, logoutAfterMs);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [navigate]);

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
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
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

  const StatCard = ({ icon: Icon, label, value, color }) => {
    return (
      <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300 transform hover:scale-105 flex flex-col max-w-xs">
        <div
          className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6`}
        >
          {Icon}
        </div>
        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">
          {label}
        </span>
        <span className="text-3xl font-black text-slate-900">{value}</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Error Banner */}
      {error && (
        <div className="fixed top-8 right-8 z-50 bg-rose-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error.message}</span>
          <button
            onClick={() => setDismissedError(true)}
            className="ml-2 font-bold hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}

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

      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">Dashboard</h1>
          <p className="text-slate-500 font-medium text-lg">
            Welcome back,{" "}
            <span className="text-indigo-600 font-bold">
              {profile?.full_name || "User"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md border border-slate-100">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
            {stats.subscription_plan} PLAN
          </span>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Total Revenue"
          value={`Rs. ${stats.total_revenue.toLocaleString()}`}
          color="bg-emerald-50"
        />

        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Total Due"
          value={`Rs. ${stats.total_due.toLocaleString()}`}
          color="bg-rose-50"
        />

        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-blue-600"
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
          }
          label="Total Clients"
          value={stats.clients_count}
          color="bg-blue-50"
        />

        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          label="Invoices Customers"
          value={stats.total_customers}
          color="bg-amber-50"
        />

        <StatCard
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          label="Total Invoices"
          value={stats.invoices_count}
          color="bg-green-50"
        />

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-indigo-200/50 border border-indigo-400/30 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 transform hover:scale-105 flex flex-col text-white">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
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
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
              />
            </svg>
          </div>
          <span className="text-white/80 font-bold text-xs uppercase tracking-widest mb-2">
            Current Plan
          </span>
          <span className="text-4xl font-black mb-4">
            {stats.subscription_plan}
          </span>
          <button
            onClick={() => navigate("/pricing")}
            className="mt-auto bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Usage Limits Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            Plan Usage & Limits
          </h2>
          <p className="text-slate-500 font-medium">
            Monitor your resource usage across your plan
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            colorClass="bg-green-500"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center w-full">
          <div className="flex justify-between items-center w-full mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Monthly Revenue Growth
              </h3>
              <p className="text-slate-500 font-medium">
                Track your business growth over time
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100/50">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                Live Data
              </span>
            </div>
          </div>

          <div className="w-full h-80">
            {stats.monthly_revenue && stats.monthly_revenue.length > 0 ? (
              <Line
                data={lineChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat("en-NP", {
                              style: "currency",
                              currency: "NPR",
                            })
                              .format(context.parsed.y)
                              .replace("NPR", "Rs.");
                          }
                          return label;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                        drawBorder: false,
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                          weight: "600",
                          size: 12,
                        },
                        color: "#64748b",
                      },
                    },
                    y: {
                      grid: {
                        color: "#f1f5f9",
                        drawBorder: false,
                        borderDash: [5, 5],
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                          weight: "600",
                          size: 12,
                        },
                        color: "#64748b",
                        callback: function (value, index, values) {
                          return "Rs. " + value.toLocaleString();
                        },
                      },
                    },
                  },
                  interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                  },
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-slate-300 mx-auto mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-slate-500 font-bold">
                    No revenue data available yet
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Start collecting payments to see your growth chart.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Lead Status Distribution
            </h3>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tighter">
                Live Stats
              </span>
            </div>
          </div>

          {/* Custom Legend Above Chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-8">
            {[
              {
                label: "New",
                count: stats.status_counts.NEW,
                color: "bg-blue-500",
                text: "text-blue-700",
                bg: "bg-blue-50",
              },
              {
                label: "Contacted",
                count: stats.status_counts.CONTACTED,
                color: "bg-yellow-400",
                text: "text-yellow-700",
                bg: "bg-yellow-50",
              },
              {
                label: "Converted",
                count: stats.status_counts.CONVERTED,
                color: "bg-emerald-500",
                text: "text-emerald-700",
                bg: "bg-emerald-50",
              },
              {
                label: "Lost",
                count: stats.status_counts.LOST,
                color: "bg-rose-500",
                text: "text-rose-700",
                bg: "bg-rose-50",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`${item.bg} px-3 py-2 rounded-2xl border border-white/50 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-default`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-2.5 h-2.5 ${item.color} rounded-full shadow-sm`}
                  ></span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {item.label}
                  </span>
                </div>
                <span className={`text-xl font-black ${item.text}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className="w-48 h-48 relative">
            <Pie
              data={chartData}
              options={{
                plugins: {
                  legend: { display: false }, // Hide default legend as we made a custom one
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>

        {/* Bar chart showing counts */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-xl font-bold text-slate-900 mb-6 self-start">
            Resource Counts
          </h3>
          <div className="w-full h-48">
            <Bar
              data={{
                labels: ["Leads", "Clients", "Invoices"],
                datasets: [
                  {
                    label: "Total",
                    data: [
                      stats.leads_count,
                      stats.clients_count,
                      stats.invoices_count,
                    ],
                    backgroundColor: ["#3B82F6", "#FACC15", "#22C55E"],
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              Payment History
            </h2>
            <p className="text-slate-500 font-medium">
              Track all your transactions and receipts
            </p>
          </div>
          {payments.length > 0 && (
            <button
              onClick={refetchPayments}
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
          loading={paymentsLoading}
        />
      </div>

      {/* Receipt Modal */}
      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          organizationName={stats.organization_name}
          onClose={handleCloseReceipt}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
