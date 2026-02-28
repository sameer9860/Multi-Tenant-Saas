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
      currency: "NPR",
      minimumFractionDigits: 2,
    })
      .format(amount || 0)
      .replace("NPR", "Rs. ");
  };

  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${API_URL}/analytics/reports/vat/?month=${month}&year=${year}&export=csv`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to download CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `VAT_Report_${month}_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download CSV report. Please try again.");
    }
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
      subtitle="Monthly VAT collected and compliance breakdown"
    >
      <div className="space-y-8">
        {/* Filters & Actions */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-wrap gap-6 items-center">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Period Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold transition-all"
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
                  Period Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold w-28 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-500/25 group whitespace-nowrap"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transform group-hover:-translate-y-0.5 transition-transform"
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
              Download VAT CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-400 font-bold tracking-wide">
              Aggregating VAT data...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 font-bold text-center">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Total Taxable Sales
                </p>
                <p className="text-3xl font-black text-slate-900">
                  {formatCurrency(data?.total_sales)}
                </p>
                <p className="text-xs font-bold text-slate-400 mt-2">
                  Excluding VAT
                </p>
              </div>
              <div className="p-8 bg-blue-50/50 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">
                  VAT Collected (13%)
                </p>
                <p className="text-3xl font-black text-blue-700">
                  {formatCurrency(data?.total_vat_collected)}
                </p>
                <p className="text-xs font-bold text-blue-500/60 mt-2">
                  From {data?.invoice_count} Invoices
                </p>
              </div>
              <div className="p-8 bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10">
                <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">
                  Total Including VAT
                </p>
                <p className="text-3xl font-black text-white">
                  {formatCurrency(data?.grand_total)}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Gross Sales Total
                </p>
              </div>
            </div>

            {/* Invoice Breakdown Table */}
            <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Invoice breakdown
                </h3>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest">
                  {data?.invoices?.length || 0} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Invoice #
                      </th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Date
                      </th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Customer
                      </th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                        Subtotal
                      </th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                        VAT
                      </th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.invoices?.map((inv, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5 text-sm font-black text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">
                          {new Date(inv.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">
                          {inv.customer_name}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right">
                          {formatCurrency(inv.subtotal)}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-blue-600 text-right">
                          {formatCurrency(inv.vat_amount)}
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-slate-900 text-right">
                          {formatCurrency(inv.total)}
                        </td>
                      </tr>
                    ))}
                    {(!data?.invoices || data.invoices.length === 0) && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-8 py-16 text-center text-slate-400 font-bold"
                        >
                          No invoices found for the selected period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8">
          <div className="flex gap-6">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-black text-blue-900 mb-2 uppercase tracking-tight">
                VAT Compliance Note
              </h4>
              <p className="text-sm text-blue-800/80 leading-relaxed font-bold">
                This summary is based on the invoices generated within the
                selected period. Ensure all your purchases and sales are
                correctly recorded for accurate filing with the Inland Revenue
                Department (IRD) of Nepal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VATSummary;
