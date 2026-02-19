import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserProfile } from "../services/hooks";

const DashboardLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useUserProfile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLeadsMenuOpen, setIsLeadsMenuOpen] = useState(true);
  const [isInvoicesMenuOpen, setIsInvoicesMenuOpen] = useState(true);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isLeadsActive = location.pathname.includes("/dashboard/crm/leads");
  const isInvoicesActive = location.pathname.includes("/dashboard/invoices");

  const sidebarClasses = `${
    isSidebarCollapsed ? "w-20" : "w-80"
  } bg-white border-r border-slate-100 flex flex-col shadow-sm transition-all duration-300 ease-in-out`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={sidebarClasses}>
        {/* Sidebar Header */}
        <div
          className={`p-6 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center flex-shrink-0">
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
            {!isSidebarCollapsed && (
              <span className="text-xl font-black tracking-tight text-slate-900 truncate">
                SaaS CRM
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Collapsed Toggle (when sidebar is collapsed) */}
        {isSidebarCollapsed && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 space-y-2">
          {!isSidebarCollapsed && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-2 px-2">
              Menu
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isActive("/dashboard")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title={isSidebarCollapsed ? "Overview" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            {!isSidebarCollapsed && <span>Overview</span>}
          </button>

          {/* Business Switcher (Professional Proof - Day 21) */}
          {!isSidebarCollapsed && profile?.memberships?.length > 1 && (
            <div className="px-2 pt-4 pb-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-2">
                Active Business
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all group-hover:bg-white"
                  value={profile?.organization?.id}
                  onChange={async (e) => {
                    const orgId = e.target.value;
                    try {
                      const response = await fetch(
                        "/api/accounts/switch-org/",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                          body: JSON.stringify({ organization_id: orgId }),
                        },
                      );
                      if (response.ok) {
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error("Failed to switch business:", err);
                    }
                  }}
                >
                  {profile.memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Leads Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() =>
                !isSidebarCollapsed && setIsLeadsMenuOpen(!isLeadsMenuOpen)
              }
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                isLeadsActive && !isSidebarCollapsed
                  ? "text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isSidebarCollapsed ? "justify-center px-2 cursor-default" : "cursor-pointer"}`}
              title={isSidebarCollapsed ? "Leads" : ""}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 flex-shrink-0 ${isLeadsActive && isSidebarCollapsed ? "text-indigo-600" : ""}`}
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
                {!isSidebarCollapsed && <span>Leads</span>}
              </div>
              {!isSidebarCollapsed && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform duration-200 ${isLeadsMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {(isLeadsMenuOpen || isSidebarCollapsed) && (
              <div
                className={`${isSidebarCollapsed ? "space-y-2" : "pl-11 space-y-1"}`}
              >
                {/* Create Lead Item */}
                <button
                  onClick={() => navigate("/dashboard/crm/leads/create")}
                  className={`w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/crm/leads/create")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  } ${isSidebarCollapsed ? "justify-center p-2" : "px-3"}`}
                  title="Create Lead"
                >
                  {isSidebarCollapsed ? (
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
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Create Lead
                    </>
                  )}
                </button>

                {/* Lead List Item */}
                <button
                  onClick={() => navigate("/dashboard/crm/leads")}
                  className={`w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/crm/leads")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  } ${isSidebarCollapsed ? "justify-center p-2" : "px-3"}`}
                  title="Lead List"
                >
                  {isSidebarCollapsed ? (
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
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      Lead List
                    </>
                  )}
                </button>

                {/* Client List Item (Day 21) */}
                <button
                  onClick={() => navigate("/dashboard/crm/clients")}
                  className={`w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/crm/clients")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  } ${isSidebarCollapsed ? "justify-center p-2" : "px-3"}`}
                  title="Client List"
                >
                  {isSidebarCollapsed ? (
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
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 opacity-50"
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
                      Client List
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard/crm/pipeline")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isActive("/dashboard/crm/pipeline")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title={isSidebarCollapsed ? "Pipeline" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            {!isSidebarCollapsed && <span>Pipeline</span>}
          </button>

          <button
            onClick={() => navigate("/dashboard/crm/activity")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isActive("/dashboard/crm/activity")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title={isSidebarCollapsed ? "Activity Log" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {!isSidebarCollapsed && <span>Activity Log</span>}
          </button>

          {/* Invoices Dropdown */}
          <div className="space-y-1">
            <button
              onClick={() =>
                !isSidebarCollapsed &&
                setIsInvoicesMenuOpen(!isInvoicesMenuOpen)
              }
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                isInvoicesActive && !isSidebarCollapsed
                  ? "text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isSidebarCollapsed ? "justify-center px-2 cursor-default" : "cursor-pointer"}`}
              title={isSidebarCollapsed ? "Invoices" : ""}
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 flex-shrink-0 ${isInvoicesActive && isSidebarCollapsed ? "text-indigo-600" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {!isSidebarCollapsed && <span>Invoices</span>}
              </div>
              {!isSidebarCollapsed && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transition-transform duration-200 ${isInvoicesMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {(isInvoicesMenuOpen || isSidebarCollapsed) && (
              <div
                className={`${isSidebarCollapsed ? "space-y-2" : "pl-11 space-y-1"}`}
              >
                {/* Create Invoice Item */}
                <button
                  onClick={() => navigate("/dashboard/invoices/create")}
                  className={`w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/invoices/create")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  } ${isSidebarCollapsed ? "justify-center p-2" : "px-3"}`}
                  title="Create Invoice"
                >
                  {isSidebarCollapsed ? (
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
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 opacity-50"
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
                      Create Invoice
                    </>
                  )}
                </button>

                {/* Invoice List Item */}
                <button
                  onClick={() => navigate("/dashboard/invoices")}
                  className={`w-full flex items-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard/invoices")
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  } ${isSidebarCollapsed ? "justify-center p-2" : "px-3"}`}
                  title="Invoice List"
                >
                  {isSidebarCollapsed ? (
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
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                      Invoice List
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/pricing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isActive("/pricing")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title={isSidebarCollapsed ? "Subscription" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            {!isSidebarCollapsed && <span>Subscription</span>}
          </button>

          {(profile?.role === "OWNER" || profile?.role === "ADMIN") && (
            <button
              onClick={() => navigate("/dashboard/team")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive("/dashboard/team")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
              title={isSidebarCollapsed ? "Team" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {!isSidebarCollapsed && <span>Team Management</span>}
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-4">
          {!isSidebarCollapsed && (
            <div className="px-2">
              <div className="text-sm font-black text-slate-900 truncate">
                {profile?.full_name || "User"}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    profile?.role === "OWNER"
                      ? "bg-indigo-100 text-indigo-700"
                      : profile?.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : profile?.role === "ACCOUNTANT"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {profile?.role || "Staff"}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all ${isSidebarCollapsed ? "justify-center px-2" : ""}`}
            title={isSidebarCollapsed ? "Sign Out" : ""}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 flex-shrink-0"
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
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          {(title || subtitle) && (
            <header className="mb-8">
              {title && (
                <h1 className="text-3xl font-black text-slate-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-slate-500 font-medium">{subtitle}</p>
              )}
            </header>
          )}

          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
