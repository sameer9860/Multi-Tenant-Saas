import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

const Team = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [inviting, setInviting] = useState(false);

  const token = localStorage.getItem("token");

  const fetchMembers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/api/accounts/members/");
      setMembers(data);
    } catch (err) {
      if (err.code === 401) {
        localStorage.clear();
        navigate("/login");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMembers();
  }, [token, navigate, fetchMembers]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await api.post("/api/accounts/members/", {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteRole("STAFF");
      setShowInviteModal(false);
      fetchMembers();
    } catch (err) {
      setError(err.message || "Failed to invite member.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this team member?"))
      return;
    try {
      await api.delete(`/api/accounts/members/${id}/`);
      fetchMembers();
    } catch (err) {
      setError(err.message || "Failed to remove member.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
              Team Management
            </h1>
            <p className="text-slate-500 font-medium text-lg">
              Manage roles and access for your organization's members.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="group relative px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
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
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Invite Member
            </div>
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

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-500">
          {loading ? (
            <div className="p-32 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <div className="text-slate-400 font-black uppercase tracking-widest text-sm text-center">
                Fetching Team Roster...
              </div>
            </div>
          ) : members.length === 0 ? (
            <div className="p-32 text-center bg-gradient-to-b from-white to-slate-50/50">
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                No members found
              </h3>
              <p className="text-slate-400 font-medium">
                Start building your team by inviting colleagues.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Member Info
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Email Address
                    </th>
                    <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Access Role
                    </th>
                    <th className="px-8 py-6 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-indigo-50/20 transition-all duration-300 group"
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                            {member.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-lg">
                              {member.full_name}
                            </div>
                            <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-0.5">
                              Active Member
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg italic">
                          {member.email}
                        </span>
                      </td>
                      <td className="px-8 py-7">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl border ${
                            member.role === "OWNER"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : member.role === "ADMIN"
                                ? "bg-purple-50 text-purple-700 border-purple-100"
                                : "bg-slate-50 text-slate-600 border-slate-100"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.role === "OWNER"
                                ? "bg-indigo-500"
                                : member.role === "ADMIN"
                                  ? "bg-purple-500"
                                  : "bg-slate-400"
                            }`}
                          ></span>
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {member.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-7 text-right">
                        {member.role !== "OWNER" && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remove Member"
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-slate-100">
              <h2 className="text-3xl font-black text-slate-900 mb-6">
                Invite New Member
              </h2>
              <form onSubmit={handleInvite} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 transition-all"
                    placeholder="team@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Access Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                  >
                    <option value="STAFF">Staff Member</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-8 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {inviting ? "Sending..." : "Send Invite"}
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

export default Team;
