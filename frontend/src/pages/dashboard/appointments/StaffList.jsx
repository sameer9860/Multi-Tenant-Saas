import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const StaffList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments/staff/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch staff");

      const data = await res.json();
      setStaff(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      is_active: true,
    });
    setIsEditMode(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setForm({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      is_active: member.is_active,
    });
    setIsEditMode(true);
    setEditingId(member.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?"))
      return;

    try {
      const res = await fetch(`/api/appointments/staff/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete staff member");

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const url = isEditMode
        ? `/api/appointments/staff/${editingId}/`
        : "/api/appointments/staff/";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok)
        throw new Error(
          `Failed to ${isEditMode ? "update" : "create"} staff member`,
        );

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Staff Management
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Manage your team members and their roles
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 flex items-center gap-2"
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
            Add Staff
          </button>
        </div>

        {/* Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full text-zinc-900">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder="Search staff by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 px-4 py-3 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl">{error}</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  {["S.N", "Name", "Role", "Contact", "Status", ""].map((h) => (
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
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-slate-500 font-medium"
                    >
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member, idx) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {member.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                        {member.role}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-900">
                          {member.email}
                        </div>
                        <div className="text-xs text-slate-400">
                          {member.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${member.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(member)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Staff Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <h3 className="text-xl font-bold">
                  {isEditMode ? "Edit Staff" : "New Staff"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/70 hover:text-white"
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
              <form
                onSubmit={handleSave}
                className="p-6 space-y-4 text-zinc-900"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Dr. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Role *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Doctor, Stylist"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-bold text-slate-700 uppercase tracking-wide cursor-pointer"
                  >
                    Active
                  </label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {modalLoading
                      ? "Saving..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffList;
