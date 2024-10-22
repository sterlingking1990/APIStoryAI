import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { FaDownload } from "react-icons/fa";
import { Chart, registerables } from "chart.js";

import NumberIndicator from "./viz/NumberIndicator";

Chart.register(...registerables);

function QuestionsList({
  questions,
  connString,
  refreshQuestions,
  isLoading,
  file,
  openAIKey,
  connEnv,
  userId,
  subStat,
}) {
  const visualizationTypes = [
    {
      visualization_type: "",
      labels: [],
      values: [],
    },
  ];
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [userInputs, setUserInputs] = useState({});
  const [queryResult, setQueryResult] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState(questions);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);
  const [chartType, setChartType] = useState("");
  const [chartLabels, setChartLabels] = useState([]);
  const [chartValues, setChartValues] = useState([]);
  const [visualization, setVisualization] = useState(visualizationTypes);
  const [chartInstance, setChartInstance] = useState(null);

  const navigate = useNavigate();

  const chartTypes = [
    {
      chart: "bar",
      style: "bg-blue-300 text-blue-700 hover:bg-blue-400 focus:ring-blue-500",
    },
    {
      chart: "pie",
      style:
        "bg-green-300 text-green-700 hover:bg-green-400 focus:ring-green-500",
    },
    {
      chart: "line",
      style: "bg-red-300 text-red-700 hover:bg-red-400 focus:ring-red-500",
    },
    {
      chart: "scatter",
      style:
        "bg-purple-300 text-purple-700 hover:bg-purple-400 focus:ring-purple-500",
    },
    {
      chart: "histogram",
      style:
        "bg-purple-300 text-purple-700 hover:bg-purple-400 focus:ring-purple-500",
    },
    {
      chart: "doughnut",
      style: "bg-red-300 text-red-700 hover:bg-red-400 focus:ring-red-500",
    },
    {
      chart: "polarArea",
      style:
        "bg-green-300 text-green-700 hover:bg-green-400 focus:ring-green-500",
    },
    {
      chart: "radar",
      style: "bg-blue-300 text-blue-700 hover:bg-blue-400 focus:ring-blue-500",
    },
    {
      chart: "bubble",
      style: "bg-red-300 text-red-700 hover:bg-red-400 focus:ring-red-500",
    },
  ];

  useEffect(() => {
    setFilteredQuestions(questions);
  }, [questions]);

  useEffect(() => {
    setSubscriptionStatus(subStat.is_active);
  }, [subStat]);

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setUserInputs({});
    setQueryResult(null);
    setShowGraph(false);
    setSummary(null);
    setShowSummary(false);
  };

  const handleInputChange = (event, param) => {
    setUserInputs({
      ...userInputs,
      [param]: event.target.value,
    });
  };

  const includesIgnoreCase = (arr, search) => {
    // Check if arr is actually an array
    if (!Array.isArray(arr)) {
      console.error("Expected an array, but got:", arr);
      return false; // Return false or handle it differently based on your logic
    }

    // Proceed with the .some() method only if arr is an array
    return arr.some((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  };

  const executeQuery = async (event) => {
    event.preventDefault();
    setLoading(true);
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
      await recordExecuteQueryToDb();
      await fetchSummary(response.data.result);
      await fetchVisualization(response.data.result);
    } catch (error) {
      console.error("Error executing the query", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (result) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/summarize-query",
        {
          queryResult: result,
          question: selectedQuestion.question,
          aiKey: openAIKey,
        }
      );
      console.log(response.data);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const fetchVisualization = async (result) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/generate-visualization",
        {
          queryResult: result,
          aiKey: openAIKey,
        }
      );
      console.log(response.data);
      setVisualization([
        {
          visualization_type: response.data.chart_type,
          labels: response.data.labels,
          values: response.data.values,
        },
      ]);
    } catch (error) {
      console.error("Error fetching visualization:", error);
    }
  };

  const recordExecuteQueryToDb = async () => {
    try {
      const activityType = "Query"; // Since the user generated a question
      const details = `Executed Query for Question ${selectedQuestion.question}`; // Optional: add more details

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

  const registerShowGraph = async () => {
    setShowGraph(true);
    await recordShowGraphRequestToDb();
  };

  const recordShowGraphRequestToDb = async () => {
    try {
      const activityType = "Visualization"; // Since the user generated a question
      const details = `Viewed visualization for query response`; // Optional: add more details

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

  const handleSearch = (event) => {
    setShowGraph(false);
    const searchTerm = event.target.value;
    setSearchTerm(searchTerm);
    const filtered = questions.filter((question) =>
      question.question.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQuestions(filtered);
  };

  const handleRefreshQuestion = () => {
    refreshQuestions(file, openAIKey, connEnv);
  };

  const handleAnswerInstead = async (event) => {
    event.preventDefault();
    console.log(file);
    const newFormData = new FormData();
    newFormData.append("file", file);
    newFormData.append("openAiApiKey", openAIKey);
    newFormData.append("connEnv", connEnv);
    newFormData.append("searchTerm", searchTerm);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/get-sql-query",
        newFormData
      );
      console.log(response.data);
      const generatedQuery = response.data.query;
      const generatedQueryViz = response.data.visualization_suggestion;
      setSelectedQuestion({
        question: searchTerm,
        query: generatedQuery,
        query_parameter: [],
        visualization_suggestion: generatedQueryViz,
      });
      setUserInputs({});
      setQueryResult(null);
      setShowGraph(false);
      setSummary(null);
      setShowSummary(false);
    } catch (error) {
      console.error("Error generating SQL query:", error);
    }
  };

  // Download PDF function
  const downloadPDF = async () => {
    const doc = new jsPDF();

    // Add the question
    doc.setFontSize(16);
    doc.text("Question: ", 10, 10);
    doc.setFontSize(14);
    doc.text(selectedQuestion.question, 10, 20);

    // Add the query result as a table
    if (queryResult && queryResult.length > 0) {
      const tableHeaders = Object.keys(queryResult[0]);
      const tableRows = queryResult.map((row) =>
        tableHeaders.map((header) => row[header])
      );

      doc.autoTable({
        head: [tableHeaders],
        body: tableRows,
        startY: 30,
      });
    }

    // Add summary
    if (summary) {
      doc.addPage();
      doc.text("Summary", 10, 10);
      doc.setFontSize(12);
      doc.text(summary, 10, 50);
    }

    // Add chart visualization
    if (showGraph) {
      const canvas = document.getElementById("myChart");
      const chartImage = await html2canvas(canvas).then((canvas) =>
        canvas.toDataURL("image/png")
      );

      doc.addPage();
      doc.setFontSize(16);
      doc.text("Visualization", 10, 10);
      doc.addImage(chartImage, "PNG", 10, 20, 180, 100);
    }

    // Save the PDF
    doc.save("query_summary.pdf");
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

  const handleVizuationTypeClick = (vizType) => {
    const ctx = document.getElementById("myChart").getContext("2d");
    if (chartInstance) {
      chartInstance.destroy();
    }
    generateDynamicGraph(ctx, vizType);
  };

  const generateDynamicGraph = (ctx, vizType) => {
    if (queryResult && queryResult.length > 0) {
      let labels = visualization[0].labels;
      let values = visualization[0].values;

      // Adjust data structure for Bubble and Scatter charts
      let datasets = [];

      if (vizType === "bubble") {
        datasets = [
          {
            label: vizType + " Chart",
            data: values.map((val, index) => ({
              x: index, // X-axis value, could be based on index or a specific label
              y: val, // Y-axis value
              r: Math.random() * 10 + 5, // Random radius or another value for the bubble size
            })),
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)",
            borderWidth: 1,
          },
        ];
      } else if (vizType === "scatter") {
        datasets = [
          {
            label: vizType + " Chart",
            data: values.map((val, index) => ({
              x: index, // X-axis value
              y: val, // Y-axis value
            })),
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)",
            borderWidth: 1,
          },
        ];
      } else {
        // For other chart types like bar, pie, radar, etc.
        datasets = [
          {
            label: vizType + " Chart",
            data: values,
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)",
            borderWidth: 1,
          },
        ];
      }

      // Create or update the chart instance
      const newChartInstance = new Chart(ctx, {
        type: vizType,
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          scales:
            vizType !== "pie" && vizType !== "polarArea"
              ? {
                  // Pie and PolarArea don't use scales
                  y: {
                    beginAtZero: true,
                  },
                }
              : {},
        },
      });

      // Save chart instance for later destruction
      setChartInstance(newChartInstance);
    } else {
      console.log("nothing to show");
    }
  };

  return questions.length > 0 ? (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        {questions && questions.length} Questions we think you could ask
      </h3>
      {subscriptionStatus && (
        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            placeholder="Search questions or ask..."
            value={searchTerm}
            onChange={handleSearch}
            className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAnswerInstead}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Ask Instead
          </button>
        </div>
      )}
      <div className="mb-4">
        <button
          onClick={handleRefreshQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Refresh Questions
        </button>
      </div>
      <ul className="space-y-2">
        {filteredQuestions.map((q, index) => (
          <li
            key={index}
            onClick={() => handleQuestionClick(q)}
            className="cursor-pointer p-3 hover:bg-gray-100 rounded-md transition-all ease-in-out duration-150"
          >
            {q.question}
          </li>
        ))}
      </ul>
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

      {selectedQuestion && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Selected Question: {selectedQuestion.question}
          </h3>
          {subscriptionStatus && (
            <div className="flex items-center justify-end">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <FaDownload className="mr-2 inline" />
                Download as PDF
              </button>
            </div>
          )}
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
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Execute Query
            </button>
            {loading && (
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
          </form>
        </div>
      )}

      {queryResult && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">
            Query Result:
          </h4>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
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
          {subscriptionStatus &&
            visualization.length > 0 &&
            visualization[0] &&
            (visualization[0].labels.length > 0 ||
              visualization[0].values.length > 0) && (
              <div className="mt-6">
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h5 className="text-lg font-semibold mb-2">
                    Select a Visualization:{" "}
                    <strong>{visualization[0].visualization_type}</strong>{" "}
                    Recommended
                  </h5>
                  <div className="flex flex-wrap mt-2">
                    {chartTypes.map((eachVizType) => (
                      <button
                        key={eachVizType.chart}
                        onClick={() =>
                          handleVizuationTypeClick(eachVizType.chart)
                        }
                        className={`m-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                          eachVizType?.style ||
                          "bg-gray-300 text-gray-700 hover:bg-gray-400 focus:ring-gray-500"
                        }`}
                      >
                        {eachVizType.chart} Chart
                      </button>
                    ))}
                  </div>
                </div>
                {summary && (
                  <span className="px-6">
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      {showSummary ? "Hide Summary" : "View Summary"}
                    </button>
                  </span>
                )}
                {showSummary && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <h5 className="text-lg font-semibold mb-2">Summary:</h5>
                    <p>{summary}</p>
                  </div>
                )}
                <div className="mt-4">
                  <canvas id="myChart"></canvas>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center mt-8 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        No Questions Available
      </h2>
      <p className="text-gray-600">
        You haven't uploaded a collection yet. Please upload a collection to
        generate questions.
      </p>
      <button
        onClick={() => navigate("/")} // Replace with your navigation logic
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Upload Collection
      </button>
    </div>
  );
}

export default QuestionsList;
