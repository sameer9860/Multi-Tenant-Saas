import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

const CreateMember = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    role: "STAFF",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/accounts/members/", formData);
      navigate("/dashboard/team");
    } catch (err) {
      setError(err.message || "Failed to create team member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              Add Team Member
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Onboard a new member to your organization.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/team")}
            className="px-6 py-3 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Team
          </button>
        </div>

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

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all text-lg"
                placeholder="colleague@company.com"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                Access Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: "STAFF",
                    label: "Staff",
                    desc: "Standard workspace access",
                  },
                  {
                    value: "ADMIN",
                    label: "Admin",
                    desc: "Full management permissions",
                  },
                  {
                    value: "ACCOUNTANT",
                    label: "Accountant",
                    desc: "Invoicing and payment access",
                  },
                ].map((role) => (
                  <label
                    key={role.value}
                    className={`relative p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                      formData.role === role.value
                        ? "bg-indigo-50 border-indigo-600 ring-4 ring-indigo-500/5"
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="font-black text-slate-900 mb-1">
                      {role.label}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {role.desc}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 disabled:opacity-50 transition-all text-xl"
              >
                {loading ? "Sending Invitation..." : "Create Team Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateMember;
