import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const PricingComponent = ({ user, subStat }) => {
  const [selectedPlan, setSelectedPlan] = useState({ name: "a plan" });
  const [loading, setLoading] = useState(false);
  const [isPlanActive, setIsPlanActive] = useState(true);
  const [shouldMakeButtonVisible, setShouldMakeButtonVisible] = useState(true);
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const plans = [
    {
      name: "Starter",
      price: 0,
      id: "",
      duration: "",
      features: [
        "Limited question generation",
        "Limited queries",
        "Table Viz only",
      ],
    },
    {
      name: "Business",
      price: 4800000,
      id: "PLN_82bljxabflmk1jf",
      duration: "yearly",
      features: [
        "Unlimited questions",
        "Unlimited queries",
        "Table Viz",
        "Chart Viz",
        "Summarization",
        "Question Search",
        "Custom Question",
        "One-One Support",
        "Fast Queries",
        "Download story",
      ],
    },
    {
      name: "WhiteLabel",
      price: 0,
      id: "PLN_82bljxabflmk1jf",
      duration: "yearly",
      features: ["Contact Sales"],
    },
  ];

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    if (subStat.subscription_type == plan || subStat.is_active == true) {
      setIsPlanActive(true);
      setShouldMakeButtonVisible(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a plan");
      return;
    }
    if (selectedPlan.name !== "Starter" && !user) {
      alert("Please sign in to subscribe to a paid plan");
      return;
    }
    if (selectedPlan.name === "WhiteLabel") {
      navigate("/feedback");
      return;
    }
    if (selectedPlan.name === "Business") {
      navigate("/payment", {
        state: { plan: selectedPlan, user_id: user.id },
      });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">
        {isPlanActive
          ? `You are on ${subStat.subscription_type} Plan`
          : "Choose a Plan"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-6 border rounded-md ${
              selectedPlan?.name === plan.name
                ? "border-indigo-600"
                : "border-gray-300"
            }`}
            onClick={() => handleSelectPlan(plan)}
          >
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-small font-bold">{plan.price} NGN/month</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-sm">
                  - {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {shouldMakeButtonVisible && selectedPlan.name !== "Starter" && (
        <button
          onClick={handlePayment}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 focus:outline-none"
          disabled={loading}
        >
          {selectedPlan ? `Subscribe to ${selectedPlan.name}` : "Subscribe"}
        </button>
      )}
    </div>
  );
};

export default PricingComponent;
