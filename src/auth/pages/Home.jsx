import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Outer spinning circle */}
            <div className="w-24 h-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>

            {/* Inner static logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold transform rotate-45">
                <span className="transform -rotate-45">DX</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-blue-600 font-medium">Loading...</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600">
            Welcome to Your App
          </h1>
          <div className="flex gap-4 mt-4">
          <div className="flex gap-4 mt-4">
  <Link to="/form">
    <button className="bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium py-2 px-6 rounded-lg transition duration-300">
      Start
    </button>
  </Link>
  <Link to="/dashboard">
    <button className="bg-blue-600 text-white hover:bg-blue-700 font-medium py-2 px-6 rounded-lg transition duration-300">
      Dashboard
    </button>
  </Link>
</div>

</div>

        </div>
      )}
    </div>
  );
}

export default Home;
