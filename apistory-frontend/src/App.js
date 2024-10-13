import React, { useState } from "react";
import UploadCollection from "./components/UploadCollection";
import QuestionsList from "./components/QuestionsList";

function App() {
  const [questions, setQuestions] = useState([]);
  const [connString, setConnString] = useState();

  const questionsLoaded = questions.length > 0;

  const handleUpload = (data, connString) => {
    setQuestions(data.questions.business_questions);
    setConnString(connString);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">APIStoryAI</h1>
          <UploadCollection
            onUpload={handleUpload}
            questionsLoaded={questionsLoaded}
          />
          {questions.length > 0 && (
            <QuestionsList questions={questions} connString={connString} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
