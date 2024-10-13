import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
} from "chart.js";
import NumberIndicator from "./viz/NumberIndicator";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  LineController,
  LineElement,
  PointElement
);

function QuestionsList({ questions, connString }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userInputs, setUserInputs] = useState({});
  const [queryResult, setQueryResult] = useState(null);
  const [showGraph, setShowGraph] = useState(false);

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setUserInputs({});
    setQueryResult(null);
    setShowGraph(false);
  };

  const handleInputChange = (event, param) => {
    setUserInputs({
      ...userInputs,
      [param]: event.target.value,
    });
  };

  const includesIgnoreCase = (arr, search) => {
    return arr.some((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  };

  const executeQuery = async (event) => {
    event.preventDefault();
    const payload = {
      query: selectedQuestion.query,
      userInputs: userInputs,
      connString: connString,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/execute-query",
        payload
      );
      console.log(response.data);
      setQueryResult(response.data.result);
    } catch (error) {
      console.error("Error executing the query", error);
    }
  };

  const tableHeaders =
    queryResult && queryResult.length > 0 ? Object.keys(queryResult[0]) : [];
  const tableData =
    queryResult &&
    queryResult.map((row, index) => (
      <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
        {tableHeaders.map((header) => (
          <td
            key={header}
            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
          >
            {row[header]}
          </td>
        ))}
      </tr>
    ));

  useEffect(() => {
    if (showGraph && selectedQuestion) {
      if (
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "bar chart"
        ) ||
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "line chart"
        ) ||
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "timeline"
        )
      ) {
        const ctx = document.getElementById("myChart").getContext("2d");
        generateDynamicGraph(ctx);
      }
    }
  }, [showGraph, selectedQuestion]);

  const generateDynamicGraph = (ctx) => {
    if (queryResult && queryResult.length > 0) {
      const keys = Object.keys(queryResult[0]);
      const labels = queryResult.map((row) => row[keys[0]]);
      const values = queryResult.map((row) => parseInt(row[keys[1]], 10) || 1);

      let chartType = "bar";
      if (
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "line chart"
        )
      ) {
        chartType = "line";
      } else if (
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "timeline"
        )
      ) {
        chartType = "line";
      } else if (
        includesIgnoreCase(
          selectedQuestion.visualization_suggestion,
          "bar chart"
        )
      ) {
        chartType = "bar";
      } else if (
        includesIgnoreCase(selectedQuestion.visualization_suggestion, "pie")
      ) {
        chartType = "pie";
      }

      new Chart(ctx, {
        type: chartType,
        data: {
          labels: labels,
          datasets: [
            {
              label: keys[1],
              data: values,
              backgroundColor: "rgba(75,192,192,0.2)",
              borderColor: "rgba(75,192,192,1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    } else {
      console.log("nothing to show");
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        {questions.length} Questions we think you could ask
      </h3>
      <ul className="space-y-2">
        {questions.map((q, index) => (
          <li
            key={index}
            onClick={() => handleQuestionClick(q)}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded transition duration-150 ease-in-out"
          >
            {q.question}
          </li>
        ))}
      </ul>

      {selectedQuestion && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Selected Question: {selectedQuestion.question}
          </h3>
          <form onSubmit={executeQuery} className="space-y-4">
            {Array.isArray(selectedQuestion.query_parameter) &&
            selectedQuestion.query_parameter.length > 0
              ? selectedQuestion.query_parameter.map((param, idx) => (
                  <div key={idx} className="flex flex-col">
                    <label className="mb-1 font-medium text-gray-700">
                      Enter {param}:
                    </label>
                    <input
                      type="text"
                      value={userInputs[param] || ""}
                      onChange={(event) => handleInputChange(event, param)}
                      className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))
              : selectedQuestion.query.includes("?") && (
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-gray-700">
                      Enter {selectedQuestion.query_parameter}:
                    </label>
                    <input
                      type="text"
                      value={userInputs[selectedQuestion.query_parameter] || ""}
                      onChange={(event) =>
                        handleInputChange(
                          event,
                          selectedQuestion.query_parameter
                        )
                      }
                      className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Execute Query
            </button>
          </form>
        </div>
      )}

      {queryResult && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">
            Query Result:
          </h4>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData}
              </tbody>
            </table>
          </div>

          {includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "bar chart"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "line chart"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "timeline"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "heatmap"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "number indicator"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "number card"
          ) ||
          includesIgnoreCase(
            selectedQuestion.visualization_suggestion,
            "number"
          ) ? (
            <div className="mt-6">
              <button
                onClick={() => setShowGraph(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                View Visualization
              </button>
              {showGraph && (
                <div className="mt-4">
                  {includesIgnoreCase(
                    selectedQuestion.visualization_suggestion,
                    "number indicator"
                  ) ||
                    includesIgnoreCase(
                      selectedQuestion.visualization_suggestion,
                      "number card"
                    ) ||
                    (includesIgnoreCase(
                      selectedQuestion.visualization_suggestion,
                      "number"
                    ) && <NumberIndicator result={queryResult} />)}
                  {includesIgnoreCase(
                    selectedQuestion.visualization_suggestion,
                    "bar chart"
                  ) ||
                  includesIgnoreCase(
                    selectedQuestion.visualization_suggestion,
                    "line chart"
                  ) ||
                  includesIgnoreCase(
                    selectedQuestion.visualization_suggestion,
                    "timeline"
                  ) ? (
                    <div className="mt-4">
                      <canvas id="myChart"></canvas>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default QuestionsList;
