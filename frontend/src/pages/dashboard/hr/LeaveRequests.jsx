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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/hr/leave-requests/";
      if (statusFilter !== "ALL") url += `?status=${statusFilter}`;

      const [reqRes, empRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/hr/employees/?no_pagination=true", {
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, statusFilter]);

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

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              Leave Management
            </h1>
            <p className="text-slate-500 font-medium">
              Manage and track employee leave requests.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
          >
            Request Leave
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 outline-none min-w-[150px]"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-semibold text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
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
                Click 'Request Leave' to submit a new application.
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
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                      <td className="px-5 py-4 text-sm text-slate-600">
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
                      <td className="px-5 py-4 text-right">
                        {req.status === "PENDING" &&
                          (userRole === "ADMIN" || userRole === "OWNER") && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleAction(req.id, "APPROVED")}
                                className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(req.id, "REJECTED")}
                                className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-violet-600 text-white">
              <h2 className="text-xl font-black">Request Leave</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Employee
                </label>
                <select
                  required
                  value={form.employee}
                  onChange={(e) => field("employee", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500"
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
                    Type
                  </label>
                  <select
                    value={form.leave_type}
                    onChange={(e) => field("leave_type", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500"
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    &nbsp;
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(e) => field("start_date", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={form.end_date}
                    onChange={(e) => field("end_date", e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => field("reason", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-violet-500 resize-none"
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
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LeaveRequests;
