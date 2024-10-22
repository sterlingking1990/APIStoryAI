import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UploadCollection = ({
  onUpload,
  onQuestionsGotten,
  questionCount,
  userId,
  notifySubscriptionStat,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    openAiApiKey: "",
    dbConnectionString: "",
  });
  const [userPlan, setUserPlan] = useState("Starter"); // Default plan is Starter
  const [questionsGottenSize, setQuestionsGottenSize] = useState(0);
  const maxQuestionsFreePlan = 5;
  const [isDragging, setIsDragging] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const navigate = useNavigate();

  // Function to check if the user has an active subscription
  const checkSubscriptionStatus = async () => {
    console.log("userid", userId);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/get-subscription-status/${userId}`
      );
      const response_data = response.data;
      console.log(response_data.subscription_type);

      // Set the subscription plan or fallback to 'Starter' if no active subscription
      if (response_data && response_data.is_active) {
        setUserPlan(response_data.subscription_type); // Pro or Basic
        setHasSubscription(true);
      } else {
        setUserPlan("Starter"); // Default to Starter if no active subscription
        setHasSubscription(false);
      }
      notifySubscriptionStat(response_data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      setUserPlan("Starter"); // Handle the case of failure as Starter plan
    }
  };

  // Call the checkSubscriptionStatus on component mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, [userId]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setFormVisible(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setFormVisible(true);
    }
  };

  const getQuestions = async (event) => {
    console.log(selectedFile.name);
    if (event) {
      event.preventDefault();
    }
    if (!selectedFile) {
      console.error("No file selected.");
      return;
    }

    const questionNumToGet =
      questionCount > maxQuestionsFreePlan && userPlan === "Starter"
        ? 5
        : questionCount;

    const connEnv = formData.dbConnectionString.startsWith("postgresql")
      ? "sql"
      : "mongodb";
    const newFormData = new FormData();
    newFormData.append("file", selectedFile);
    newFormData.append("openAiApiKey", formData.openAiApiKey);
    newFormData.append("connEnv", connEnv);
    newFormData.append("questionNum", questionNumToGet);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/get-questions-from-collection/",
        newFormData
      );
      console.log(response.data);
      onQuestionsGotten(
        response.data,
        formData.dbConnectionString,
        newFormData,
        selectedFile,
        formData.openAiApiKey,
        connEnv
      );
      setQuestionsGottenSize(response.data.questions.business_questions.length);
      await recordQuestionGottenToDb();
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordQuestionGottenToDb = async () => {
    try {
      const activityType = "Question"; // Since the user generated a question
      const details = `Generated ${questionsGottenSize} questions`; // Optional: add more details

      // Create the request payload
      const payload = {
        user_id: userId,
        activity_type: activityType,
        details: details,
      };

      // Make the API request to log the activity
      const response = await axios.post(
        "http://127.0.0.1:8000/record-activities/", // Your activity logging API endpoint
        payload
      );

      console.log("Activity recorded:", response.data);
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openQuestions = () => {
    navigate("/questions");
  };

  const getQuestionCount = async () => {
    const connEnv = formData.dbConnectionString.startsWith("postgresql")
      ? "sql"
      : "mongodb";
    const newFormData = new FormData();
    newFormData.append("file", selectedFile);
    newFormData.append("openAiApiKey", formData.openAiApiKey);
    newFormData.append("connEnv", connEnv);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-api-collection/",
        newFormData
      );
      console.log(response.data);
      onUpload(response.data, formData.dbConnectionString, newFormData);
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.openAiApiKey && formData.dbConnectionString) {
      setFormFilled(true);
      getQuestionCount();
    } else {
      console.error("Please fill all form fields");
    }
  };

  const openPricingPlan = () => {
    navigate("/pricing");
  };

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center justify-center w-full ${
          isDragging ? "border-blue-500 bg-blue-100" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">
              Schema file (JSON, YAML, etc.)
            </p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
      {selectedFile && (
        <div className="mt-4 text-sm text-gray-700">
          <strong>Selected File:</strong> {selectedFile.name}
          <div className="mt-4 text-sm text-gray-700">
            <strong>Total questions we could ask:</strong> {questionCount}
          </div>
        </div>
      )}

      {formVisible && (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="openAiApiKey"
              className="block text-sm font-medium text-gray-700"
            >
              OpenAI API Key:
            </label>
            <input
              type="text"
              id="openAiApiKey"
              name="openAiApiKey"
              value={formData.openAiApiKey}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="dbConnectionString"
              className="block text-sm font-medium text-gray-700"
            >
              Database Connection String:
            </label>
            <input
              type="text"
              id="dbConnectionString"
              name="dbConnectionString"
              value={formData.dbConnectionString}
              onChange={handleFormChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Configure
          </button>
        </form>
      )}

      {formFilled && (
        <>
          <button
            onClick={getQuestions}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Get Questions
          </button>

          {/* Conditional rendering for Starter plan */}
          {userPlan === "Starter" && (
            <div className="mt-4 text-sm text-red-600">
              <p>
                You are on the Starter plan, and can only get up to 5 questions.
                To get more, please{" "}
                <button
                  className="underline text-blue-600"
                  onClick={openPricingPlan}
                >
                  upgrade your plan.
                </button>
              </p>
            </div>
          )}
          {questionsGottenSize > 0 && (
            <div className="mt-4 text-sm text-red-600">
              <p>
                Questions have been generated click to access{" "}
                <button
                  className="underline text-blue-600"
                  onClick={openQuestions}
                >
                  Open Questions.
                </button>
              </p>
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="flex justify-center mt-4">
          <svg
            className="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8l4.5 4.5"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default UploadCollection;
