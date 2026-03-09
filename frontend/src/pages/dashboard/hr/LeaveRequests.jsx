import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const EMPTY_FORM = {
  employee: "",
  leave_type: "CASUAL",
  start_date: "",
  end_date: "",
  reason: "",
};

const STATUS_COLORS = {
  PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border border-rose-200",
};

const LEAVE_TYPE_LABELS = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  ANNUAL: "Annual Leave",
  UNPAID: "Unpaid Leave",
};

const LeaveRequests = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role") || "STAFF";

  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [desigFilter, setDesigFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/hr/leave-requests/?";
      if (statusFilter !== "ALL") url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (deptFilter) url += `department=${deptFilter}&`;
      if (desigFilter) url += `designation=${desigFilter}&`;
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}&`;

      const [reqRes, empRes, deptRes, desigRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/hr/employees/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/hr/departments/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/hr/designations/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (reqRes.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (reqRes.ok) setRequests(await reqRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (desigRes.ok) setDesignations(await desigRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    navigate,
    statusFilter,
    search,
    deptFilter,
    desigFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchRequests();
  }, [token, navigate, fetchRequests]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/leave-requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setModalOpen(false);
        setForm(EMPTY_FORM);
        fetchRequests();
      } else {
        const err = await res.json();
        setError(JSON.stringify(err));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/leave-requests/${form.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setModalOpen(false);
        setForm(EMPTY_FORM);
        fetchRequests();
      } else {
        const err = await res.json();
        setError(JSON.stringify(err));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`/api/hr/leave-requests/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    try {
      const res = await fetch(`/api/hr/leave-requests/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchRequests();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleExportCSV = async () => {
    let url = "/api/hr/leave-requests/export_csv/?";
    if (statusFilter !== "ALL") url += `status=${statusFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (deptFilter) url += `department=${deptFilter}&`;
    if (desigFilter) url += `designation=${desigFilter}&`;
    if (startDate) url += `start_date=${startDate}&`;
    if (endDate) url += `end_date=${endDate}&`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to export CSV");

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute(
        "download",
        `leave_requests_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setDeptFilter("");
    setDesigFilter("");
    setStartDate("");
    setEndDate("");
  };

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <style>
          {`
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; overflow: visible !important; height: auto !important; }
              .print-container { padding: 0 !important; margin: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; font-size: 10px !important; }
              .print-header { display: block !important; margin-bottom: 20px !important; }
              .DashboardLayout_main { padding: 0 !important; margin: 0 !important; width: 100% !important; display: block !important; }
              .DashboardLayout_container { display: block !important; height: auto !important; overflow: visible !important; padding: 0 !important; background: white !important; }
            }
            .print-header { display: none; }
          `}
        </style>

        <div className="flex justify-between items-center no-print">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              Leave Management
            </h1>
            <p className="text-slate-500 font-medium">
              Manage and track employee leave requests.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
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
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
            >
              Request Leave
            </button>
          </div>
        </div>

        {/* Print Header */}
        <div className="print-header text-center">
          <h1 className="text-2xl font-bold">Leave Management Report</h1>
          <p className="text-slate-500">
            Report Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Improved Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Search Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-4 focus:ring-violet-500/10 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 outline-none"
              >
                <option value="">All Depts</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Role
              </label>
              <select
                value={desigFilter}
                onChange={(e) => setDesigFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 outline-none"
              >
                <option value="">All Roles</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-4 focus:ring-violet-500/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-4 focus:ring-violet-500/10 outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-semibold text-sm no-print">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 print-container">
          {loading ? (
            <div className="p-20 text-center text-slate-400 font-medium">
              Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center">
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No leave requests found
              </h3>
              <p className="text-slate-400">
                Try adjusting your filters or submit a new application.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider no-print">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {req.employee_name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {LEAVE_TYPE_LABELS[req.leave_type]}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {new Date(req.start_date).toLocaleDateString()} -{" "}
                        {new Date(req.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 truncate max-w-[200px]">
                        {req.reason}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[req.status]}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right no-print whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setForm({ ...req });
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title={
                              req.status === "PENDING" ? "Edit" : "View Details"
                            }
                          >
                            {req.status === "PENDING" ? (
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            ) : (
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete"
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          {req.status === "PENDING" &&
                            (userRole === "ADMIN" || userRole === "OWNER") && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(req.id, "APPROVED")
                                  }
                                  className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(req.id, "REJECTED")
                                  }
                                  className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-violet-600 text-white">
              <h2 className="text-xl font-black">
                {form.id
                  ? form.status === "PENDING"
                    ? "Edit Request"
                    : "View Details"
                  : "Request Leave"}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setForm(EMPTY_FORM);
                }}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={form.id ? handleUpdate : handleSave}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Employee
                </label>
                <select
                  required
                  disabled={form.id && form.status !== "PENDING"}
                  value={form.employee}
                  onChange={(e) => field("employee", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Leave Type
                  </label>
                  <select
                    disabled={form.id && form.status !== "PENDING"}
                    value={form.leave_type}
                    onChange={(e) => field("leave_type", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Start Date
                  </label>
                  <input
                    required
                    disabled={form.id && form.status !== "PENDING"}
                    type="date"
                    value={form.start_date}
                    onChange={(e) => field("start_date", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    End Date
                  </label>
                  <input
                    required
                    disabled={form.id && form.status !== "PENDING"}
                    type="date"
                    value={form.end_date}
                    onChange={(e) => field("end_date", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Reason
                </label>
                <textarea
                  required
                  disabled={form.id && form.status !== "PENDING"}
                  rows={3}
                  value={form.reason}
                  onChange={(e) => field("reason", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 resize-none text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="Reason for leave"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {(!form.id || form.status === "PENDING") && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Submitting..."
                      : form.id
                        ? "Update Request"
                        : "Submit Request"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LeaveRequests;
