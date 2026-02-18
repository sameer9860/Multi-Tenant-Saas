import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const plans = [
  {
    name: "FREE",
    tier: 0,
    price: "Rs 0",
    period: "Forever",
    description: "Get started with our platform",
    features: [
      "10 invoices/month",
      "1 team member",
      "Basic reporting",
      "Email support",
    ],
    buttonText: "Get Started",
  },
  {
    name: "BASIC",
    tier: 1,
    price: "Rs 2,500",
    period: "/month",
    description: "Perfect for small businesses",
    showTrialBadge: true,
    features: [
      "1000 invoices/month",
      "5 team members",
      "Advanced reporting",
      "Priority email support",
      "Custom branding",
    ],
    buttonText: "Upgrade to Basic",
  },
  {
    name: "PRO",
    tier: 2,
    price: "Rs 3,900",
    period: "/month",
    description: "For growing enterprises",
    showTrialBadge: true,
    features: [
      "Unlimited invoices",
      "Unlimited team members",
      "Advanced analytics",
      "24/7 phone support",
      "Custom integrations",
      "API access",
    ],
    buttonText: "Upgrade to Pro",
  },
];

function getTrialDaysLeft(trialEnd) {
  if (!trialEnd) return null;
  const diff = new Date(trialEnd) - new Date();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [trialInfo, setTrialInfo] = useState({
    is_trial: false,
    trial_end: null,
  });

  React.useEffect(() => {
    fetchCurrentPlan();
    fetchTrialInfo();
  }, []);

  const fetchCurrentPlan = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch("/api/accounts/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.organization.plan);
      }
    } catch (err) {
      console.error("Failed to fetch plan:", err);
    }
  };

  const fetchTrialInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch("/api/billing/usage/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTrialInfo({ is_trial: data.is_trial, trial_end: data.trial_end });
      }
    } catch (err) {
      console.error("Failed to fetch trial info:", err);
    }
  };

  const currentPlanTier = plans.find((p) => p.name === currentPlan)?.tier || 0;
  const trialDaysLeft = getTrialDaysLeft(trialInfo.trial_end);

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
          window.location.href = data.esewa_url;
          return;
        }
        alert(`✅ Successfully upgraded to ${planName} plan!`);
        setCurrentPlan(planName);
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your business. Upgrade or downgrade
            anytime.
          </p>
        </div>

        {/* Trial Banner */}
        {trialInfo.is_trial && trialDaysLeft !== null && (
          <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="font-bold text-lg">
                  🎁 Your 7-Day Free Trial is Active!
                </p>
                <p className="text-indigo-100 text-sm">
                  {trialDaysLeft > 0
                    ? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left — explore BASIC or PRO features now. No payment needed during trial.`
                    : "Your trial has ended. Upgrade to BASIC or PRO to unlock more features."}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white text-indigo-600 font-bold text-2xl rounded-lg px-5 py-2 shadow">
              {trialDaysLeft > 0 ? `${trialDaysLeft}d left` : "Expired"}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const isDisabled = plan.tier <= currentPlanTier;

            return (
              <div
                key={plan.name}
                className={`rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 ${
                  isCurrentPlan
                    ? "ring-2 ring-green-500 bg-white scale-105"
                    : "bg-white"
                }`}
              >
                {/* Trial badge on BASIC/PRO while user is on trial */}
                {plan.showTrialBadge &&
                  trialInfo.is_trial &&
                  trialDaysLeft > 0 && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 px-4 text-center font-semibold text-sm tracking-wide">
                      🎁 Try Free for {trialDaysLeft} Day
                      {trialDaysLeft !== 1 ? "s" : ""}
                    </div>
                  )}

                {/* Badge for current plan (non-trial) */}
                {isCurrentPlan && !(plan.isTrial && trialInfo.is_trial) && (
                  <div className="bg-green-500 text-white py-2 px-4 text-center font-semibold">
                    ✓ Current Plan
                  </div>
                )}

                {/* Plan Details */}
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-gray-600 text-sm mb-6">
                    {plan.description}
                  </p>

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
                    disabled={loading || isDisabled}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isDisabled
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed hidden"
                        : "bg-black text-white hover:bg-gray-800 active:scale-95"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {loading
                      ? "Processing..."
                      : isCurrentPlan
                        ? "Current Plan"
                        : plan.buttonText}
                  </button>
                  {isDisabled && !isCurrentPlan && (
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-lg font-semibold transition-all bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      Included
                    </button>
                  )}
                  {isCurrentPlan && (
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-lg font-semibold transition-all bg-green-50 text-green-600 cursor-default border border-green-200"
                    >
                      Active Plan
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
                Yes! Every new account gets a <strong>7-day free trial</strong>.
                No credit card required. After the trial, you stay on the FREE
                plan or upgrade to unlock more features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
