import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "NEW",
    assigned_to: "",
  });

  // Get user from localStorage
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role") || "STAFF";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLeads();
  }, [token, navigate]);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 403) {
        setError("Lead limit reached. Upgrade your plan.");
        setLeads([]);
      } else if (response.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || "Failed to fetch leads from server.",
        );
      } else {
        const data = await response.json();
        setLeads(data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    setError(null);

    const isEditing = !!selectedLead;
    const url = isEditing
      ? `/api/crm/leads/${selectedLead.id}/`
      : "/api/crm/leads/";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLead),
      });

      if (response.status === 403) {
        setError("Lead limit reached. Upgrade your plan.");
      } else if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} lead`);
      } else {
        const savedLead = await response.json();
        setModalOpen(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          source: "",
          status: "NEW",
          assigned_to: "",
        });
        setSelectedLead(null); // Clear selected lead

        if (isEditing) {
          setLeads(leads.map((l) => (l.id === savedLead.id ? savedLead : l)));
        } else {
          setLeads([savedLead, ...leads]);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      const response = await fetch(`/api/crm/leads/${leadId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }

      setLeads(leads.filter((l) => l.id !== leadId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setNewLead(lead);
    setModalOpen(true);
  };

  const handleViewProfile = (lead) => {
    setSelectedLead(lead);
    setProfileModalOpen(true);
  };

  const renderStatus = (status) => {
    const colors = {
      NEW: "bg-blue-100/80 text-blue-700 border border-blue-200",
      CONTACTED: "bg-amber-100/80 text-amber-700 border border-amber-200",
      CONVERTED: "bg-emerald-100/80 text-emerald-700 border border-emerald-200",
      LOST: "bg-rose-100/80 text-rose-700 border border-rose-200",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${colors[status] || colors.NEW}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-white border-r border-slate-100 p-8 flex flex-col shadow-sm overflow-y-auto">
          <div className="mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              SaaS CRM
            </span>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">
              Menu
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all"
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Dashboard
            </button>
            <button
              onClick={() => navigate("/dashboard/crm/leads")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold transition-all"
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Leads
            </button>
            <button
              onClick={() => navigate("/dashboard/crm/leads/create")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Lead
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl font-semibold transition-all"
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Subscription
            </button>
          </nav>

          <div className="pt-8 border-t border-slate-100 flex flex-col gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Leads Dashboard
                </h1>
                <p className="text-slate-500 font-medium">
                  Manage and track your potential customers efficiently.
                </p>
              </div>

              {userRole === "ADMIN" && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
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
                  Add New Lead
                </button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 animate-pulse">
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
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              {loading ? (
                <div className="p-20 text-center text-slate-400 font-medium">
                  Loading leads...
                </div>
              ) : leads.length === 0 && !error ? (
                <div className="p-20 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-slate-300"
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
                    No leads found
                  </h3>
                  <p className="text-slate-400">
                    Start by adding your first lead to see it here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {lead.name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">
                              Lead #{lead.id}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-600">
                              {lead.email}
                            </div>
                            <div className="text-xs text-slate-400">
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {renderStatus(lead.status)}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                            {lead.assigned_to || "Unassigned"}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleViewProfile(lead)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Profile"
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
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEditLead(lead)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit Lead"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Lead"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
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
        </main>
      </div>

      {/* Create Lead Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">
                Add New Lead
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-100"
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

            <form onSubmit={handleSaveLead} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newLead.name}
                    onChange={(e) =>
                      setNewLead({ ...newLead, name: e.target.value })
                    }
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    placeholder="Enter lead name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={newLead.email}
                    onChange={(e) =>
                      setNewLead({ ...newLead, email: e.target.value })
                    }
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Phone Number
                  </label>
                  <input
                    required
                    type="text"
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead({ ...newLead, phone: e.target.value })
                    }
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Status
                  </label>
                  <select
                    value={newLead.status}
                    onChange={(e) =>
                      setNewLead({ ...newLead, status: e.target.value })
                    }
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 appearance-none bg-white"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="CONVERTED">Converted</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    value={newLead.assigned_to}
                    onChange={(e) =>
                      setNewLead({ ...newLead, assigned_to: e.target.value })
                    }
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    placeholder="Staff member name"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  {selectedLead ? "Update Lead" : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
              <h2 className="text-2xl font-black text-slate-900">
                Lead Profile
              </h2>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-100"
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

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedLead.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Lead #{selectedLead.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Email Address
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedLead.email}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Phone Number
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedLead.phone}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Status
                  </p>
                  {renderStatus(selectedLead.status)}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Assigned To
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedLead.assigned_to || "Unassigned"}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Lead Source
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {selectedLead.source || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setProfileModalOpen(false);
                    handleEditLead(selectedLead);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  Edit Lead
                </button>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
