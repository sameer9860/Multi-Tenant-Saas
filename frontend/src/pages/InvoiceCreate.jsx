import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  useCustomers,
  useCreateInvoice,
  useCreateCustomer,
} from "../services/hooks";
import api from "../services/api";
import { getEndpoint } from "../services/endpoints";

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const {
    customers,
    loading: customersLoading,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    createInvoice,
    loading: creatingInvoice,
    error: createError,
  } = useCreateInvoice();
  const {
    createCustomer,
    loading: creatingCustomer,
    error: customerCreateError,
  } = useCreateCustomer();

  const [formData, setFormData] = useState({
    customer: "",
    date: new Date().toISOString().split("T")[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0],
    subtotal: 0,
    vat_amount: 0,
    total: 0,
  });

  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState(0);

  const [items, setItems] = useState([
    { description: "", quantity: 1, rate: 0, total: 0 },
  ]);

  const [vatPercent, setVatPercent] = useState(13);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerError, setCustomerError] = useState(null);

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

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const numValue = value === "" ? 0 : parseFloat(value);
    newItems[index][field] = isNaN(numValue) ? value : numValue;

    if (field === "quantity" || field === "rate") {
      newItems[index].total = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (itemsList) => {
    const subtotal = itemsList.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = (subtotal * vatPercent) / 100;
    const total = subtotal + vatAmount;

    const bal = total - paidAmount;
    setBalanceAmount(parseFloat(bal.toFixed(2)));

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      vat_amount: parseFloat(vatAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    }));
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotals(newItems);
  };

  const handleCreateCustomer = async (name) => {
    if (!name.trim()) {
      setCustomerError("Please enter customer name");
      return;
    }

    setCustomerError(null); // Clear any previous errors
    console.log("Creating customer with name:", name.trim());

    const result = await createCustomer({
      name: name.trim(),
    });

    if (result) {
      console.log("Customer created successfully:", result);
      setCustomerNameInput(name);
      setSelectedCustomerId(result.id);
      setCustomerError(null);
      await refetchCustomers();
      setShowCustomerList(false);
    } else {
      console.error("Customer creation failed");
      setCustomerError(
        "Failed to create customer. Please check console for details.",
      );
    }
  };

  const saveInvoice = async () => {
    setCustomerError(null); // Clear previous errors

    let customerId = selectedCustomerId;

    // If no customer selected but name entered, create customer
    if (!customerId && customerNameInput.trim()) {
      console.log(
        "No customer ID, creating customer from input:",
        customerNameInput.trim(),
      );
      const newCustomer = await createCustomer({
        name: customerNameInput.trim(),
      });
      if (!newCustomer) {
        // useCreateCustomer hook will set the error state which is displayed in UI
        return null;
      }
      console.log("Customer created with ID:", newCustomer.id);
      customerId = newCustomer.id;
    }

    if (!customerId) {
      const errMsg = "Please enter a customer name";
      setCustomerError(errMsg);
      alert(errMsg);
      return null;
    }

    if (items.every((item) => !item.description)) {
      alert("Please add at least one invoice item");
      return null;
    }

    const statusValue =
      paidAmount >= formData.total
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "DUE";

    const invoiceData = {
      // send all commonly-accepted customer keys so backend can decide
      customer: customerId,
      customer_id: customerId,
      customer_input: customerId,
      date: formData.date,
      due_date: formData.due_date,
      subtotal: formData.subtotal,
      vat_amount: formData.vat_amount,
      total: formData.total,
      paid_amount: paidAmount,
      status: statusValue,
    };

    setBalanceAmount(formData.total - paidAmount);

    console.debug("Invoice payload:", invoiceData, JSON.stringify(invoiceData));

    const result = await createInvoice(invoiceData);
    if (result) {
      for (const item of items) {
        if (item.description && item.quantity > 0 && item.rate > 0) {
          const payload = {
            invoice: result.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
          };
          console.debug("Creating invoice item with", payload);
          try {
            const endpoint = getEndpoint("invoices", "items");
            try {
              await api.post(endpoint.primary, payload);
            } catch (e1) {
              console.warn(
                "Primary endpoint for items failed, trying fallback",
                endpoint.fallback,
              );
              await api.post(endpoint.fallback, payload);
            }
          } catch (err) {
            console.error("Error creating invoice item:", err);
          }
        }
      }
      return result;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await saveInvoice();
    if (result) {
      navigate(`/dashboard/invoices/${result.id}/print`);
    }
  };

  return (
    <DashboardLayout title="Create Invoice" subtitle="Add a new invoice">
      <form onSubmit={handleSubmit} className="max-w-6xl">
        {(createError || customerError || customerCreateError) && (
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
              createError?.message ||
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
                      // if user picked an existing customer name, associate its id
                      const match = customers.find((c) => c.name === val);
                      if (match) {
                        setSelectedCustomerId(match.id);
                      } else {
                        setSelectedCustomerId(null);
                      }
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
                        setVatPercent(parseFloat(e.target.value));
                        calculateTotals(items);
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
                      calculateTotals(items);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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
            type="submit"
            disabled={creatingInvoice}
            className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creatingInvoice ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
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
                Create and Print Invoice
              </>
            )}
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

export default InvoiceCreate;
