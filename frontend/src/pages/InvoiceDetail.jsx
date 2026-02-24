import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useInvoice, useCreatePayment } from "../services/hooks";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoice, loading, error, refetch } = useInvoice(id);
  const {
    createPayment,
    loading: submitting,
    error: paymentError,
  } = useCreatePayment();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount || 0)
      .replace("\u20b9", "Rs. ");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PARTIAL":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "DUE":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setErrorMessage("Please enter a valid amount.");
      return;
    }

    if (parseFloat(paymentAmount) > (invoice?.remaining_due || 0)) {
      setErrorMessage("Payment exceeds remaining amount.");
      return;
    }

    const result = await createPayment({
      invoice: id,
      amount: paymentAmount,
      payment_method: paymentMethod,
      reference,
      date: new Date().toISOString().split("T")[0],
    });

    if (result) {
      setPaymentAmount("");
      setReference("");
      refetch();
    } else {
      // The paymentError from useCreatePayment will now handle API errors
      // setErrorMessage("Failed to add payment. Please try again."); // This line is now redundant if paymentError is used
    }
  };

  const displayError =
    errorMessage ||
    (paymentError ? paymentError.message || "Server error occurred." : null);

  if (loading) {
    return (
      <DashboardLayout title="Invoice Detail">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout title="Invoice Detail">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-lg">
          {error?.message || "Invoice not found"}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Invoice ${invoice.invoice_number}`}
      subtitle={`Manage payments for ${invoice.customer?.name || "Customer"}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Invoice Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Card */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                  Summary
                </h3>
                <h2 className="text-3xl font-black text-slate-900">
                  {invoice.invoice_number}
                </h2>
              </div>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-black border ${getStatusColor(invoice.payment_status_display)}`}
              >
                {invoice.payment_status_display === "PAID"
                  ? "Paid"
                  : invoice.payment_status_display === "PARTIAL"
                    ? "Partially Paid"
                    : invoice.payment_status_display === "DUE"
                      ? "Due"
                      : invoice.payment_status_display}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-500 mb-1">
                  Total Amount
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {formatCurrency(invoice.total)}
                </p>
              </div>
              <div className="p-6 bg-green-50/30 rounded-2xl border border-green-100">
                <p className="text-sm font-bold text-green-600 mb-1">
                  Total Paid
                </p>
                <p className="text-2xl font-black text-green-700">
                  {formatCurrency(invoice.total_paid)}
                </p>
              </div>
              <div className="p-6 bg-rose-50/30 rounded-2xl border border-rose-100">
                <p className="text-sm font-bold text-rose-600 mb-1">
                  Remaining Due
                </p>
                <p className="text-2xl font-black text-rose-700">
                  {formatCurrency(invoice.remaining_due)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Payment History
            </h3>

            {invoice.payments && invoice.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-4 font-bold text-slate-400 uppercase text-xs">
                        Date
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-slate-400 uppercase text-xs">
                        Method
                      </th>
                      <th className="text-left py-4 px-4 font-bold text-slate-400 uppercase text-xs">
                        Reference
                      </th>
                      <th className="text-right py-4 px-4 font-bold text-slate-400 uppercase text-xs">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-50 group transition-colors hover:bg-slate-50/50"
                      >
                        <td className="py-4 px-4 text-slate-600">
                          {formatDate(payment.date)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-sm">
                          {payment.reference || "-"}
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">
                  No payments recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Add Payment Form */}
        <div className="space-y-8">
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-8 shadow-sm sticky top-8">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              Add Payment
            </h3>

            {invoice.remaining_due > 0 ? (
              <form onSubmit={handleAddPayment} className="space-y-6">
                {displayError && (
                  <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                    {displayError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-lg"
                    placeholder="Enter amount"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-400 font-bold">
                    Max: {formatCurrency(invoice.remaining_due)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                  >
                    <option value="cash">Cash</option>
                    <option value="esewa">eSewa</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="khalti">Khalti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">
                    Reference / Note
                  </label>
                  <textarea
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="e.g. Transaction ID, Check number"
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {submitting ? "Processing..." : "Submit Payment"}
                </button>
              </form>
            ) : (
              <div className="text-center py-12 bg-green-50/50 rounded-2xl border border-dashed border-green-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h4 className="text-green-700 font-black mb-1">Fully Paid</h4>
                <p className="text-green-600/80 text-sm font-medium">
                  This invoice is fully settled.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(`/dashboard/invoices/${id}/print`)}
              className="w-full py-4 px-6 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-slate-400"
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
            <button
              onClick={() => navigate("/dashboard/invoices")}
              className="w-full py-4 px-6 text-slate-500 font-bold hover:text-slate-700 transition-colors text-center"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
