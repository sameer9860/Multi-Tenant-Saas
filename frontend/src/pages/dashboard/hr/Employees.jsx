import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  email: "",
  address: "",
  department: "",
  position: "",
  join_date: "",
  basic_salary: "",
  employment_type: "FULL_TIME",
  status: "ACTIVE",
};

const STATUS_COLORS = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  RESIGNED: "bg-rose-100 text-rose-700 border border-rose-200",
};

const EMP_TYPE_COLORS = {
  FULL_TIME: "bg-blue-50 text-blue-700 border border-blue-200",
  PART_TIME: "bg-amber-50 text-amber-700 border border-amber-200",
  CONTRACT: "bg-violet-50 text-violet-700 border border-violet-200",
};

const Employees = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role") || "STAFF";

  // List state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/hr/employees/?page=${page}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || err.error || "Failed to fetch employees.");
        return;
      }
      const data = await res.json();
      if (data.results !== undefined) {
        setEmployees(data.results);
        setTotalCount(data.count);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
      } else {
        setEmployees(data);
        setTotalCount(data.length);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, page, search, statusFilter]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchEmployees();
  }, [token, navigate, fetchEmployees]);

  // ─── Stats ───────────────────────────────────────────────────────────────
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const resignedCount = employees.filter((e) => e.status === "RESIGNED").length;

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setSelectedEmployee(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setForm({
      full_name: emp.full_name || "",
      phone: emp.phone || "",
      email: emp.email || "",
      address: emp.address || "",
      department: emp.department || "",
      position: emp.position || "",
      join_date: emp.join_date || "",
      basic_salary: emp.basic_salary || "",
      employment_type: emp.employment_type || "FULL_TIME",
      status: emp.status || "ACTIVE",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEditing = !!selectedEmployee;
      const url = isEditing
        ? `/api/hr/employees/${selectedEmployee.id}/`
        : "/api/hr/employees/";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        closeModal();
        fetchEmployees();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || JSON.stringify(err) || "Save failed.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee record? This cannot be undone."))
      return;
    try {
      await fetch(`/api/hr/employees/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmployees();
    } catch (e) {
      setError(e.message);
    }
  };

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">
              Employees
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your team's digital staff records.
            </p>
          </div>
          {(userRole === "ADMIN" || userRole === "OWNER") && (
            <button
              onClick={openAdd}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
            >
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
              Add Employee
            </button>
          )}
        </div>

        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Staff", value: totalCount, color: "bg-violet-600" },
            { label: "Active", value: activeCount, color: "bg-emerald-500" },
            { label: "Resigned", value: resignedCount, color: "bg-rose-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4"
            >
              <div
                className={`${s.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search name, email, department, position…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest hidden md:block">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all appearance-none min-w-[140px]"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESIGNED">Resigned</option>
            </select>
          </div>
          {(search || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setPage(1);
              }}
              className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl font-semibold">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {loading ? (
            <div className="p-20 text-center text-slate-400 font-medium">
              Loading employees…
            </div>
          ) : employees.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-violet-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-violet-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No employees found
              </h3>
              <p className="text-slate-400">
                Add your first employee to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    {[
                      "#",
                      "Employee",
                      "Contact",
                      "Department / Position",
                      "Type",
                      "Salary",
                      "Joined",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {employees.map((emp, idx) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-400">
                        {(page - 1) * 25 + idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {emp.full_name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-600">
                          {emp.email || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {emp.phone || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {emp.department || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {emp.position || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${EMP_TYPE_COLORS[emp.employment_type] || ""}`}
                        >
                          {emp.employment_type?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {emp.basic_salary
                          ? `Rs ${parseFloat(emp.basic_salary).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {emp.join_date
                          ? new Date(emp.join_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[emp.status] || ""}`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          {(userRole === "ADMIN" || userRole === "OWNER") && (
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
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

        {/* ── Pagination ── */}
        {!loading && totalCount > 25 && (
          <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-sm font-medium text-slate-500">
              Page <span className="text-slate-900 font-bold">{page}</span> of{" "}
              {Math.ceil(totalCount / 25)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={!hasPrev}
                onClick={() => setPage(page - 1)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border ${!hasPrev ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"}`}
              >
                Previous
              </button>
              <button
                disabled={!hasNext}
                onClick={() => setPage(page + 1)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border ${!hasNext ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-violet-600 to-violet-700">
              <h2 className="text-xl font-black text-white">
                {selectedEmployee ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSave}
              className="p-6 overflow-y-auto max-h-[75vh]"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.full_name}
                    onChange={(e) => field("full_name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="Employee's full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => field("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="name@company.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="+977 9800000000"
                  />
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Address
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => field("address", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800 resize-none"
                    placeholder="Street, City, Country"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => field("department", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="e.g. Engineering"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Position
                  </label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => field("position", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="e.g. Software Engineer"
                  />
                </div>

                {/* Join Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={form.join_date}
                    onChange={(e) => field("join_date", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                  />
                </div>

                {/* Basic Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Basic Salary (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.basic_salary}
                    onChange={(e) => field("basic_salary", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800"
                    placeholder="0.00"
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={form.employment_type}
                    onChange={(e) => field("employment_type", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800 appearance-none bg-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => field("status", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all font-medium text-slate-800 appearance-none bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="RESIGNED">Resigned</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : selectedEmployee
                      ? "Save Changes"
                      : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Employees;
