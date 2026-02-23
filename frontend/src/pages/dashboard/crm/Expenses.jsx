import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    category: "General",
  });
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
  });

  const token = localStorage.getItem("token");

  const fetchExpenses = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/crm/expenses/");
      setExpenses(data);

      const total = data.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      setStats({
        total,
        count: data.length,
      });
    } catch (err) {
      if (err.code === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchExpenses();
  }, [token, navigate, fetchExpenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/crm/expenses/", newExpense);
      setNewExpense({ title: "", amount: "", category: "General" });
      setShowAddForm(false);
      fetchExpenses();
    } catch (err) {
      setError("Failed to add expense: " + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      await api.delete(`/api/crm/expenses/${id}/`);
      fetchExpenses();
    } catch (err) {
      setError("Failed to delete expense: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              Expense Management
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Track your business outflows and monitor real-time profit.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg shadow-indigo-200"
          >
            {showAddForm ? (
              "Close Form"
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Expense
              </>
            )}
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
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
                  d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                Total Expenses
              </div>
              <div className="text-3xl font-black text-slate-900">
                Rs. {stats.total.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">
                Transaction Count
              </div>
              <div className="text-3xl font-black text-slate-900">
                {stats.count} Items
              </div>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        {showAddForm && (
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 mb-10 animate-slide-in-top">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Create New Expense
            </h2>
            <form
              onSubmit={handleAddExpense}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">
                  Title / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="Office Rent, Utilities, etc."
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">
                  Category
                </label>
                <select
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                >
                  <option>General</option>
                  <option>Rent</option>
                  <option>Salary</option>
                  <option>Utilities</option>
                  <option>Marketing</option>
                  <option>Supplies</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-slate-900 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100"
                >
                  Confirm Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl font-bold flex items-center gap-3">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Expense List */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500">
          {loading ? (
            <div className="p-32 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <div className="text-slate-400 font-black uppercase tracking-widest text-sm">
                Synchronizing ledger...
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-32 text-center bg-gradient-to-b from-white to-slate-50/50">
              <div className="w-24 h-24 bg-slate-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                No Expenses Found
              </h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">
                Start recording your business expenses to see accurate profit
                calculations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Transaction
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Category
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Amount
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Date
                    </th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/50 transition-all duration-300 group"
                    >
                      <td className="px-8 py-7">
                        <div className="font-black text-slate-900 text-lg">
                          {expense.title}
                        </div>
                        <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-0.5">
                          ID: {expense.id}
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-8 py-7 font-black text-rose-600 text-lg">
                        - Rs. {parseFloat(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-8 py-7">
                        <div className="text-sm font-bold text-slate-700">
                          {new Date(expense.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Expenses;
