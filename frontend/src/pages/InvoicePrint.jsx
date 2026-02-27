import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useInvoice } from "../services/hooks";

const InvoicePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoice, loading, error } = useInvoice(id);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("\u20b9", "Rs. ");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusWatermark = (status) => {
    if (status === "PAID") return null;
    return (
      <div className="watermark no-print:hidden">
        {status === "PARTIAL" ? "Partially Paid" : "Unpaid"}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white pt-8 pb-12 print:p-0">
      {/* 🧭 No Print: Header Controls */}
      <div className="no-print max-w-[210mm] mx-auto mb-8 px-8 py-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex justify-between items-center animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
            title="Go Back"
          >
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
                d="M10 19l-7-7m0 0l-7-7m7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Print Preview</h1>
            <p className="text-sm text-slate-500 font-bold">
              A4 Optimized Layout
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition-all flex items-center gap-2 active:scale-95"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v8"
              />
            </svg>
            Print Invoice
          </button>
        </div>
      </div>

      {/* 📄 Actual Print Area */}
      <div
        id="invoice-print-area"
        className="bg-white shadow-2xl print:shadow-none animate-slide-up"
      >
        {getStatusWatermark(invoice.status)}

        {/* 🏢 Header: Branding & Meta */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
          <div className="flex gap-6 items-start">
            {invoice.organization?.logo && (
              <img
                src={invoice.organization.logo}
                alt="Logo"
                className="w-24 h-24 object-contain rounded-xl"
              />
            )}
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 mb-1 leading-none">
                {invoice.organization?.name?.toUpperCase() || "BUSINESS NAME"}
              </h1>
              <div className="text-sm font-bold text-slate-500 space-y-0.5">
                <p>{invoice.organization?.email}</p>
                <p>{invoice.organization?.phone}</p>
                {invoice.organization?.vat_number && (
                  <p className="text-slate-900">
                    VAT No: {invoice.organization.vat_number}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black text-slate-900 opacity-10 mb-4 uppercase tracking-tighter">
              Invoice
            </h2>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-400 tracking-widest uppercase">
                Invoice Number
              </p>
              <p className="text-lg font-black text-slate-900">
                {invoice.invoice_number}
              </p>
              <div className="pt-2">
                <p className="text-xs font-black text-slate-400 tracking-widest uppercase">
                  Issue Date
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDate(invoice.date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 👥 Recipient Details */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">
              Bill To
            </h3>
            <p className="text-xl font-black text-slate-900 mb-1">
              {invoice.customer?.name}
            </p>
            <div className="text-sm font-bold text-slate-600 space-y-1">
              <p>{invoice.customer?.address}</p>
              <p>{invoice.customer?.phone}</p>
              <p>{invoice.customer?.email}</p>
              {invoice.customer?.vat_number && (
                <p className="text-slate-900 font-black mt-2">
                  VAT: {invoice.customer.vat_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-end text-right pb-4">
            <p className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">
              Due Date
            </p>
            <p className="text-2xl font-black text-indigo-600">
              {invoice.due_date ? formatDate(invoice.due_date) : "On Receipt"}
            </p>
            <div className="mt-4">
              <span
                className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                  invoice.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : invoice.status === "PARTIAL"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* 📦 Items Table */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-900">
                <th className="py-5 px-6 text-left text-xs font-black uppercase tracking-widest">
                  Description
                </th>
                <th className="py-5 px-6 text-center text-xs font-black uppercase tracking-widest w-24">
                  Qty
                </th>
                <th className="py-5 px-6 text-right text-xs font-black uppercase tracking-widest w-32">
                  Rate
                </th>
                <th className="py-5 px-6 text-right text-xs font-black uppercase tracking-widest w-32">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="py-5 px-6 font-bold text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-5 px-6 text-center font-bold text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="py-5 px-6 text-right font-bold text-slate-600">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-5 px-6 text-right font-black text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 💰 Totals & Payment summary */}
        <div className="flex flex-col items-end mb-16">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>
                VAT (
                {((invoice.vat_amount / invoice.subtotal) * 100).toFixed(0)}%)
              </span>
              <span className="text-slate-900">
                {formatCurrency(invoice.vat_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl p-5 shadow-xl shadow-slate-900/10">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">
                Grand Total
              </span>
              <span className="text-2xl font-black">
                {formatCurrency(invoice.total)}
              </span>
            </div>

            {invoice.paid_amount > 0 && (
              <>
                <div className="flex justify-between text-sm font-bold text-green-600 pt-2">
                  <span>Paid Amount</span>
                  <span>{formatCurrency(invoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-dashed border-slate-200 pt-3">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Balance Due
                  </span>
                  <span className="text-xl font-black text-rose-600">
                    {formatCurrency(invoice.balance)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 📝 Footer & Thank you */}
        <div className="mt-auto border-t border-slate-100 pt-12 flex justify-between items-end">
          <div className="max-w-xs">
            <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-4">
              Note / Terms
            </h4>
            <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
              "Thank you for your business. Please make payments within the due
              date to avoid service interruptions."
            </p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-200 mb-2 h-12 flex items-end justify-center">
              {/* Optional Signature Space */}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
