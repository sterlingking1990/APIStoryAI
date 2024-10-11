import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";
import UploadCollection from "./components/UploadCollection";
import QuestionsList from "./components/QuestionsList";

function App() {
  const [questions, setQuestions] = useState([]);

  // Determine if questions are loaded
  const questionsLoaded = questions.length > 0;

  const handleUpload = (data) => {
    setQuestions(data.questions.business_questions);
  };

  return (
    <div className="App">
      <h1>APIStoryAI</h1>
      <UploadCollection
        onUpload={handleUpload}
        questionsLoaded={questionsLoaded}
      />
      {questions.length > 0 && <QuestionsList questions={questions} />}
    </div>
  );
}

export default App;
