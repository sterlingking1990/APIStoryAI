import React, { useState } from "react";
import axios from "axios";

const UploadCollection = ({ onUpload, questionsLoaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    openAiApiKey: "",
    dbConnectionString: "",
  });

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setFormVisible(true);
  };

  const handleUpload = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (!selectedFile) {
      console.error("No file selected.");
      return;
    }

    var connEnv = formData["dbConnectionString"].startsWith("postgresql")
      ? "sql"
      : "mongodb";
    const newFormData = new FormData();
    newFormData.append("file", selectedFile);
    newFormData.append("openAiApiKey", formData["openAiApiKey"]);
    newFormData.append("connEnv", connEnv);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-api-collection/",
        newFormData
      );
      console.log(response.data);
      onUpload(response.data, formData["dbConnectionString"]);
    } catch (error) {
      console.error("Error uploading the file", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.openAiApiKey && formData.dbConnectionString) {
      setFormFilled(true);
    } else {
      console.error("Please fill all form fields");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-full">
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
        <button
          onClick={questionsLoaded ? handleUpload : handleUpload}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {questionsLoaded ? "Refresh Questions" : "Get Questions"}
        </button>
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
