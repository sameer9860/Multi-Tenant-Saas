import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const Reports = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReportPreview();
  }, [month, year]);

  const fetchReportPreview = async () => {
    try {
      setLoading(true);
      const data = await api.get(
        `/analytics/reports/monthly/?month=${month}&year=${year}`,
      );
      setReportData(data);
    } catch (err) {
      console.error("Error fetching report preview:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/analytics/reports/monthly/?month=${month}&year=${year}&export=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok)
        throw new Error(`Failed to download ${format.toUpperCase()}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Monthly_Report_${month}_${year}.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        `Failed to download ${format.toUpperCase()} report. Please try again.`,
      );
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 2,
    })
      .format(amount || 0)
      .replace("NPR", "Rs. ");
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <DashboardLayout
      title="Financial Reports"
      subtitle="Analyze your business performance and tax liabilities"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selector & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">
              Report Period
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Select Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all"
                >
                  {months.map((name, i) => (
                    <option key={i} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Select Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-900/20 text-white">
            <h3 className="text-lg font-black mb-4">Quick Reports</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/dashboard/reports/vat")}
                className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-left transition-all flex items-center justify-between group"
              >
                <span className="font-bold">VAT Summary</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-left transition-all flex items-center justify-between group shadow-lg shadow-indigo-500/40"
              >
                <div className="flex items-center gap-3">
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
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-bold">
                    {downloading ? "Processing..." : "Download PDF"}
                  </span>
                </div>
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
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>

              <button
                onClick={() => handleDownload("csv")}
                disabled={downloading}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-left transition-all flex items-center justify-between group shadow-lg shadow-emerald-500/40"
              >
                <div className="flex items-center gap-3">
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="font-bold">Export Financial CSV</span>
                </div>
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
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Preview Card */}
        <div className="lg:col-span-2">
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm h-full">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-6 uppercase tracking-tight">
              {months[month - 1]} {year} Performance Preview
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-slate-400 font-bold tracking-wide">
                  Crunching numbers...
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-indigo-600"
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
                    </div>
                    <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                      Total Invoiced
                    </p>
                    <p className="text-4xl font-black text-slate-900">
                      {formatCurrency(reportData?.total_invoiced)}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      Billable amount generated
                    </p>
                  </div>

                  <div className="p-8 bg-green-50/50 rounded-3xl border border-green-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-green-600"
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
                    </div>
                    <p className="text-sm font-bold text-green-600 mb-2 uppercase tracking-wide">
                      Total Revenue
                    </p>
                    <p className="text-4xl font-black text-green-700">
                      {formatCurrency(reportData?.revenue)}
                    </p>
                    <p className="mt-2 text-xs font-bold text-green-600/60 transition-all">
                      Actual collected cash
                    </p>
                  </div>

                  <div className="p-8 bg-rose-50/50 rounded-3xl border border-rose-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-rose-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-rose-600 mb-2 uppercase tracking-wide">
                      Monthly Expenses
                    </p>
                    <p className="text-4xl font-black text-rose-700">
                      {formatCurrency(reportData?.expenses)}
                    </p>
                  </div>

                  <div className="p-8 bg-amber-50/50 rounded-3xl border border-amber-100/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-amber-600"
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
                    </div>
                    <p className="text-sm font-bold text-amber-600 mb-2 uppercase tracking-wide">
                      Total Outstanding
                    </p>
                    <p className="text-4xl font-black text-amber-700">
                      {formatCurrency(reportData?.due_amount)}
                    </p>
                  </div>
                </div>

                <div className="p-10 bg-slate-900 rounded-3xl border border-slate-800 flex justify-between items-center text-white shadow-2xl shadow-indigo-900/20">
                  <div>
                    <p className="text-sm font-black text-slate-400 mb-1 uppercase tracking-widest">
                      Calculated Net Profit
                    </p>
                    <p
                      className={`text-5xl font-black ${reportData?.net_profit >= 0 ? "text-indigo-400" : "text-rose-400"}`}
                    >
                      {formatCurrency(reportData?.net_profit)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${reportData?.net_profit >= 0 ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"}`}
                    >
                      {reportData?.net_profit >= 0 ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">
                      Invoices
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {reportData?.invoice_count}
                    </p>
                  </div>
                  <div className="text-center p-4 border-l border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">
                      VAT Component
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {formatCurrency(reportData?.vat_collected)}
                    </p>
                  </div>
                  <div className="text-center p-4 border-l border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">
                      Customers
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {reportData?.customer_count}
                    </p>
                  </div>
                  <div className="text-center p-4 border-l border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase mb-1">
                      Retention
                    </p>
                    <p className="text-xl font-black text-slate-900">100%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
