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

  return (
    <div className="min-h-screen bg-white">
      {/* Print Header - Hidden when printing */}
      <div className="print:hidden bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-slate-900">Print Invoice</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-slate-300 rounded-lg font-bold hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="bg-white border border-slate-200 rounded-lg p-12">
          {/* Header */}
          <div className="mb-12 pb-8 border-b border-slate-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-black text-indigo-600 mb-2">
                  INVOICE
                </h1>
                <p className="text-2xl font-bold text-slate-900">
                  {invoice.invoice_number}
                </p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-white"
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                  From
                </p>
                <p className="font-bold text-slate-900">Multi Tenant SaaS </p>
                <p className="text-sm text-slate-600">Dhading,Nepal</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Bill To
                </p>
                <p className="font-bold text-slate-900">
                  {invoice.customer?.name}
                </p>
                <p className="text-sm text-slate-600">
                  {invoice.customer?.email}
                </p>
                <p className="text-sm text-slate-600">
                  {invoice.customer?.address}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-8 mb-12 pb-8 border-b border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                Invoice Date
              </p>
              <p className="font-bold text-slate-900">
                {formatDate(invoice.date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                Due Date
              </p>
              <p className="font-bold text-slate-900">
                {invoice.due_date ? formatDate(invoice.due_date) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                Status
              </p>
              <p className="font-bold text-slate-900">{invoice.status}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50">
                  <th className="text-left py-4 px-4 font-bold text-slate-900">
                    Description
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">
                    Quantity
                  </th>
                  <th className="text-right py-4 px-4 font-bold text-slate-900">
                    Rate
                  </th>
                  <th className="text-right py-4 px-4 font-bold text-slate-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-4 px-4 text-slate-900">
                        {item.description}
                      </td>
                      <td className="text-center py-4 px-4 text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="text-right py-4 px-4 text-slate-900">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="text-right py-4 px-4 font-bold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      No items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm">
              <div className="border-t-2 border-slate-300 pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Subtotal:</span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">VAT:</span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(invoice.vat_amount)}
                  </span>
                </div>
                <div className="flex justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-200">
                  <span className="font-black text-slate-900">TOTAL:</span>
                  <span className="text-indigo-600 font-black text-xl">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.paid_amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <p className="text-sm font-bold text-slate-700 mb-2">
                Payment Information
              </p>
              <div className="flex justify-between">
                <span className="text-slate-700">Paid Amount:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(invoice.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Balance:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
            <p>Thank you for your business!</p>
            <p className="mt-2">Questions? Contact us at support@company.com</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          .max-w-5xl {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;
