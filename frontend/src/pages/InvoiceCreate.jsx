import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useCustomers, useCreateInvoice } from "../services/hooks";

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const { customers, loading: customersLoading } = useCustomers();
  const { createInvoice, loading: creatingInvoice, error: createError } =
    useCreateInvoice();

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

  const [items, setItems] = useState([
    { description: "", quantity: 1, rate: 0, total: 0 },
  ]);

  const [vatPercent, setVatPercent] = useState(13);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "customer" ? value : value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = isNaN(value) ? value : parseFloat(value);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer) {
      alert("Please select a customer");
      return;
    }

    const invoiceData = {
      customer: parseInt(formData.customer),
      date: formData.date,
      due_date: formData.due_date,
      subtotal: formData.subtotal,
      vat_amount: formData.vat_amount,
      total: formData.total,
      status: "DUE",
    };

    const result = await createInvoice(invoiceData);
    if (result) {
      // Create invoice items
      for (const item of items) {
        if (item.description && item.quantity > 0 && item.rate > 0) {
          try {
            await fetch("/api/invoices/invoice-items/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                invoice: result.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                total: item.total,
              }),
            });
          } catch (err) {
            console.error("Error creating invoice item:", err);
          }
        }
      }

      // Redirect to invoice list
      navigate("/dashboard/invoices");
    }
  };

  return (
    <DashboardLayout title="Create Invoice" subtitle="Add a new invoice">
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {createError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            Error: {createError.message}
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Invoice Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Customer *
              </label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                VAT Percentage
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vatPercent}
                onChange={(e) => {
                  setVatPercent(parseFloat(e.target.value));
                  calculateTotals(items);
                }}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Invoice Items
          </h3>

          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-600 text-sm">
                    Description
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-slate-600 text-sm">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600 text-sm">
                    Rate
                  </th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600 text-sm">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-slate-600 text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2"
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
            Add Item
          </button>
        </div>

        {/* Totals */}
        <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-200 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-slate-700">Subtotal:</span>
              <span className="font-black text-slate-900">
                ${formData.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-slate-700">
                VAT ({vatPercent}%):
              </span>
              <span className="font-black text-slate-900">
                ${formData.vat_amount.toFixed(2)}
              </span>
            </div>
            <div className="border-t-2 border-indigo-200 pt-4 flex justify-between items-center text-xl">
              <span className="font-black text-slate-900">Total:</span>
              <span className="font-black text-indigo-600 text-2xl">
                ${formData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={creatingInvoice}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingInvoice ? "Saving..." : "Create Invoice"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/invoices")}
            className="flex-1 bg-slate-200 text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default InvoiceCreate;
