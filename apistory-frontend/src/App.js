import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";
import UploadCollection from "./components/UploadCollection";
import QuestionsList from "./components/QuestionsList";

function App() {
  const [questions, setQuestions] = useState([]);
  const [connString, setConnString] = useState();

  // Determine if questions are loaded
  const questionsLoaded = questions.length > 0;

  const handleUpload = (data, connString) => {
    setQuestions(data.questions.business_questions);
    setConnString(connString);
  };

  return (
    <div className="App">
      <h1>APIStoryAI</h1>
      <UploadCollection
        onUpload={handleUpload}
        questionsLoaded={questionsLoaded}
      />
      {questions.length > 0 && (
        <QuestionsList questions={questions} connString={connString} />
      )}
    </div>
  );
}

export default App;
