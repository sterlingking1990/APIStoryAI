import React, { useState } from "react";
import axios from "axios";

const UploadCollection = ({ onUpload, questionsLoaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
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
      return; // Prevent execution if no file is selected
    }

    var connEnv = "";
    if (formData["dbConnectionString"].startsWith("postgresql")) {
      connEnv = "sql";
    } else {
      connEnv = "mongodb";
    }
    const newFormData = new FormData();
    newFormData.append("file", selectedFile);
    // Append the OpenAI API key and connection environment string
    newFormData.append("openAiApiKey", formData["openAiApiKey"]);
    newFormData.append("connEnv", connEnv); // Replace connEnv with the actual value if needed

    console.log(selectedFile);
    console.log(formData["openAiApiKey"]);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-api-collection/",
        newFormData
      );
      console.log(response.data);
      onUpload(response.data, formData[1]);
    } catch (error) {
      console.error("Error uploading the file", error);
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
      setFormFilled(true); // Enable the button when the form is filled
    } else {
      console.error("Please fill all form fields");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {/* Form Visible After File Upload */}
      {formVisible && (
        <form onSubmit={handleFormSubmit}>
          <div>
            <label>OpenAI API Key:</label>
            <input
              type="text"
              name="openAiApiKey"
              value={formData.openAiApiKey}
              onChange={handleFormChange}
              required
            />
          </div>
          <div>
            <label>Database Connection String:</label>
            <input
              type="text"
              name="dbConnectionString"
              value={formData.dbConnectionString}
              onChange={handleFormChange}
              required
            />
          </div>
          {/* Add more fields if needed */}
          <button type="submit">Submit Form</button>
        </form>
      )}
      {/* Button Visible After Form Submission */}
      {formFilled && (
        <button onClick={questionsLoaded ? handleUpload : handleUpload}>
          {questionsLoaded ? "Refresh Questions" : "Get Questions"}
        </button>
      )}
    </div>
  );
};

export default UploadCollection;
