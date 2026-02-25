import React, { useState, useEffect } from "react";
import api from "../../services/api";

const CustomerLedger = ({ customerId }) => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLedger = async () => {
      setLoading(true);
      try {
        const data = await api.get(
          `/api/invoices/customers/${customerId}/ledger/`,
        );
        setLedger(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchLedger();
    }
  }, [customerId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("\u20b9", "Rs. ");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-bold">
        Error loading ledger: {error}
      </div>
    );
  }

  if (!ledger) return null;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">
            Total Invoiced
          </p>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(ledger.summary.total_invoiced)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">
            Total Paid
          </p>
          <p className="text-2xl font-black text-green-600">
            {formatCurrency(ledger.summary.total_paid)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-indigo-500">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">
            Current Balance
          </p>
          <p className="text-2xl font-black text-indigo-600">
            {formatCurrency(ledger.summary.current_balance)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                Date
              </th>
              <th className="text-left py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                Description
              </th>
              <th className="text-right py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                Debit (Dr)
              </th>
              <th className="text-right py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                Credit (Cr)
              </th>
              <th className="text-right py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ledger.entries.map((entry, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 text-sm text-slate-600">
                  {formatDate(entry.date)}
                </td>
                <td className="py-4 px-6 text-sm font-bold text-slate-900">
                  {entry.description}
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase ${
                      entry.type === "Invoice"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {entry.type}
                  </span>
                </td>
                <td className="py-4 px-6 text-right text-sm font-bold text-rose-600">
                  {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                </td>
                <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">
                  {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                </td>
                <td className="py-4 px-6 text-right text-sm font-black text-slate-900">
                  {formatCurrency(entry.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerLedger;
