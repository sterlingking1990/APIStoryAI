import React from "react";

const WhatIsAPIStoryAI = () => {
  return (
    <div className="space-y-8 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-extrabold text-indigo-600">
        What is APIStoryAI?
      </h1>

      {/* Why the App */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800">
          Why APIStoryAI?
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          APIStoryAI is designed to help businesses and developers easily
          understand and interact with their APIs. By allowing you to upload API
          schema, generate insightful questions, and visualize results
          dynamically, it simplifies the process of querying data from your APIs
          and databases. Whether you're a business owner looking for insights or
          a developer managing complex APIs, APIStoryAI accelerates
          decision-making and enhances your ability to work with APIs without
          needing extensive technical knowledge.
        </p>
      </section>

      {/* What is required */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800">
          What is required to use APIStoryAI?
        </h2>
        <ul className="list-disc pl-6 space-y-3 text-lg text-gray-600">
          <li>A Node.js environment to generate the API schema.</li>
          <li>
            Installation of the <code>apistoryai-generate-collection</code> Node
            package.
          </li>
          <li>
            Your OpenAI API key for generating intelligent queries based on your
            schema.
          </li>
          <li>
            A valid database connection string to execute queries over your
            business data.
          </li>
        </ul>
      </section>

      {/* How to Use APIStoryAI */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800">
          How to Use APIStoryAI
        </h2>
        <p className="text-lg italic text-gray-500">
          Ask your backend engineering team to run the below and give you the
          collection.json file
        </p>
        <ol className="list-decimal pl-6 space-y-4 text-lg text-gray-600 mt-4">
          <li>
            <strong>Install the Node package: </strong>
            <code>
              <i>
                <a
                  href="https://www.npmjs.com/package/apistoryai-generate-collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline"
                >
                  apistoryai-generate-collection
                </a>
              </i>
            </code>
            <pre className="bg-gray-100 p-3 mt-3 rounded-md">
              npm install apistoryai-generate-collection
            </pre>
          </li>
          <li>
            <strong>Run the command: </strong>
            <code className="block bg-gray-100 p-3 rounded-md mt-2">
              npx apistoryai-generate-collection path_to_your_schema_file
            </code>
            <strong>
              The command above works for schema files of any database i.e
              mongodb, postgres written in any programming language
            </strong>
          </li>
          <li>
            <strong>Generate the collection:</strong> The collection is
            generated and saved in the same project where you installed the
            package.
          </li>
          <li>
            <strong>Upload the Collection:</strong> Upload the generated
            collection file into APIStoryAI through the app interface.
          </li>
          <li>
            <strong>Set up API key and database connection:</strong> After
            uploading the collection, place your{" "}
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 underline"
            >
              OpenAI API key
            </a>{" "}
            and database connection string in the provided form.
          </li>
          <li>
            <strong>Generate business insights:</strong> APIStoryAI will
            automatically generate insightful business questions based on your
            schema. You can select any question, execute the query, and
            visualize the results dynamically.
          </li>
        </ol>
      </section>

      {/* How it benefits your business */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800">
          How APIStoryAI Can Benefit Your Business
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          APIStoryAI helps you leverage your API data for strategic
          decision-making by providing intelligent, business-relevant questions
          and answers. Whether you’re exploring user data, understanding
          customer trends, or analyzing services, APIStoryAI provides you with:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-lg text-gray-600 mt-4">
          <li>Dynamic data insights without writing complex queries.</li>
          <li>
            Faster access to business-critical information through AI-generated
            questions.
          </li>
          <li>
            Advanced data visualization, allowing you to make data-driven
            decisions effectively.
          </li>
          <li>
            A streamlined way to manage and explore your API data, enhancing
            operational efficiency.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default WhatIsAPIStoryAI;
