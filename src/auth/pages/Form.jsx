import React, { useEffect, useState } from "react";
import instance, { registerUser, getCountries } from "../utils/api";
import { useNavigate } from "react-router-dom";

function Form() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const questions = [
    {
      id: 1,
      question: "What is React?",
      options: [
        "A JavaScript library for building user interfaces",
        "A programming language",
        "A database management system",
        "A server-side framework",
      ],
      correctAnswer: 0,
      type: "single-choice",
    },
    {
      id: 2,
      question: "How would you describe your experience with React hooks?",
      type: "opinion",
      placeholder: "Share your thoughts and experiences with React hooks...",
    },
    {
      id: 3,
      question: "Select all the React hooks you have used:",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useReducer",
        "useCallback",
        "useMemo",
        "useRef",
      ],
      type: "multiple-select",
    },
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [opinionText, setOpinionText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    countryCode: "+91",
    answers: [],
    score: 0,
  });

  // Contact form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryKey, setCountryKey] = useState("");

  // Fetch countries when component mounts
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await getCountries();
        setCountries(response.countries);
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Handle single option selection
  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
  };

  // Handle multiple option selection
  const handleMultipleSelect = (optionIndex) => {
    setSelectedOptions((prev) => {
      if (prev.includes(optionIndex)) {
        return prev.filter((idx) => idx !== optionIndex);
      } else {
        return [...prev, optionIndex];
      }
    });
  };

  // Handle text input for opinion questions
  const handleOpinionChange = (e) => {
    setOpinionText(e.target.value);
  };

  // Check answer and show feedback
  const handleSubmit = () => {
    const currentQ = questions[currentQuestion];

    if (currentQ.type === "single-choice") {
      if (selectedOption === null) return;

      const correct = selectedOption === currentQ.correctAnswer;
      setIsCorrect(correct);
      if (correct) {
        setScore(score + 1);
      }

      // Save answer
      setAnswers([
        ...answers,
        {
          questionId: currentQ.id,
          answer: selectedOption,
          correct: correct,
          type: "single-choice",
        },
      ]);

      setShowFeedback(true);
    } else if (currentQ.type === "opinion") {
      if (!opinionText.trim()) return;

      // Save opinion
      setAnswers([
        ...answers,
        {
          questionId: currentQ.id,
          answer: opinionText,
          type: "opinion",
        },
      ]);

      // Move to next question immediately for opinion questions
      handleNext();
    } else if (currentQ.type === "multiple-select") {
      if (selectedOptions.length === 0) return;

      // Save multi-select answers
      setAnswers([
        ...answers,
        {
          questionId: currentQ.id,
          answer: selectedOptions,
          type: "multiple-select",
        },
      ]);

      // Move to next question
      handleNext();
    }
  };

  // Move to next question after feedback
  const handleNext = () => {
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
      setSelectedOption(null);
      setSelectedOptions([]);
      setOpinionText("");
      setShowFeedback(false);
    } else {
      // Show contact form after completing all questions
      setShowContactForm(true);
    }
  };

  // Handle contact form submission
  const handleContactSubmit = async () => {
    if (name.trim() === "" || mobile.trim().length < 8) {
      alert("Please enter a valid name and mobile number.");
      return;
    }

    // Format answers to exactly match the schema
    const formattedAnswers = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);

      // For single-choice questions
      if (answer.type === "single-choice") {
        return {
          question: question.question,
          selectedAnswer: question.options[answer.answer],
          correctAnswer: question.options[question.correctAnswer],
        };
      }

      // For multiple-select questions
      if (answer.type === "multiple-select") {
        const selectedAnswers = answer.answer
          .map((idx) => question.options[idx])
          .join(", ");
        return {
          question: question.question,
          selectedAnswer: selectedAnswers,
          correctAnswer: "Multiple correct answers possible",
        };
      }

      // For opinion questions
      return {
        question: question.question,
        selectedAnswer: answer.answer,
        correctAnswer: "Opinion based answer",
      };
    });

    // Create data object that exactly matches the schema
    const formData = {
      name: name.trim(),
      mobileNumber: mobile.trim(),
      countryCode: countryCode,
      answers: formattedAnswers,
      score: score,
    };

    console.log("Sending data to backend:", formData); // For debugging

    try {
      const response = await instance.post("/api/register", formData);

      if (response.data && response.data.message === "Response saved") {
        console.log("Registration successful:", response.data);
        setShowResults(true);
        setShowContactForm(false);
      } else {
        console.error("Registration failed:", response.data);
        alert(
          response.data.message || "Failed to save response. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to save response. Please try again.";
      alert(errorMessage);
    }
  };

  // Reset quiz
  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setSelectedOptions([]);
    setOpinionText("");
    setShowResults(false);
    setShowFeedback(false);
    setScore(0);
    setAnswers([]);
    setShowContactForm(false);
    setName("");
    setMobile("");
    setCountryCode("+91");
  };

  // Format multiple select answers for display
  const formatMultiSelectAnswer = (answer, questionId) => {
    const question = questions.find((q) => q.id === questionId);
    return answer
      .map((optionIndex) => question.options[optionIndex])
      .join(", ");
  };

  // Contact form step after quiz completion
  if (showContactForm) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
        <div className="w-20 h-20 mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Almost Done!</h2>
        <p className="text-gray-600 mb-6">
          Please fill in your details to see your results.
        </p>

        <div className="w-full mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            placeholder="Enter your full name"
          />
        </div>

        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="flex">
            <select
              value={countryCode}
              onChange={(e) => {
                const selectedCountry = countries.find(
                  (country) => country.code === e.target.value
                );
                setCountryCode(e.target.value);
                setCountryKey(selectedCountry?.key || "");
              }}
              className="p-3 border-2 border-gray-200 rounded-l-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              disabled={loading}
            >
              {loading ? (
                <option value="">Loading...</option>
              ) : (
                countries.map((country) => (
                  <option key={country._id} value={country.code}>
                    {country.key} +{country.code}
                  </option>
                ))
              )}
            </select>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="flex-1 p-3 border-2 border-l-0 border-gray-200 rounded-r-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <button
          onClick={handleContactSubmit}
          disabled={name.trim() === "" || mobile.trim().length < 8}
          className={`w-full px-5 py-3 rounded-lg transition-colors font-medium ${
            name.trim() === "" || mobile.trim().length < 8
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          View Results
        </button>
      </div>
    );
  }

  // Render results screen
  if (showResults) {
    // Count only single choice questions for scoring
    const totalSingleChoice = questions.filter(
      (q) => q.type === "single-choice"
    ).length;

    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
        <div className="w-20 h-20 mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">
            {score === totalSingleChoice ? "🎉" : "📝"}
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Quiz Results</h2>

        {/* Score with Name and Number */}
        <div className="w-full mb-6 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">
                Score
              </h3>
              <div className="text-3xl font-bold text-blue-700">
                {score} / {totalSingleChoice}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {score === totalSingleChoice
                  ? "Perfect! You're a React expert!"
                  : score >= totalSingleChoice / 2
                  ? "Good job! Keep learning."
                  : "Keep practicing to improve your knowledge."}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h3 className="text-lg font-semibold mb-3 text-blue-800">
                Your Details
              </h3>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">👤</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">📱</span>
                  <span className="font-medium">
                    {countryCode} {mobile}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Display all answers */}
        <div className="w-full mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Your Responses:
          </h3>
          {answers.map((answer, index) => {
            const q = questions.find((q) => q.id === answer.questionId);
            return (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">{q?.question}</p>

                {answer.type === "opinion" && (
                  <p className="text-gray-600">{answer.answer}</p>
                )}

                {answer.type === "single-choice" && (
                  <p
                    className={`text-gray-600 ${
                      answer.correct
                        ? "text-green-600 font-medium"
                        : "text-red-600"
                    }`}
                  >
                    {q?.options[answer.answer]}
                    {answer.correct
                      ? " ✓"
                      : ` ✗ (Correct: ${q?.options[q.correctAnswer]})`}
                  </p>
                )}

                {answer.type === "multiple-select" && (
                  <div className="text-gray-600">
                    <p className="mb-2">You selected:</p>
                    <ul className="list-disc ml-6">
                      {answer.answer.map((optionIndex) => (
                        <li key={optionIndex}>{q?.options[optionIndex]}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Take Quiz Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="flex flex-col p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-gray-600">
            Score: {score}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {currentQ.question}
        </h2>
        <p className="text-sm text-gray-500">
          {currentQ.type === "single-choice"
            ? "Select the best answer from the options below"
            : currentQ.type === "multiple-select"
            ? "Select all options that apply"
            : "Share your thoughts and experience"}
        </p>
      </div>

      {/* Single choice options */}
      {currentQ.type === "single-choice" && (
        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, index) => {
            let optionClass =
              "p-4 border-2 rounded-lg cursor-pointer transition-all ";

            if (showFeedback) {
              if (index === currentQ.correctAnswer) {
                optionClass += "bg-green-50 border-green-500 text-green-700";
              } else if (
                index === selectedOption &&
                index !== currentQ.correctAnswer
              ) {
                optionClass += "bg-red-50 border-red-500 text-red-700";
              } else {
                optionClass += "border-gray-200 text-gray-500";
              }
            } else {
              optionClass +=
                selectedOption === index
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
            }

            return (
              <div
                key={index}
                className={optionClass}
                onClick={() => !showFeedback && handleOptionSelect(index)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                      showFeedback
                        ? index === currentQ.correctAnswer
                          ? "bg-green-500 text-white"
                          : index === selectedOption
                          ? "bg-red-500 text-white"
                          : "border-2 border-gray-300"
                        : selectedOption === index
                        ? "bg-blue-500 text-white"
                        : "border-2 border-gray-300"
                    }`}
                  >
                    {showFeedback
                      ? index === currentQ.correctAnswer
                        ? "✓"
                        : index === selectedOption &&
                          index !== currentQ.correctAnswer
                        ? "✗"
                        : ""
                      : selectedOption === index
                      ? "✓"
                      : ""}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multiple select options */}
      {currentQ.type === "multiple-select" && (
        <div className="space-y-3 mb-6">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedOptions.includes(index);
            let optionClass =
              "p-4 border-2 rounded-lg cursor-pointer transition-all ";

            optionClass += isSelected
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";

            return (
              <div
                key={index}
                className={optionClass}
                onClick={() => handleMultipleSelect(index)}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded mr-3 ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "border-2 border-gray-300"
                    }`}
                  >
                    {isSelected && "✓"}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opinion text input */}
      {currentQ.type === "opinion" && (
        <div className="mb-6">
          <textarea
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            rows="5"
            placeholder={currentQ.placeholder}
            value={opinionText}
            onChange={handleOpinionChange}
          ></textarea>
        </div>
      )}

      {/* Feedback message for single choice */}
      {showFeedback && currentQ.type === "single-choice" && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          <p className="font-medium">
            {isCorrect
              ? "Correct! Well done."
              : `Incorrect. The correct answer is: ${
                  currentQ.options[currentQ.correctAnswer]
                }`}
          </p>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={showFeedback ? handleNext : handleSubmit}
        disabled={
          (currentQ.type === "single-choice" &&
            selectedOption === null &&
            !showFeedback) ||
          (currentQ.type === "opinion" && !opinionText.trim()) ||
          (currentQ.type === "multiple-select" && selectedOptions.length === 0)
        }
        className={`px-5 py-3 rounded-lg transition-colors font-medium ${
          (currentQ.type === "single-choice" &&
            selectedOption === null &&
            !showFeedback) ||
          (currentQ.type === "opinion" && !opinionText.trim()) ||
          (currentQ.type === "multiple-select" && selectedOptions.length === 0)
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : showFeedback
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {showFeedback
          ? currentQuestion === questions.length - 1
            ? "Complete Quiz"
            : "Next Question"
          : currentQ.type === "single-choice"
          ? "Check Answer"
          : "Continue"}
      </button>
    </div>
  );
}

export default Form;
