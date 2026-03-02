import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import LeadProfileModal from "../../../components/crm/LeadProfileModal";

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

  const fetchLeads = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
      } else if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.detail || errorData.error || "Failed to fetch leads.",
        );
      } else {
        const data = await response.json();
        setLeads(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLeads();
  }, [token, navigate, fetchLeads]);

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const isEditing = !!selectedLead;
    const url = isEditing
      ? `/api/crm/leads/${selectedLead.id}/`
      : "/api/crm/leads/";
    const method = isEditing ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLead),
      });
      if (response.ok) {
        setModalOpen(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          source: "",
          status: "NEW",
          assigned_to: "",
        });
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await fetch(`/api/crm/leads/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeads();
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
      INTERESTED: "bg-indigo-100/80 text-indigo-700 border border-indigo-200",
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
    <DashboardLayout>
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

          {(userRole === "ADMIN" || userRole === "OWNER") && (
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
                      S.N
                    </th>
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
                  {leads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-400">
                        {index + 1}
                      </td>
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
                          {(userRole === "ADMIN" || userRole === "OWNER") && (
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
                    <option value="INTERESTED">Interested</option>
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

      <LeadProfileModal
        lead={selectedLead}
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUpdate={fetchLeads}
      />
    </DashboardLayout>
  );
};

export default Leads;
