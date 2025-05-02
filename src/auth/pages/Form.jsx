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
      question: "What platforms do you use to watch Media One?",
      options: [
        "Home TV",
        "YouTube",
        "Social Media",
        "eVision"
      ],
      type: "multiple-select",
    },
    {
      id: 2,
      question: "What programs do you watch on Media One?",
      options: [
        "Middle East Hour",
        "Out of focus",
        "Weekend Arabia",
        "Media Scan",
        "World with us"
      ],
      type: "multiple-select",
    },
    {
      id: 3,
      question: "Which content do you like the most?",
      options: [
        "Gulf Related",
        "General",
        "Tech",
        "Innovative",
        "Sensational"
      ],
      type: "multiple-select",
    },
    {
      id: 4,
      question: "Do you have any suggestions to improve our content?",
      type: "opinion",
      placeholder: "Share your thoughts and suggestions to help us improve...",
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

  // Reset survey
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

  // Contact form step after survey completion
  if (showContactForm) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
        <div className="w-20 h-20 mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Almost Done!</h2>
        <p className="text-gray-600 mb-6">
          Please fill in your details to complete the survey.
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
                    {country.key} {country.code}
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
          Submit Survey
        </button>
      </div>
    );
  }

  // Render survey results screen
  if (showResults) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto">
        <div className="w-20 h-20 mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Thank You!</h2>
        <p className="text-gray-600 mb-8 text-center">
          We appreciate you taking the time to complete our Media One survey. Your feedback is valuable and will help us improve our content.
        </p>

        {/* Your Details */}
        <div className="w-full mb-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">
            Your Details
          </h3>
          <div className="space-y-2">
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

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Return to Dashboard
          </button>
          <button
            onClick={handleRestart}
            className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Take Another Survey
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
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          {currentQ.question}
        </h2>
        <p className="text-sm text-gray-500">
          {currentQ.type === "multiple-select"
            ? "Select all options that apply"
            : "Share your thoughts and experience"}
        </p>
      </div>

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

      {/* Action button */}
      <button
        onClick={handleSubmit}
        disabled={
          (currentQ.type === "opinion" && !opinionText.trim()) ||
          (currentQ.type === "multiple-select" && selectedOptions.length === 0)
        }
        className={`px-5 py-3 rounded-lg transition-colors font-medium ${
          (currentQ.type === "opinion" && !opinionText.trim()) ||
          (currentQ.type === "multiple-select" && selectedOptions.length === 0)
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {currentQuestion === questions.length - 1 ? "Submit Response" : "Continue"}
      </button>
    </div>
  );
}

export default Form;