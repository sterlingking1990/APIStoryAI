import React, { useState } from "react";
import { PaystackButton } from "react-paystack";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, user_id } = location.state || {};
  const publicKey = "pk_test_55dbf5f233fee51557f94b1530b03474759cc10c";
  const [email, setEmail] = useState("izundukingsleyemeka@gmail.com");
  const [name, setName] = useState("Kingsley Izundu");
  const [phoneNumber, setPhoneNumber] = useState("2348060456301");

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Call the endpoint to save subscription details
      const { reference } = paymentData;
      const now = Date.now();

      // Calculate the number of milliseconds in a year (365 days)
      const oneYearLater = now + 365 * 24 * 60 * 60 * 1000;

      // Create a new Date object for one year later
      const dateOneYearLater = new Date(oneYearLater);
      console.log(user_id, plan);
      const response = await axios.post(
        "http://127.0.0.1:8000/save-subscription",
        {
          user_id: user_id,
          subscription_type: plan.name,
          subscription_amount: plan.price,
          transaction_reference: reference, // Use the captured reference here
          start_date: now,
          end_date: oneYearLater,
        }
      );
      if ((response.data.message = "Subscription Created Successfully")) {
        navigate("/paymentsuccess", {
          state: { name: name, plan: plan.name, amount: plan.price },
        });
      }
      console.log("Response Is", response);
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert(
        "Subscription successful, but there was an error saving your details. Please contact support."
      );
    }
  };

  const componentProps = {
    email,
    amount: plan.price,
    metadata: {
      name,
      phoneNumber,
    },
    publicKey,
    text: "Subscribe",
    currency: "NG",
    plan: plan.id,
    onSuccess: (paymentData) => handlePaymentSuccess(paymentData),
    onClose: () => alert("Are you sure you want to close?"),
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Subscribe to APIStoryAI {plan.name} Annual Plan
          </h1>
          <h3>You are paying - {plan.price} Naira</h3>
          <br />
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              placeholder="Full Name"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              value={email}
              placeholder="Email Address"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="tel"
              value={phoneNumber}
              placeholder="Phone Number"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {componentProps && (
              <PaystackButton
                {...componentProps}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-md hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
