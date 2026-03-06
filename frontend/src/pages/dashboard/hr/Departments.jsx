import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const Departments = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
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
      const [deptRes, roleRes] = await Promise.all([
        fetch("/api/hr/departments/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/hr/designations/?no_pagination=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!deptRes.ok || !roleRes.ok) throw new Error("Failed to fetch data");

      const deptData = await deptRes.json();
      const roleData = await roleRes.json();

      setDepartments(deptData);
      setDesignations(roleData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/hr/departments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deptForm),
      });
      if (!res.ok) throw new Error("Failed to create department");

      setIsDeptModalOpen(false);
      setDeptForm({ name: "", description: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await fetch("/api/hr/designations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(roleForm),
      });
      if (!res.ok) throw new Error("Failed to create role");

      setIsRoleModalOpen(false);
      setRoleForm({ name: "", description: "", department: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Departments & Roles
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Manage company structure and roles
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-2"
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
            <button
              onClick={() => setIsDeptModalOpen(true)}
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
              Add Department
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Departments List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Departments</h2>
              {departments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  No departments found. Create one.
                </div>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {dept.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {dept.description || "No description provided."}
                        </p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 py-1 px-3 rounded-lg text-sm font-bold">
                        {dept.employee_count}{" "}
                        {dept.employee_count === 1 ? "Employee" : "Employees"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Roles List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800">
                Roles / Designations
              </h2>
              {designations.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  No roles found. Create one.
                </div>
              ) : (
                designations.map((role) => (
                  <div
                    key={role.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {role.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                            {role.department_name}
                          </span>
                          <span className="text-sm text-slate-500">
                            {role.description}
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-400 text-sm font-medium">
                        {role.employee_count}{" "}
                        {role.employee_count === 1 ? "Member" : "Members"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Department Modal */}
        {isDeptModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">
                  New Department
                </h3>
                <button
                  onClick={() => setIsDeptModalOpen(false)}
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
              <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={deptForm.name}
                    onChange={(e) =>
                      setDeptForm({ ...deptForm, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={deptForm.description}
                    onChange={(e) =>
                      setDeptForm({ ...deptForm, description: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Brief description (optional)"
                    rows={3}
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDeptModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {modalLoading ? "Saving..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">New Role</h3>
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
              <form onSubmit={handleCreateRole} className="p-6 space-y-4">
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
                    {modalLoading ? "Saving..." : "Create"}
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

export default Departments;
