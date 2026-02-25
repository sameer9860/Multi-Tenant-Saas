import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useCustomers } from "../../services/hooks";

const CustomerList = () => {
  const navigate = useNavigate();
  const { customers, loading, error } = useCustomers();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <DashboardLayout title="Customers" subtitle="Error loading customers">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-bold">
          Error: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Customer Directory"
      subtitle="Manage your client relationships and ledgers"
    >
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            My Customers
          </h2>
          <p className="text-slate-500 font-medium">
            Total registered: {customers.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-32 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <div className="text-slate-400 font-black uppercase tracking-widest text-sm">
              Loading Customers...
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-32 text-center bg-slate-50/50">
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              No customers found
            </h3>
            <p className="text-slate-400 font-medium">
              Create your first invoice to register a customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Contact
                  </th>
                  <th className="px-8 py-6 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Registration
                  </th>
                  <th className="px-8 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-indigo-50/20 transition-all duration-300"
                  >
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100/50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-lg">
                            {customer.name}
                          </div>
                          <div className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-0.5">
                            ID: {customer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="text-sm font-bold text-slate-700 mb-1">
                        {customer.email}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="text-sm font-black text-slate-900">
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <button
                        onClick={() =>
                          navigate(`/dashboard/customers/${customer.id}`)
                        }
                        className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerList;
