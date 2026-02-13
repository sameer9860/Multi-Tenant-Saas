import React from "react";

const ReceiptModal = ({ payment, organizationName, onClose }) => {
  if (!payment) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up print:shadow-none print:max-w-full">
        {/* Header - Hidden on print */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-black text-slate-900">
            Payment Receipt
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 print:p-12">
          {/* Company Header */}
          <div className="text-center mb-8 pb-8 border-b-2 border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
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
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              SaaS CRM
            </h1>
            <p className="text-slate-500 font-medium">Payment Receipt</p>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Receipt Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Transaction ID
                  </p>
                  <p className="text-sm font-black text-slate-900 font-mono">
                    {payment.transaction_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Date</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Payment Method
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {payment.provider}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Billed To
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900">
                  {organizationName || "Organization"}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-bold">Payment Successful</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Amount Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">
                  Subscription Plan
                </span>
                <span className="text-sm font-black text-slate-900 uppercase">
                  {payment.plan}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">
                  Subscription Amount
                </span>
                <span className="text-sm font-bold text-slate-900">
                  NPR {formatAmount(payment.amount)}
                </span>
              </div>
              <div className="border-t-2 border-slate-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-slate-900">
                    Total Paid
                  </span>
                  <span className="text-2xl font-black text-indigo-600">
                    NPR {formatAmount(payment.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Information */}
          {payment.reference_id && (
            <div className="mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Reference ID
              </h3>
              <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 px-4 py-3 rounded-xl">
                {payment.reference_id}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-8 border-t-2 border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              Thank you for your business!
            </p>
            <p className="text-xs text-slate-400 font-medium mt-2">
              For any queries, please contact support
            </p>
          </div>
        </div>

        {/* Action Buttons - Hidden on print */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-8 py-6 flex gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
