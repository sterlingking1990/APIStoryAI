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
// Register the chart types
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

function QuestionsList({ questions }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [showGraph, setShowGraph] = useState(false);

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setUserInput(""); // Reset input field
    setQueryResult(null); // Reset query result
    setShowGraph(false);
  };

  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  const executeQuery = async (event) => {
    event.preventDefault();
    const payload = {
      query: selectedQuestion.sql_query,
      userInput: userInput || "",
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/execute-query",
        payload
      );
      console.log(response.data.result);
      setQueryResult(response.data.result); // Display the result
    } catch (error) {
      console.error("Error executing the query", error);
    }
  };

  // Prepare data for the table
  const tableHeaders =
    queryResult && queryResult.length > 0 ? Object.keys(queryResult[0]) : [];
  const tableData =
    queryResult &&
    queryResult.map((row, index) => (
      <tr key={index}>
        {tableHeaders.map((header) => (
          <td key={header}>{row[header]}</td>
        ))}
      </tr>
    ));

  useEffect(() => {
    if (showGraph && selectedQuestion) {
      if (
        selectedQuestion.visualization_suggestion.includes("bar chart") ||
        selectedQuestion.visualization_suggestion.includes("line chart") ||
        selectedQuestion.visualization_suggestion.includes("timeline")
      ) {
        const ctx = document.getElementById("myChart").getContext("2d");
        generateDynamicGraph(ctx);
      }
    }
  }, [showGraph, selectedQuestion]);

  const generateDynamicGraph = (ctx) => {
    //Dynamically extract labels and data from the query result
    if (queryResult && queryResult.length > 0) {
      const keys = Object.keys(queryResult[0]);
      const labels = queryResult.map((row) => row[keys[0]]);
      const values = queryResult.map((row) => parseInt(row[keys[1]], 10) || 1);

      //Determine the type of chart e.g bar for numeric, pie for categories

      let chartType = "bar"; // Default chart type
      if (selectedQuestion.visualization_suggestion.includes("line chart")) {
        chartType = "line";
      } else if (
        selectedQuestion.visualization_suggestion.includes("timeline")
      ) {
        chartType = "line"; // Timeline is often implemented as a line chart with dates on the x-axis
      } else if (
        selectedQuestion.visualization_suggestion.includes("bar chart")
      ) {
        chartType = "bar";
      } else if (selectedQuestion.visualization_suggestion.includes("pie")) {
        chartType = "pie";
      }

      //create the chart with dynamic labels and data

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
    <div>
      <ul>
        {questions.map((q, index) => (
          <li key={index} onClick={() => handleQuestionClick(q)}>
            {q.question}
          </li>
        ))}
      </ul>

      {selectedQuestion && (
        <div>
          <h3>Selected Question: {selectedQuestion.question}</h3>
          {selectedQuestion.sql_query.includes("?") && (
            <div>
              <label>Enter {selectedQuestion.query_parameter}:</label>
              <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
              />
            </div>
          )}
          <button onClick={executeQuery}>Execute Query</button>
        </div>
      )}

      {queryResult && (
        <div>
          <h4>Query Result:</h4>

          <table border="1">
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>{tableData}</tbody>
          </table>

          {selectedQuestion.visualization_suggestion.includes("bar chart") ||
          selectedQuestion.visualization_suggestion.includes("line chart") ||
          selectedQuestion.visualization_suggestion.includes("timeline") ||
          selectedQuestion.visualization_suggestion.includes("heatmap") ||
          selectedQuestion.visualization_suggestion.includes(
            "number indicator"
          ) ||
          selectedQuestion.visualization_suggestion.includes("number card") ? (
            <>
              <button onClick={() => setShowGraph(true)}>
                View Visualization
              </button>
              {showGraph && (
                <div>
                  {selectedQuestion.visualization_suggestion.includes(
                    "number indicator"
                  ) ||
                    (selectedQuestion.visualization_suggestion.includes(
                      "number card"
                    ) && <NumberIndicator result={queryResult} />)}
                  {selectedQuestion.visualization_suggestion.includes(
                    "bar chart"
                  ) ||
                  selectedQuestion.visualization_suggestion.includes(
                    "line chart"
                  ) ||
                  selectedQuestion.visualization_suggestion.includes(
                    "timeline"
                  ) ? (
                    <div>
                      <canvas id="myChart"></canvas>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default QuestionsList;
