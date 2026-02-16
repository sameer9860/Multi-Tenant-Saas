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

  const renderActivityText = (activity) => {
    if (activity.action === "CREATED") {
      return (
        <span>
          created lead{" "}
          <span className="font-bold text-indigo-600">
            {activity.lead_name || `Lead #${activity.lead}`}
          </span>
        </span>
      );
    }
    if (activity.action === "STATUS_CHANGED") {
      const statusColors = {
        NEW: "text-blue-600",
        CONTACTED: "text-amber-600",
        CONVERTED: "text-emerald-600",
        LOST: "text-rose-600",
      };

      return (
        <span>
          changed status of{" "}
          <span className="font-bold">
            {activity.lead_name || `Lead #${activity.lead}`}
          </span>{" "}
          from{" "}
          <span className={`font-semibold ${statusColors[activity.old_value]}`}>
            {activity.old_value}
          </span>{" "}
          →{" "}
          <span className={`font-semibold ${statusColors[activity.new_value]}`}>
            {activity.new_value}
          </span>
        </span>
      );
    }
    return (
      <span>
        performed {activity.action} on lead{" "}
        {activity.lead_name || activity.lead}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Lead Activity Log
          </h1>
          <p className="text-slate-500">
            Track all actions and status changes across your CRM.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">
            {error}
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center text-slate-400">
            No activity logs found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                      {activity.user ? activity.user.substring(0, 2) : "SY"}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900">
                          {activity.user || "System"}
                        </span>{" "}
                        {renderActivityText(activity)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">
                    {activity.action.replace("_", " ")}
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
