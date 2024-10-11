import React, { useState } from "react";
import axios from "axios";

const UploadCollection = ({ onUpload, questionsLoaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (!selectedFile) {
      console.error("No file selected.");
      return; // Prevent execution if no file is selected
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    console.log(selectedFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload-api-collection/",
        formData
      );
      console.log(response.data);
      onUpload(response.data);
    } catch (error) {
      console.error("Error uploading the file", error);
    }
  };

  // Call handleUpload again to refresh questions
  const handleRefreshQuestions = async () => {
    await handleUpload(); // call handle upload without an eent
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={questionsLoaded ? handleRefreshQuestions : handleUpload}>
        {questionsLoaded ? "Refresh Questions" : "Get Questions"}
      </button>
    </div>
  );
};

export default UploadCollection;
