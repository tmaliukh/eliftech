import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QUESTION_TYPES = {
  TEXT: 'text',
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
};

export default function QuestionnaireBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestionnaire();
    }
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
      setTitle(data.title);
      setDescription(data.description);
      setQuestions(data.questions.map(q => ({
        id: q._id,
        type: q.type,
        text: q.text,
        options: q.options || undefined
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      type,
      text: '',
      options: type !== QUESTION_TYPES.TEXT ? [''] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  const addOption = (questionId) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, ''] }
          : q
      )
    );
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const validateQuestionnaire = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }

    if (!description.trim()) {
      setError('Description is required');
      return false;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return false;
    }

    for (const question of questions) {
      if (!question.text.trim()) {
        setError('All questions must have text');
        return false;
      }

      if (['single_choice', 'multiple_choice'].includes(question.type)) {
        if (!question.options || question.options.length === 0) {
          setError('Choice questions must have at least one option');
          return false;
        }

        if (question.options.some(opt => !opt.trim())) {
          setError('All options must have text');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateQuestionnaire()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = id 
        ? `${import.meta.env.VITE_API_URL}/api/questionnaires/${id}`
        : `${import.meta.env.VITE_API_URL}/api/questionnaires`;
      
      const method = id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          questions: questions.map(q => ({
            type: q.type,
            text: q.text.trim(),
            options: q.type !== QUESTION_TYPES.TEXT ? q.options.map(opt => opt.trim()) : undefined
          }))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save questionnaire');
      }

      const data = await response.json();
      navigate(`/run/${data._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {id ? 'Edit Questionnaire' : 'Create Questionnaire'}
        </h1>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="mt-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900 p-[5px]"
            required
          />
        </div>
        <div className="mt-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900 p-[5px]"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => addQuestion(QUESTION_TYPES.TEXT)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600"
          >
            Add Text Question
          </button>
          <button
            type="button"
            onClick={() => addQuestion(QUESTION_TYPES.SINGLE_CHOICE)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600"
          >
            Add Single Choice
          </button>
          <button
            type="button"
            onClick={() => addQuestion(QUESTION_TYPES.MULTIPLE_CHOICE)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600"
          >
            Add Multiple Choice
          </button>
        </div>

        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white shadow rounded-lg p-4 space-y-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">
                Question {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="text-red-600 hover:text-red-800 border border-gray-300 "
              >
                Remove
              </button>
            </div>

            <div>
              <label
                htmlFor={`question-${question.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Question Text
              </label>
              <input
                type="text"
                id={`question-${question.id}`}
                value={question.text}
                onChange={(e) =>
                  updateQuestion(question.id, 'text', e.target.value)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900 p-[5px]"
                required
              />
            </div>

            {question.type !== QUESTION_TYPES.TEXT && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        updateOption(question.id, optionIndex, e.target.value)
                      }
                      className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white text-gray-900 p-[5px]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(question.id, 'options', [
                          ...question.options.slice(0, optionIndex),
                          ...question.options.slice(optionIndex + 1),
                        ])
                      }
                      className="text-red-600 hover:text-red-800 border border-gray-300 "
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(question.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  Add Option
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : id ? 'Update Questionnaire' : 'Save Questionnaire'}
        </button>
      </div>
    </form>
  );
} 