import React, { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout";

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Default to current month/year
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editForm, setEditForm] = useState({
    allowances: 0,
    deductions: 0,
    status: "DRAFT",
  });

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/hr/payrolls/?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch payrolls");
      const data = await response.json();
      setPayrolls(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/hr/payrolls/generate_payroll/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to generate payroll");

      setSuccess(data.message);
      fetchPayrolls(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setEditForm({
      allowances: payroll.allowances || 0,
      deductions: payroll.deductions || 0,
      status: payroll.status || "DRAFT",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPayroll(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/hr/payrolls/${editingPayroll.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          allowances: editForm.allowances,
          deductions: editForm.deductions,
          status: editForm.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update payroll");
      }

      setSuccess("Payroll updated successfully");
      closeEditModal();
      fetchPayrolls();
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleStatusChange = async (targetStatus) => {
    setEditForm((prev) => ({ ...prev, status: targetStatus }));
  };

  const formatCurrency = (amount) => {
    return (
      "Rs. " +
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    );
  };

  return (
    <DashboardLayout
      title="Payroll Generator"
      subtitle="Manage and calculate monthly staff salaries"
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-40 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Year
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full sm:w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleGeneratePayroll}
            disabled={generating}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            {generating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
                Generate Payroll
              </>
            )}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-medium border border-emerald-100 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        {/* Payroll Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Basic</th>
                  <th className="px-6 py-4 text-emerald-600">+ Allowances</th>
                  <th className="px-6 py-4 text-red-600">- Deductions</th>
                  <th className="px-6 py-4 font-black">Net Salary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Loading payroll data...
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-slate-300 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="font-semibold text-slate-600">
                          No payroll generated for{" "}
                          {MONTHS.find((m) => m.value == selectedMonth)?.label}{" "}
                          {selectedYear}
                        </p>
                        <p className="text-slate-400 mt-1">
                          Click Generate Payroll to calculate standard salaries
                          based on attendance.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payrolls.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {p.employee_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex gap-2">
                          <span
                            className="text-emerald-600 font-bold"
                            title="Present"
                          >
                            {p.present_days}P
                          </span>
                          <span
                            className="text-red-500 font-bold"
                            title="Absent"
                          >
                            {p.absent_days}A
                          </span>
                          <span
                            className="text-orange-400 font-bold"
                            title="Leave"
                          >
                            {p.leave_days}L
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatCurrency(p.basic_salary)}
                      </td>
                      <td className="px-6 py-4 text-emerald-600">
                        {formatCurrency(p.allowances)}
                      </td>
                      <td
                        className="px-6 py-4 text-red-600 truncate max-w-[150px]"
                        title={`Absence: ${p.absence_deduction} + Other: ${p.deductions}`}
                      >
                        {formatCurrency(
                          parseFloat(p.deductions) +
                            parseFloat(p.absence_deduction),
                        )}
                        {parseFloat(p.absence_deduction) > 0 && (
                          <span className="text-xs text-red-400 block pb-1 border-b border-red-100">
                            Absence: {formatCurrency(p.absence_deduction)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 text-lg">
                        {formatCurrency(p.net_salary)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                            p.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : p.status === "FINALIZED"
                                ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                : "bg-amber-50 text-amber-700 ring-amber-600/20"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Edit Payroll</h3>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {editingPayroll.employee_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    {editingPayroll.employee_name}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {MONTHS.find((m) => m.value == selectedMonth)?.label}{" "}
                    {selectedYear}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">
                    Allowances
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.allowances}
                      onChange={(e) =>
                        setEditForm({ ...editForm, allowances: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-600 uppercase mb-2">
                    Deductions
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.deductions}
                      onChange={(e) =>
                        setEditForm({ ...editForm, deductions: e.target.value })
                      }
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["DRAFT", "FINALIZED", "PAID"].map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => handleStatusChange(statusOption)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        editForm.status === statusOption
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Payroll;
