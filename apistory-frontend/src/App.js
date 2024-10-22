import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import UploadCollection from "./components/UploadCollection";
import QuestionsList from "./components/QuestionsList";
import Menu from "./components/menu";
import WhatIsAPIStoryAI from "./components/pages/AboutAPIStoryAI";
import PricingComponent from "./components/pages/Pricing";
import PaymentPage from "./components/pages/PaymentPage";
import FeedbackForm from "./components/pages/FeedbackForm";

import "./App.css";
import PaymentSuccessPage from "./components/pages/PaymentSuccess";

function App() {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [connString, setConnString] = useState();
  const [connEnv, setConnEnv] = useState();
  const [openAIKey, setOpenAIKey] = useState();
  const [selectedFile, setSelectedFile] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [newFormData, setNewFormData] = useState(new FormData());
  const [subStat, setSubStat] = useState();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log(storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSubscriptionStatNotification = (notifySubscriptionStat) => {
    setSubStat(notifySubscriptionStat);
  };

  const handleGoogleLoginSuccess = async (response) => {
    try {
      const decoded = jwtDecode(response.credential);
      const userProfile = {
        user_auth_id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
      };
      console.log(userProfile);
      const res = await axios.post("http://127.0.0.1:8000/auth-google-signin", {
        user_auth_id: userProfile.user_auth_id,
        name: userProfile.name,
        email: userProfile.email,
      });
      if (res.status === 200) {
        console.log(res);
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        console.error("Failed to authenticate with backend");
      }
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleGoogleLoginFailure = (error) => {
    console.error("Google Sign-In failed", error);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleUpload = (data, connString, newFormData) => {
    setQuestionCount(data.question_count);
    setConnString(connString);
    setSelectedFile(newFormData.file);
    setOpenAIKey(newFormData.openAiApiKey);
    setNewFormData(newFormData);
  };

  const handleOnQuestionsGotten = (
    data,
    connString,
    newFormData,
    selectedFile,
    openAiApiKey,
    connEnv
  ) => {
    setQuestions(data.questions.business_questions);
    setConnString(connString);
    setConnEnv(connEnv);
    setSelectedFile(selectedFile);
    setOpenAIKey(openAiApiKey);
    setNewFormData(newFormData);
  };

  const handleRefreshQuestions = async (file, openAIKey, connEnv) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/get-questions-from-collection/",
        newFormData
      );
      setQuestions(response.data.questions.business_questions);
      setConnString(connString);
      setConnEnv(connEnv);
      setSelectedFile(file);
      setOpenAIKey(openAIKey);
      setNewFormData(newFormData);
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="1002261498192-tmibs6gsj9iquetmd36bqgs3ls8tb9b5.apps.googleusercontent.com">
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-logo">
                APIStory<span className="text-ai">AI</span>
              </h1>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.name[0].toUpperCase()}
                      </div>
                      <span className="text-gray-700 text-sm font-medium">
                        {user.name}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onFailure={handleGoogleLoginFailure}
                    cookiePolicy={"single_host_origin"}
                  />
                )}
              </div>
            </div>
          </header>

          <main className="flex-grow">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <Routes>
                <Route
                  path="/"
                  element={
                    user && (
                      <UploadCollection
                        onUpload={handleUpload}
                        onQuestionsGotten={handleOnQuestionsGotten}
                        questionCount={questionCount}
                        userId={user.id}
                        notifySubscriptionStat={
                          handleSubscriptionStatNotification
                        }
                      />
                    )
                  }
                />
                <Route
                  path="/questions"
                  element={
                    user && (
                      <QuestionsList
                        questions={questions}
                        connString={connString}
                        refreshQuestions={handleRefreshQuestions}
                        isLoading={isLoading}
                        file={selectedFile}
                        openAIKey={openAIKey}
                        connEnv={connEnv}
                        userId={user.id}
                        subStat={subStat}
                      />
                    )
                  }
                />
                <Route path="/about" element={<WhatIsAPIStoryAI />} />
                <Route
                  path="/pricing"
                  element={<PricingComponent user={user} subStat={subStat} />}
                />
                <Route path="/payment" element={<PaymentPage />} />
                <Route
                  path="/paymentsuccess"
                  element={<PaymentSuccessPage />}
                />
                <Route path="/feedback" element={<FeedbackForm />} />
              </Routes>
            </div>
          </main>

          <footer className="bg-white">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <Menu />
            </div>
          </footer>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
