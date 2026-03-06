import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const Roles = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    department: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, deptRes] = await Promise.all([
        fetch("/api/hr/designations/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/hr/departments/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!roleRes.ok || !deptRes.ok) throw new Error("Failed to fetch data");

      const roleData = await roleRes.json();
      const deptData = await deptRes.json();

      setDesignations(roleData);
      setDepartments(deptData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setRoleForm({ name: "", description: "", department: "" });
    setIsEditMode(false);
    setEditingId(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setRoleForm({
      name: role.name,
      description: role.description,
      department: role.department || "",
    });
    setIsEditMode(true);
    setEditingId(role.id);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      const res = await fetch(`/api/hr/designations/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete role");

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const url = isEditMode
        ? `/api/hr/designations/${editingId}/`
        : "/api/hr/designations/";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roleForm),
      });
      if (!res.ok)
        throw new Error(`Failed to ${isEditMode ? "update" : "create"} role`);

      setIsRoleModalOpen(false);
      setRoleForm({ name: "", description: "", department: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Filter Designations
  const filteredDesignations = designations.filter((role) => {
    const matchesSearch = role.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDept =
      departmentFilter === "all" ||
      role.department === parseInt(departmentFilter);
    return matchesSearch && matchesDept;
  });

  // Group by Department
  const groupedRoles = filteredDesignations.reduce((acc, role) => {
    const deptName = role.department_name || "Unassigned";
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(role);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Roles
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Manage designations across departments
            </p>
          </div>
          <div className="flex gap-3">
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
              Add Role
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 w-full">
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
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sm:w-64 w-full">
            <select
              className="block w-full pl-3 pr-10 py-3 border border-slate-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors cursor-pointer appearance-none"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          {(searchQuery || departmentFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDepartmentFilter("all");
              }}
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
          <div className="space-y-10">
            {Object.keys(groupedRoles).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                {searchQuery || departmentFilter !== "all"
                  ? "No roles matching your filters."
                  : "No roles found. Create one."}
              </div>
            ) : (
              Object.entries(groupedRoles).map(([deptName, roles]) => (
                <div key={deptName} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                      {deptName}
                    </h2>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
                      {roles.length} {roles.length === 1 ? "Role" : "Roles"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition group flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                            {role.name}
                          </h3>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(role)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Role"
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
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Role"
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
                        </div>

                        <p className="text-sm text-slate-500 mb-6 flex-grow">
                          {role.description || "No description provided."}
                        </p>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Members
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-lg text-sm font-bold">
                            {role.employee_count}{" "}
                            {role.employee_count === 1 ? "Member" : "Members"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Role Modal */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditMode ? "Edit Role" : "New Role"}
                </h3>
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
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
              <form onSubmit={handleSaveRole} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={roleForm.department}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, department: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  >
                    <option value="">Select a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Brief description (optional)"
                    rows={2}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50"
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

export default Roles;
