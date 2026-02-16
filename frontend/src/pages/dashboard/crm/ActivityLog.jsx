import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";

const ActivityLog = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchActivities();
  }, [token, navigate]);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/activities/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs");
      }
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderActivityIcon = (action) => {
    if (action === "CREATED") {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      );
    }
    if (action === "STATUS_CHANGED") {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
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
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  };

  const formatNepalTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "Asia/Kathmandu",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderActivityText = (activity) => {
    if (activity.action === "CREATED") {
      return (
        <p className="text-slate-700 leading-relaxed font-medium">
          <span className="font-bold text-slate-900 border-b-2 border-indigo-100 hover:border-indigo-400 transition-colors">
            {activity.user || "System"}
          </span>{" "}
          <span className="text-slate-500">created lead</span>{" "}
          <span className="font-extrabold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md">
            {activity.lead_name || `Lead #${activity.lead}`}
          </span>
        </p>
      );
    }
    if (activity.action === "STATUS_CHANGED") {
      const statusColors = {
        NEW: "bg-blue-50 text-blue-700 border-blue-200",
        CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
        CONVERTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
        LOST: "bg-rose-50 text-rose-700 border-rose-200",
      };

      return (
        <div className="text-slate-700 leading-relaxed font-medium">
          <span className="font-bold text-slate-900 border-b-2 border-indigo-100 hover:border-indigo-400 transition-colors">
            {activity.user || "System"}
          </span>{" "}
          <span className="text-slate-500">moved</span>{" "}
          <span className="font-extrabold text-slate-900 mx-1">
            {activity.lead_name || `Lead #${activity.lead}`}
          </span>{" "}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-lg border text-xs font-bold uppercase ${statusColors[activity.old_value]}`}
            >
              {activity.old_value}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span
              className={`px-2 py-0.5 rounded-lg border text-xs font-bold uppercase ${statusColors[activity.new_value]}`}
            >
              {activity.new_value}
            </span>
          </div>
        </div>
      );
    }
    return (
      <p className="text-slate-700 font-medium">
        <span className="font-bold text-slate-900">
          {activity.user || "System"}
        </span>{" "}
        performed <span className="font-bold">{activity.action}</span> on lead{" "}
        <span className="font-bold text-indigo-600">
          {activity.lead_name || activity.lead}
        </span>
      </p>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex justify-between items-end mb-10 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Activity Audit Trail
            </h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">
              Real-time logs of every action performed in your CRM.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm hidden md:block text-slate-600 font-bold text-sm tracking-wide">
            Nepal Time (GMT+5:45)
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 border-t-transparent shadow-lg"></div>
            <p className="text-slate-400 font-bold animate-pulse">
              Fetching Logs...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border-2 border-rose-100 text-rose-700 p-8 rounded-3xl flex items-center gap-6 shadow-xl shadow-rose-100/50">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-1">Error Loading Logs</h3>
              <p className="font-medium opacity-80 text-lg">{error}</p>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-32 text-center group transition-all hover:bg-slate-50">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">
              Silent CRM
            </h2>
            <p className="text-slate-400 font-bold text-lg max-w-sm mx-auto">
              No activity logs recorded yet. Start interacting with leads to see
              history here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-300 group flex gap-6"
              >
                {/* Serial Number & Index */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-300">
                    {activities.length - index}
                  </div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2 rounded-full hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="mt-1">
                      {renderActivityIcon(activity.action)}
                    </div>
                    <div>
                      {renderActivityText(activity)}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {formatNepalTime(activity.created_at)}
                        </div>
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border border-indigo-100 px-2 py-1 rounded-lg">
                          Log ID #{activity.id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-start md:self-center">
                    <span className="text-[10px] font-black text-slate-300 border border-slate-100 rounded-full px-4 py-1.5 uppercase tracking-[0.15em] bg-white group-hover:border-slate-300 group-hover:text-slate-500 transition-colors shadow-sm">
                      {activity.action.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ActivityLog;
