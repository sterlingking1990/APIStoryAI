// NumberIndicator.js
import React from 'react';

function NumberIndicator({ result }) {
    // Assuming result is a single value or the first value from queryResult for the indicator
    const value = result ? result[0] : null;

    return (
        <div>
            <h4>Number Indicator</h4>
            {value ? (
                <div style={{ fontSize: '2em', color: '#4CAF50' }}>
                    {Object.values(value)[0]} {/* Display the first value in the object */}
                </div>
            ) : (
                <p>No data available for indicator</p>
            )}
        </div>
    );
}

export default NumberIndicator;
