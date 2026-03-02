import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useCustomer, useInvoices } from "../../services/hooks";
import CustomerLedger from "./CustomerLedger";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    customer,
    loading: customerLoading,
    error: customerError,
  } = useCustomer(id);
  const { invoices } = useInvoices();
  const [activeTab, setActiveTab] = useState("overview");

  const customerInvoices = invoices.filter((inv) => {
    if (typeof inv.customer === "object") {
      return inv.customer.id === parseInt(id);
    }
    return inv.customer === parseInt(id);
  });

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

  if (customerLoading) {
    return (
      <DashboardLayout title="Customer Detail">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (customerError) {
    return (
      <DashboardLayout title="Error">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-bold">
          Error: {customerError.message}
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) return null;

  return (
    <DashboardLayout
      title={customer.name}
      subtitle="Customer Relationship Management"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with quick stats */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 font-black text-3xl">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-1">
                  {customer.name}
                </h1>
                <p className="text-slate-500 font-medium">
                  {customer.email} | {customer.phone}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                    Active Client
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() =>
                  navigate("/dashboard/invoices/create", {
                    state: { customerId: customer.id },
                  })
                }
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-slate-200">
          <nav className="flex gap-8">
            {["overview", "invoices", "ledger"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all border-b-4 ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Address
                    </p>
                    <p className="font-medium text-slate-700">
                      {customer.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      VAT Number
                    </p>
                    <p className="font-medium text-slate-700">
                      {customer.vat_number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Created At
                    </p>
                    <p className="font-medium text-slate-700">
                      {formatDate(customer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6">
                  Business Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Invoices
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {customerInvoices.length}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      Total Value
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {formatCurrency(
                        customerInvoices.reduce(
                          (acc, inv) => acc + parseFloat(inv.total),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "invoices" && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Invoice #
                    </th>
                    <th className="text-left py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="text-right py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="text-right py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="text-center py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-20 text-center text-slate-400 font-medium"
                      >
                        No invoices found for this customer.
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-5 px-8 font-black text-slate-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-5 px-8 text-slate-600">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="py-5 px-8 text-right font-black text-slate-900">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="py-5 px-8 text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              invoice.status === "PAID"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : invoice.status === "PARTIAL"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-5 px-8 text-center">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/invoices/${invoice.id}`)
                            }
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "ledger" && <CustomerLedger customerId={id} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetail;
