import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function InteractiveQuestionnaire() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startTime] = useState(Date.now());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionnaire, setQuestionnaire] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    fetchQuestionnaire();
  }, [id]);

  const fetchQuestionnaire = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/questionnaires/${id}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch questionnaire');
      }

      const data = await response.json();
      setQuestionnaire(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateAnswers = () => {
    if (!questionnaire) return false;
    
    for (const question of questionnaire.questions) {
      const answer = answers[question._id];
      
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        setValidationError(`Please answer question ${currentQuestion + 1}: ${question.text}`);
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  const handleNext = async () => {
    if (currentQuestion < questionnaire.questions.length - 1) {
      const currentQuestionData = questionnaire.questions[currentQuestion];
      const currentAnswer = answers[currentQuestionData._id];
      
      if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
        setValidationError(`Please answer question ${currentQuestion + 1}: ${currentQuestionData.text}`);
        return;
      }
      
      setValidationError(null);
      setCurrentQuestion((prev) => prev + 1);
    } else {
      if (!validateAnswers()) {
        return;
      }

      const completionTime = (Date.now() - startTime) / 1000; 
      
      try {
        const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value: Array.isArray(value) ? value : [value] 
        }));

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionnaireId: id,
            answers: formattedAnswers,
            completionTime: Math.round(completionTime),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to submit response');
        }

        navigate('/');
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answers[question._id] || ''}
            onChange={(e) => handleAnswer(question._id, e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900 p-[5px]"
            required
          />
        );
      case 'single_choice':
        return (
          <div className="mt-4 space-y-2">
            {question.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option}
                  checked={answers[question._id] === option}
                  onChange={(e) => handleAnswer(question._id, e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  required
                />
                <span className="ml-3 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'multiple_choice':
        return (
          <div className="mt-4 space-y-2">
            {question.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={answers[question._id]?.includes(option) || false}
                  onChange={(e) => {
                    const currentAnswers = answers[question._id] || [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, option]
                      : currentAnswers.filter((a) => a !== option);
                    handleAnswer(question._id, newAnswers);
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Questionnaire not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {questionnaire.title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{questionnaire.description}</p>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {questionnaire.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              Time: {Math.floor((Date.now() - startTime) / 1000)}s
            </span>
          </div>

          {validationError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">
              {questionnaire.questions[currentQuestion].text}
            </h2>
            {renderQuestion(questionnaire.questions[currentQuestion])}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600"
            >
              {currentQuestion === questionnaire.questions.length - 1
                ? 'Finish'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 