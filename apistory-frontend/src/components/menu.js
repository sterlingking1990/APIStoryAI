import React from "react";
import { Link } from "react-router-dom";

function Menu() {
  return (
    <nav className="bg-white shadow-lg rounded-lg p-4 mb-8">
      <ul className="flex justify-around flex-wrap">
        <li className="px-3 py-2">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Upload Collection
          </Link>
        </li>
        <li className="px-3 py-2">
          <Link
            to="/questions"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Questions
          </Link>
        </li>
        <li className="px-3 py-2">
          <Link
            to="/about"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            About
          </Link>
        </li>
        <li className="px-3 py-2">
          <Link
            to="/pricing"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Pricing
          </Link>
        </li>
        <li className="px-3 py-2">
          <Link
            to="/feedback"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Send Feedback
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;
