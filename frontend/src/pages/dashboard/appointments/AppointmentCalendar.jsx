import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const AppointmentCalendar = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    customerName: "",
    staffName: "",
    status: "ALL",
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch all appointments (future optimization: fetch based on current view range)
      const data = await api.get("/api/appointments/appointments/");
      setAppointments(data.results || data);
    } catch (err) {
      setError("Failed to fetch appointments.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Filter appointments based on user input
  const filteredAppointments = appointments.filter((appt) => {
    const matchesCustomer = appt.customer_name
      ?.toLowerCase()
      .includes(filters.customerName.toLowerCase());
    const matchesStaff = appt.staff_name
      ?.toLowerCase()
      .includes(filters.staffName.toLowerCase());
    const matchesStatus =
      filters.status === "ALL" || appt.status === filters.status;

    return matchesCustomer && matchesStaff && matchesStatus;
  });

  // Map backend appointments to react-big-calendar events
  const events = filteredAppointments.map((appt) => {
    // Robust date parsing using moment
    const start = moment(
      `${appt.date}T${appt.time}`,
      "YYYY-MM-DDTHH:mm:ss",
    ).toDate();
    const end = moment(start)
      .add(appt.service_duration || 30, "minutes")
      .toDate();

    return {
      id: appt.id,
      title: `${appt.customer_name} - ${appt.service_name} (${appt.staff_name})`,
      start,
      end,
      status: appt.status,
      resource: appt,
    };
  });

  const eventPropGetter = (event) => {
    let backgroundColor = "#e0f2fe"; // Default sky-100
    let color = "#0369a1"; // Default sky-700
    let borderColor = "#bae6fd"; // Default sky-200

    switch (event.status) {
      case "SCHEDULED":
        backgroundColor = "#f0f9ff";
        color = "#0284c7";
        borderColor = "#e0f2fe";
        break;
      case "COMPLETED":
        backgroundColor = "#ecfdf5";
        color = "#059669";
        borderColor = "#d1fae5";
        break;
      case "CANCELLED":
        backgroundColor = "#fff1f2";
        color = "#e11d48";
        borderColor = "#ffe4e6";
        break;
      case "NO_SHOW":
        backgroundColor = "#f8fafc";
        color = "#475569";
        borderColor = "#f1f5f9";
        break;
      default:
        break;
    }

    return {
      style: {
        backgroundColor,
        color,
        border: `1px solid ${borderColor}`,
        borderRadius: "8px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        padding: "2px 5px",
        height: "auto", // Allow month view events to show properly
      },
    };
  };

  const handleSelectEvent = (event) => {
    navigate(`/dashboard/appointments/edit/${event.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              Appointment Calendar
            </h1>
            <p className="text-slate-500 font-medium">
              Visual schedule of all bookings
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/dashboard/appointments/list")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 font-black uppercase tracking-widest rounded-2xl transition-all shadow-md"
            >
              List View
            </button>
            <button
              onClick={() => navigate("/dashboard/appointments/book")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-200"
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
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Book New
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 p-6 mb-8 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Customer Name
            </label>
            <input
              type="text"
              name="customerName"
              value={filters.customerName}
              onChange={handleFilterChange}
              placeholder="Search customer..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 font-bold transition-all outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Staff Name
            </label>
            <input
              type="text"
              name="staffName"
              value={filters.staffName}
              onChange={handleFilterChange}
              placeholder="Search staff..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 font-bold transition-all outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 font-bold transition-all outline-none appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex-1 min-h-[850px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                Loading schedule...
              </p>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "800px" }} // Fixed height for better rendering
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
              views={["month", "week", "day"]}
              step={30}
              showMultiDayTimes
              popup
              className="font-sans"
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 px-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-f0f9ff border border-e0f2fe"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Scheduled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-ecfdf5 border border-d1fae5"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-fff1f2 border border-ffe4e6"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cancelled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-f8fafc border border-f1f5f9"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              No-show
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .rbc-calendar {
          background: white;
          border-radius: 1rem;
        }
        .rbc-header {
          padding: 15px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-size: 0.75rem !important;
          color: #64748b !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .rbc-toolbar {
          margin-bottom: 2rem !important;
        }
        .rbc-toolbar button {
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 0.7rem !important;
          border: 1px solid #f1f5f9 !important;
          border-radius: 0.75rem !important;
          padding: 8px 16px !important;
          margin: 0 4px !important;
          transition: all 0.2s !important;
        }
        .rbc-toolbar button:hover {
          background: #f8fafc !important;
          color: #4f46e5 !important;
          border-color: #e0e7ff !important;
        }
        .rbc-toolbar button.rbc-active {
          background: #4f46e5 !important;
          color: white !important;
          border-color: #4f46e5 !important;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2) !important;
        }
        .rbc-month-view {
          border: none !important;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9 !important;
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #f1f5f9 !important;
        }
        .rbc-event {
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .rbc-today {
          background-color: #f8fafc !important;
        }
        .rbc-off-range-bg {
          background: #fcfcfc !important;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AppointmentCalendar;
