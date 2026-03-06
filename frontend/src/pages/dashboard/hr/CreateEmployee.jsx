import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const CreateEmployee = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role") || "STAFF";

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    department: "",
    designation: "",
    join_date: "",
    basic_salary: "",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  React.useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    } else if (userRole !== "ADMIN" && userRole !== "OWNER") {
      navigate("/dashboard/hr/employees");
      return;
    }

    const fetchData = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          fetch("/api/hr/departments/?no_pagination=true", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/hr/designations/?no_pagination=true", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (deptRes.ok) setDepartments(await deptRes.json());
        if (roleRes.ok) setDesignations(await roleRes.json());
      } catch (err) {
        console.error("Failed to fetch departments/roles:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [token, userRole, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If department changes, clear designation
    if (name === "department") {
      setFormData((prev) => ({
        ...prev,
        department: value,
        designation: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Filter empty selections to null/blank for API
    const submissionData = { ...formData };
    if (!submissionData.department) submissionData.department = null;
    if (!submissionData.designation) submissionData.designation = null;

    try {
      const response = await fetch("/api/hr/employees/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            JSON.stringify(errorData) ||
            "Failed to create employee",
        );
      }

      // Success
      navigate("/dashboard/hr/employees");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/hr/employees");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Add New Employee
          </h1>
          <p className="text-slate-600 text-lg">
            Create a new digital staff record in the HR system
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800"
                  placeholder="Employee's full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800"
                  placeholder="name@company.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800"
                  placeholder="+977 9800000000"
                />
              </div>

              {/* Address */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800 resize-none"
                  placeholder="Street, City, Country"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800 bg-white appearance-none"
                  disabled={dataLoading}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position / Designation */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Role / Position
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800 bg-white appearance-none"
                  disabled={
                    dataLoading ||
                    (!formData.department && designations.length > 0)
                  }
                >
                  <option value="">Select Role</option>
                  {designations
                    .filter(
                      (dsg) =>
                        !formData.department ||
                        dsg.department === parseInt(formData.department),
                    )
                    .map((dsg) => (
                      <option key={dsg.id} value={dsg.id}>
                        {dsg.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Join Date
                </label>
                <input
                  type="date"
                  name="join_date"
                  value={formData.join_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800"
                />
              </div>

              {/* Basic Salary */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Basic Salary (Rs)
                </label>
                <input
                  type="number"
                  name="basic_salary"
                  min="0"
                  step="0.01"
                  value={formData.basic_salary}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800"
                  placeholder="0.00"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Employment Type
                </label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800 appearance-none bg-white"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition font-medium text-slate-800 appearance-none bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="RESIGNED">Resigned</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-200 active:scale-95"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    Saving...
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Save Employee
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateEmployee;
