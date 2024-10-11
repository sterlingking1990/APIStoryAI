import React, { useState } from 'react';
import axios from 'axios';
import {Chart} from 'chart.js';

function QuestionsList({ questions }) {
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [showGraph, setShowGraph] = useState(false);

    const handleQuestionClick = (question) => {
        setSelectedQuestion(question);
        setUserInput('');  // Reset input field
        setQueryResult(null);  // Reset query result
    };

    const handleInputChange = (event) => {
        setUserInput(event.target.value);
    };

    const executeQuery = async (event) => {
        event.preventDefault();
        const payload = {
            query: selectedQuestion.sql_query,
            userInput: userInput || ""
        };

        try {
            const response = await axios.post('http://127.0.0.1:8000/execute-query', payload);
            setQueryResult(response.data.result);  // Display the result
        } catch (error) {
            console.error('Error executing the query', error);
        }
    };

    // Determine if the query result contains numeric data for the graph
    const hasNumericData = queryResult && queryResult.some(row => 
        Object.values(row).some(value => typeof value === 'number')
    );

    // Prepare data for the table
    const tableHeaders = queryResult && queryResult.length > 0 ? Object.keys(queryResult[0]) : [];
    const tableData = queryResult && queryResult.map((row, index) => (
        <tr key={index}>
            {tableHeaders.map((header) => (
                <td key={header}>{row[header]}</td>
            ))}
        </tr>
    ));

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
                    {selectedQuestion.sql_query.includes('?') && (
                        <div>
                            <label>Enter {selectedQuestion.query_parameter}:</label>
                            <input type="text" value={userInput} onChange={handleInputChange} />
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
                </div>
            )}
        </div>
    );
}

export default QuestionsList;
