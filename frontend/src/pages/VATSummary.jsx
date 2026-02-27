import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import api from "../services/api";

const VATSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchVATSummary();
  }, [month, year]);

  const fetchVATSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/analytics/reports/vat/?month=${month}&year=${year}`,
      );
      setData(response);
    } catch (err) {
      setError(err.message || "Failed to fetch VAT summary");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount || 0)
      .replace("\u20b9", "Rs. ");
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
      title="VAT Summary Report"
      subtitle="Monthly VAT collected and payable summary"
    >
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
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
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold w-24"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Total Taxable Sales
              </p>
              <p className="text-3xl font-black text-slate-900">
                {formatCurrency(data?.total_sales)}
              </p>
            </div>
            <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100">
              <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">
                Total VAT Collected
              </p>
              <p className="text-3xl font-black text-indigo-700">
                {formatCurrency(data?.total_vat_collected)}
              </p>
            </div>
            <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800">
              <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Total Invoices
              </p>
              <p className="text-3xl font-black text-white">
                {data?.invoice_count}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-black text-amber-900 mb-1">
              VAT Compliance Note
            </h4>
            <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
              This summary is based on the invoices generated within the
              selected period. Ensure all your purchases and sales are correctly
              recorded for accurate filing with the Inland Revenue Department
              (IRD).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VATSummary;
