import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    price: "Rs 0",
    period: "Forever",
    description: "Get started with our platform",
    features: [
      "10 invoices/month",
      "1 team member",
      "Basic reporting",
      "Email support",
    ],
    canUpgrade: false,
    buttonText: "Current Plan",
  },
  {
    name: "BASIC",
    price: "Rs 2,500",
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "1000 invoices/month",
      "5 team members",
      "Advanced reporting",
      "Priority email support",
      "Custom branding",
    ],
    canUpgrade: true,
    buttonText: "Upgrade to Basic",
  },
  {
    name: "PRO",
    price: "Rs 3,900",
    period: "/month",
    description: "For growing enterprises",
    features: [
      "Unlimited invoices",
      "Unlimited team members",
      "Advanced analytics",
      "24/7 phone support",
      "Custom integrations",
      "API access",
    ],
    canUpgrade: true,
    buttonText: "Upgrade to Pro",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("FREE");

  React.useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/accounts/profile/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.organization.plan);
      }
    } catch (err) {
      console.error("Failed to fetch plan:", err);
    }
  };

  const handleUpgrade = async (planName) => {
    if (loading) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/subscription/upgrade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planName }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_payment && data.esewa_url) {
          // Redirect to eSewa payment page
          window.location.href = data.esewa_url;
          return;
        }

        alert(`✅ Successfully upgraded to ${planName} plan!`);
        setCurrentPlan(planName);

        // Reload usage dashboard after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(`❌ Error: ${data.error || "Upgrade failed"}`);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
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

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your business. Upgrade or downgrade
            anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 ${
                plan.name === currentPlan
                  ? "ring-2 ring-green-500 bg-white scale-105"
                  : "bg-white"
              }`}
            >
              {/* Badge for current plan */}
              {plan.name === currentPlan && (
                <div className="bg-green-500 text-white py-2 px-4 text-center font-semibold">
                  ✓ Current Plan
                </div>
              )}

              {/* Plan Details */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h2>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={loading || !plan.canUpgrade}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    !plan.canUpgrade
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800 active:scale-95"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? "Processing..." : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16 bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens when I upgrade?
              </h4>
              <p className="text-gray-600">
                Your usage limits increase instantly. You get access to premium
                features immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600">
                Yes! Start with FREE plan and upgrade whenever you're ready. No
                credit card required.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
