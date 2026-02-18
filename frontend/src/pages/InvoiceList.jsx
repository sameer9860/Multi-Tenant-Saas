import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useInvoices } from "../services/hooks";

const InvoiceList = () => {
  const navigate = useNavigate();
  const { invoices, loading, error, refetch } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handlePrint = (invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}/print`);
  };

  const handleEdit = (invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}/edit`);
  };

  const handleView = (invoice) => {
    navigate(`/dashboard/invoices/${invoice.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200";
      case "PARTIAL":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "DUE":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount).replace("\u20b9", "Rs. ");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <DashboardLayout title="Invoices" subtitle="Manage your invoices">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          Error loading invoices: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Invoices" subtitle="Manage your business invoices">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            All Invoices
          </h2>
          <p className="text-slate-500 font-medium">
            Total: {invoices.length} invoices
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/invoices/create")}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-slate-400"
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
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No invoices yet
          </h3>
          <p className="text-slate-500 mb-6">
            Start creating invoices to track your payments
          </p>
          <button
            onClick={() => navigate("/dashboard/invoices/create")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Invoice
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Invoice #
                </th>
                <th className="text-left py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Customer
                </th>
                <th className="text-left py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Date
                </th>
                <th className="text-right py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Amount
                </th>
                <th className="text-right py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Balance
                </th>
                <th className="text-right py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Status
                </th>
                <th className="text-center py-4 px-6 font-bold text-slate-600 uppercase text-xs tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900">
                      {invoice.invoice_number}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-700 font-medium">
                      {(() => {
                        if (invoice.customer && typeof invoice.customer === 'object') {
                          return invoice.customer.name;
                        }
                        if (invoice.customer) {
                          // customer is just an id, show it as fallback
                          return `#${invoice.customer}`;
                        }
                        return "Unknown";
                      })()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-slate-600">
                      {formatDate(invoice.date)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold text-slate-900">
                      {formatCurrency(invoice.total)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-bold text-slate-900">
                      {formatCurrency(invoice.balance || 0)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleView(invoice)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Print"
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
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InvoiceList;
