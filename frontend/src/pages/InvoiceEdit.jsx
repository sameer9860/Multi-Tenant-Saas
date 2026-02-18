import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  useCustomers,
  useInvoice,
  useUpdateInvoice,
  useCreateCustomer,
} from "../services/hooks";
import api from "../services/api";
import { getEndpoint } from "../services/endpoints";

const InvoiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    customers,
    loading: customersLoading,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    invoice,
    loading: invoiceLoading,
    error: invoiceError,
  } = useInvoice(id);
  const {
    updateInvoice,
    loading: updatingInvoice,
    error: updateError,
  } = useUpdateInvoice();
  const {
    createCustomer,
    loading: creatingCustomer,
    error: customerCreateError,
  } = useCreateCustomer();

  const [formData, setFormData] = useState({
    customer: "",
    date: "",
    due_date: "",
    subtotal: 0,
    vat_amount: 0,
    total: 0,
    status: "DUE",
  });

  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [items, setItems] = useState([]);
  const [vatPercent, setVatPercent] = useState(13);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerError, setCustomerError] = useState(null);
  const isInitialized = useRef(false);

  // Initialize form with existing invoice data
  useEffect(() => {
    if (invoice && !isInitialized.current) {
      console.log(
        "[InvoiceEdit] Initializing with server data:",
        JSON.stringify(invoice, null, 2),
      );

      const parsedItems = (invoice.items || []).map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        total: parseFloat(item.total) || 0,
      }));

      setFormData({
        customer: invoice.customer?.id || invoice.customer || "",
        date: invoice.date,
        due_date: invoice.due_date || "",
        subtotal: parseFloat(invoice.subtotal) || 0,
        vat_amount: parseFloat(invoice.vat_amount) || 0,
        total: parseFloat(invoice.total) || 0,
        status: invoice.status || "DUE",
      });

      setPaidAmount(parseFloat(invoice.paid_amount) || 0);
      setBalanceAmount(parseFloat(invoice.balance) || 0);
      setItems(
        parsedItems.length > 0
          ? parsedItems
          : [{ description: "", quantity: 1, rate: 0, total: 0 }],
      );

      if (invoice.customer) {
        const customerName =
          typeof invoice.customer === "object" ? invoice.customer.name : "";
        setCustomerNameInput(customerName);
        setSelectedCustomerId(
          typeof invoice.customer === "object"
            ? invoice.customer.id
            : invoice.customer,
        );
      }

      const sub = parseFloat(invoice.subtotal) || 0;
      const vat = parseFloat(invoice.vat_amount) || 0;
      if (sub > 0) {
        setVatPercent(parseFloat(((vat / sub) * 100).toFixed(2)));
      }

      isInitialized.current = true;
    }
  }, [invoice]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("₹", "Rs. ");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate everything whenever items, VAT %, or paid amount changes
  useEffect(() => {
    if (!isInitialized.current) return;

    // Use parseFloat to be absolutely sure we are doing math, not string concatenation
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(item.total) || 0),
      0,
    );
    const vatAmount = (subtotal * (parseFloat(vatPercent) || 0)) / 100;
    const total = subtotal + vatAmount;
    const balance = total - paidAmount;

    console.log("Calculation Hook:", { subtotal, total, paidAmount, balance });

    // Refined status logic:
    // 1. If total > 0, status is based on payment progress.
    // 2. If total is 0, status is PAID only if there was some payment, otherwise DUE.
    // This fixes the "default PAID" issue for invoices with no items yet.
    let statusValue = "DUE";
    if (total > 0) {
      if (paidAmount >= total) statusValue = "PAID";
      else if (paidAmount > 0) statusValue = "PARTIAL";
      else statusValue = "DUE";
    } else {
      statusValue = paidAmount > 0 ? "PAID" : "DUE";
    }

    // Fix negative balance: Balance should not be less than 0
    setBalanceAmount(parseFloat(Math.max(0, balance).toFixed(2)));

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      status: statusValue,
    }));
  }, [items, vatPercent, paidAmount]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const numValue = value === "" ? 0 : parseFloat(value);
    newItems[index][field] = isNaN(numValue) ? value : numValue;

    if (field === "quantity" || field === "rate") {
      newItems[index].total = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const saveInvoice = async () => {
    setCustomerError(null);

    let customerId = selectedCustomerId;

    if (!customerId && customerNameInput.trim()) {
      const newCustomer = await createCustomer({
        name: customerNameInput.trim(),
      });
      if (!newCustomer) return null;
      customerId = newCustomer.id;
    }

    if (!customerId) {
      const errMsg = "Please enter a customer name";
      setCustomerError(errMsg);
      alert(errMsg);
      return null;
    }

    const invoiceData = {
      customer: customerId,
      date: formData.date,
      due_date: formData.due_date,
      subtotal: formData.subtotal,
      vat_amount: formData.vat_amount,
      total: formData.total,
      paid_amount: paidAmount,
      status: formData.status,
      items: items, // Include line items
    };

    console.log(
      "[InvoiceEdit] Saving with payload:",
      JSON.stringify(invoiceData, null, 2),
    );
    const result = await updateInvoice(id, invoiceData);
    if (result) {
      // For simplicity in this implementation, we won't handle complex item updates
      // (like deleting old and adding new) unless the backend supports it via nested writes.
      // Most Django Rest Framework implementations with related items require separate calls.
      // In a real app, you'd calculate diffs or use a nested serializer.
      return result;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await saveInvoice();
    if (result) {
      navigate("/dashboard/invoices");
    }
  };

  const handleSaveAndPrint = async () => {
    const result = await saveInvoice();
    if (result) {
      navigate(`/dashboard/invoices/${result.id}/print`);
    }
  };

  if (invoiceLoading) {
    return (
      <DashboardLayout title="Edit Invoice" subtitle="Loading invoice data...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (invoiceLoading) {
    return (
      <DashboardLayout title="Edit Invoice" subtitle="Loading invoice data...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (invoiceError) {
    return (
      <DashboardLayout title="Error" subtitle="Failed to load invoice">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-2xl max-w-2xl mx-auto shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold">API Loading Error</h3>
          </div>
          <p className="mb-6 font-medium leading-relaxed">
            {invoiceError.message}
          </p>
          {invoiceError.details && (
            <div className="bg-white/50 p-4 rounded-lg mb-6 text-sm font-mono overflow-auto max-h-32 border border-red-100">
              <p>
                <strong>Code:</strong> {invoiceError.code}
              </p>
              <p>
                <strong>URL:</strong> {invoiceError.details.url}
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Retry Loading
            </button>
            <button
              onClick={() => navigate("/dashboard/invoices")}
              className="bg-white text-slate-600 px-6 py-2 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
            >
              Back to List
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Invoice"
      subtitle={`Editing ${invoice?.invoice_number}`}
    >
      <form onSubmit={handleSubmit} className="max-w-6xl">
        {(updateError ||
          customerError ||
          invoiceError ||
          customerCreateError) && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {customerError ||
              updateError?.message ||
              invoiceError?.message ||
              customerCreateError?.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
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
                Invoice Details
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Customer *
                  </label>
                  <input
                    type="text"
                    list="customers-list"
                    value={customerNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerNameInput(val);
                      const match = customers.find((c) => c.name === val);
                      if (match) setSelectedCustomerId(match.id);
                      else setSelectedCustomerId(null);
                    }}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  />
                  <datalist id="customers-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    VAT Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={vatPercent}
                      onChange={(e) => {
                        setVatPercent(parseFloat(e.target.value) || 0);
                      }}
                      className="w-32 px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-600 font-medium">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 h-full">
              <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-6">
                Summary
              </h4>
              <div className="space-y-4">
                <div className="bg-white/50 backdrop-blur p-4 rounded-lg">
                  <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide mb-1">
                    Subtotal
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(formData.subtotal)}
                  </p>
                </div>

                <div className="bg-white/50 backdrop-blur p-4 rounded-lg">
                  <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide mb-1">
                    VAT ({vatPercent}%)
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(formData.vat_amount)}
                  </p>
                </div>

                <div className="bg-indigo-600 p-4 rounded-lg text-white">
                  <p className="text-xs font-bold uppercase tracking-wide mb-1 opacity-90">
                    Total
                  </p>
                  <p className="text-3xl font-black">
                    {formatCurrency(formData.total)}
                  </p>
                </div>

                <div className="bg-white/50 backdrop-blur p-4 rounded-lg">
                  <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide mb-1">
                    Paid Amount
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmount === 0 ? "" : paidAmount}
                    onChange={(e) => {
                      const val =
                        e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setPaidAmount(val);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-white/50 backdrop-blur p-4 rounded-lg">
                  <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        formData.status === "PAID"
                          ? "bg-green-500"
                          : formData.status === "PARTIAL"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    ></span>
                    <span className="font-bold text-slate-900">
                      {formData.status}
                    </span>
                  </div>
                </div>

                <div className="bg-white/50 backdrop-blur p-4 rounded-lg">
                  <p className="text-xs text-indigo-700 font-bold uppercase tracking-wide mb-1">
                    Balance
                  </p>
                  <p className="text-2xl font-black text-slate-900">
                    {formatCurrency(balanceAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V5a2 2 0 114 0v0M9 17H7m8 0H9"
              />
            </svg>
            Invoice Line Items
          </h3>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      placeholder="Item description"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-2">
                      Qty
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      onFocus={(e) => e.target.select()}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-2">
                      Rate (Rs.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate === 0 ? "" : item.rate}
                      onChange={(e) =>
                        handleItemChange(index, "rate", e.target.value)
                      }
                      onFocus={(e) => e.target.select()}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-2">
                        Total
                      </label>
                      <p className="text-lg font-black text-slate-900">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Remove item"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-6 text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors"
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
            Add Line Item
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSaveAndPrint}
            disabled={updatingInvoice}
            className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {updatingInvoice ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
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
                Update and Print Invoice
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={updatingInvoice}
            className="flex-1 bg-indigo-100 text-indigo-700 px-6 py-4 rounded-xl font-bold hover:bg-indigo-200 transition-colors disabled:opacity-50"
          >
            Update Only
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard/invoices")}
            className="flex-1 bg-slate-200 text-slate-900 px-6 py-4 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default InvoiceEdit;
