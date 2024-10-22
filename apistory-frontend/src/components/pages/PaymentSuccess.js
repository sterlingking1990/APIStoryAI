import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, plan, amount } = location.state || {};

  const handleNavigateHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Payment Successful!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Thank you for subscribing to APIStoryAI.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <p className="text-md text-gray-700">
              <strong>Name:</strong> {name}
            </p>
            <p className="text-md text-gray-700">
              <strong>Plan:</strong> {plan}
            </p>
            <p className="text-md text-gray-700">
              <strong>Amount Paid:</strong> {amount} Naira
            </p>
            <button
              onClick={handleNavigateHome}
              className="
              w-full
              py-2
              px-4
              bg-green-600
              text-white
              rounded-md
              shadow-md
              hover:bg-green-700
              focus:outline-none"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
