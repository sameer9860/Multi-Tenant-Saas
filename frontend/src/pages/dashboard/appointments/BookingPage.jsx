import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout";
import api from "../../../services/api";
import { useCustomers } from "../../../services/hooks";

const BookingPage = ({ isEdit = false, isView = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { customers, loading: customersLoading } = useCustomers();

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    new_customer_name: "",
    new_customer_phone: "",
    new_customer_email: "",
    service: "",
    staff: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    notes: "",
    status: "SCHEDULED",
  });

  const [timeSlots, setTimeSlots] = useState([]);

  // Fetch appointment data if in edit or view mode
  useEffect(() => {
    if ((isEdit || isView) && id) {
      const fetchAppointment = async () => {
        setLoading(true);
        try {
          const data = await api.get(`/api/appointments/appointments/${id}/`);
          setForm({
            customer: data.customer,
            service: data.service,
            staff: data.staff,
            date: data.date,
            time: data.time.substring(0, 5),
            notes: data.notes || "",
            status: data.status,
          });
          setIsNewCustomer(false); // When editing, we always treat as existing
        } catch (err) {
          setError("Failed to load appointment details.");
        } finally {
          setLoading(false);
        }
      };
      fetchAppointment();
    }
  }, [isEdit, isView, id]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [servicesData, staffData] = await Promise.all([
          api.get("/api/appointments/services/"),
          api.get("/api/appointments/staff/"),
        ]);
        setServices(servicesData.results || servicesData);
        setStaff(staffData.results || staffData);
      } catch (err) {
        setError("Failed to load initial data. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch availabilities and existing appointments when staff or date changes
  const fetchAvailabilityData = useCallback(async () => {
    if (!form.staff || !form.date) return;

    setLoading(true);
    try {
      const [availData, apptsData] = await Promise.all([
        api.get("/api/appointments/staff-availability/"),
        api.get(
          `/api/appointments/appointments/?staff=${form.staff}&date=${form.date}`,
        ),
      ]);

      const allAvail = availData.results || availData;
      const dayOfWeek = new Date(form.date).getDay();
      // Adjust JS day (0-6, Sun-Sat) to Django day (0-6, Mon-Sun)
      // JS: 0=Sun, 1=Mon, ..., 6=Sat
      // Django: 0=Mon, ..., 5=Sat, 6=Sun
      const djangoDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const filteredAvail = allAvail.filter(
        (a) => a.staff === parseInt(form.staff) && a.day_of_week === djangoDay,
      );
      setAvailabilities(filteredAvail);
      const allAppts = apptsData.results || apptsData;
      const filteredAppts = allAppts.filter(
        (a) => a.staff === parseInt(form.staff) && a.date === form.date,
      );
      setExistingAppointments(filteredAppts);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoading(false);
    }
  }, [form.staff, form.date]);

  useEffect(() => {
    fetchAvailabilityData();
  }, [fetchAvailabilityData]);

  // Generate time slots based on availability and existing appointments
  useEffect(() => {
    if (availabilities.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots = [];
    availabilities.forEach((avail) => {
      let current = new Date(`1970-01-01T${avail.start_time}`);
      const end = new Date(`1970-01-01T${avail.end_time}`);
      const duration = avail.slot_duration_minutes;

      while (current < end) {
        const timeStr = current.toTimeString().substring(0, 5);

        // Check if slot is taken
        const isTaken = existingAppointments.some(
          (appt) =>
            appt.time.substring(0, 5) === timeStr &&
            appt.status !== "CANCELLED",
        );

        if (!isTaken) {
          slots.push(timeStr);
        }

        current = new Date(current.getTime() + duration * 60000);
      }
    });

    setTimeSlots(slots);
  }, [availabilities, existingAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (isNewCustomer && !form.new_customer_name) {
      alert("Please provide the new customer's name.");
      return;
    }
    if (!isNewCustomer && !form.customer) {
      alert("Please select a customer.");
      return;
    }
    if (!form.service || !form.staff || !form.date || !form.time) {
      alert("Please fill all required booking fields.");
      return;
    }

    setSubmitting(true);

    // Prepare payload
    const payload = { ...form };
    if (isNewCustomer) {
      delete payload.customer;
    } else {
      delete payload.new_customer_name;
      delete payload.new_customer_phone;
      delete payload.new_customer_email;
    }

    try {
      if (isEdit && id) {
        await api.patch(`/api/appointments/appointments/${id}/`, payload);
        alert("Appointment updated successfully!");
      } else {
        await api.post("/api/appointments/appointments/", payload);
        alert("Appointment booked successfully!");
      }
      navigate("/dashboard/appointments/list");
    } catch (err) {
      alert(err.message || "Failed to process appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isView
              ? "Appointment Details"
              : isEdit
                ? "Edit Appointment"
                : "Book an Appointment"}
          </h1>
          <p className="text-slate-500 font-medium">
            {isView
              ? "Viewing your scheduled service"
              : isEdit
                ? "Modify your appointment details"
                : "Schedule a new service with our professional staff"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-12 space-y-8">
            {(isEdit || isView) && (
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Appointment Status
                </label>
                <select
                  disabled={isView}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No-show</option>
                </select>
              </div>
            )}

            {/* Customer Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest px-1">
                  Customer Information
                </label>
                {!isEdit && !isView && (
                  <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsNewCustomer(false)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        !isNewCustomer
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-400"
                      }`}
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomer(true)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        isNewCustomer
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-400"
                      }`}
                    >
                      New Walk-in
                    </button>
                  </div>
                )}
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <input
                    placeholder="Name *"
                    required
                    className="px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                    value={form.new_customer_name}
                    onChange={(e) =>
                      setForm({ ...form, new_customer_name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Phone"
                    className="px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                    value={form.new_customer_phone}
                    onChange={(e) =>
                      setForm({ ...form, new_customer_phone: e.target.value })
                    }
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    className="px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                    value={form.new_customer_email}
                    onChange={(e) =>
                      setForm({ ...form, new_customer_email: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <select
                    required
                    value={form.customer}
                    onChange={(e) =>
                      setForm({ ...form, customer: e.target.value })
                    }
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div className="pt-4">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                Select Service
              </label>
              <select
                required
                disabled={isView}
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
              >
                <option value="">-- Choose a Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} min - Rs {s.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Staff & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-900">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Professional Staff
                </label>
                <select
                  required
                  disabled={isView}
                  value={form.staff}
                  onChange={(e) =>
                    setForm({ ...form, staff: e.target.value, time: "" })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Preferred Date
                </label>
                <input
                  required
                  disabled={isView}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value, time: "" })
                  }
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Step 3: Time Slots */}
            {form.staff && form.date && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">
                  Available Time Slots
                </label>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-100 border-t-indigo-600"></div>
                  </div>
                ) : timeSlots.length === 0 && !isView ? (
                  <div className="p-8 bg-rose-50 border-2 border-dashed border-rose-100 rounded-3xl text-center">
                    <p className="text-rose-600 font-bold">
                      No availability found for this person on the selected
                      date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {/* In View mode, we only show the selected time if not in slots, or just show the same grid but disabled */}
                    {isView ? (
                      <div className="col-span-full">
                        <span className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 inline-block">
                          {form.time}
                        </span>
                      </div>
                    ) : (
                      timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setForm({ ...form, time: slot })}
                          className={`py-3 rounded-xl font-black text-sm transition-all shadow-sm ${
                            form.time === slot
                              ? "bg-indigo-600 text-white shadow-indigo-200"
                              : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                          }`}
                        >
                          {slot}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Notes */}
            <div className="text-zinc-900">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                Special Requests or Notes
              </label>
              <textarea
                disabled={isView}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 resize-none"
                placeholder="Tell us any specific requirements..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-5 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex-1"
            >
              {isView ? "Go Back" : "Cancel"}
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={submitting || !form.time}
                className="px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex-[2]"
              >
                {submitting
                  ? "Processing..."
                  : isEdit
                    ? "Update Appointment"
                    : "Confirm Appointment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default BookingPage;
