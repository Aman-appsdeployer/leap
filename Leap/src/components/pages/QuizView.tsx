import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>({});
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get quiz data from router state
  useEffect(() => {
    if (!location.state) {
      console.warn("No quiz data in navigation state.");
      navigate("/student");
    } else {
      setQuiz(location.state);
    }
  }, [location.state, navigate]);

  const handleOptionChange = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);

    try {
      let totalScore = 0;

      quiz.questions.forEach((q: any) => {
        const selectedOptionId = answers[q.question_id];

        const correctOption = q.options.find((opt: any) => opt.is_correct);

        if (correctOption && selectedOptionId === correctOption.option_id) {
          totalScore += 1; // ✅ Correct answer gives 1 point
        }
      });

      setScore(totalScore); // Update score
    } catch (error) {
      console.error("Error while checking answers:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="p-8 text-red-600">
        ⛔ Quiz not loaded. Please go back and try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold mb-2">{quiz.quiz_title}</h1>
        <p className="mb-6 text-gray-500 dark:text-gray-300">{quiz.description}</p>

        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((q: any, index: number) => (
            <div key={q.question_id} className="mb-6">
              <h2 className="text-lg font-semibold mb-2">
                {index + 1}. {q.question_text}
              </h2>
              <div className="space-y-2">
                {q.options.map((opt: any) => (
                  <label
                    key={opt.option_id}
                    className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${q.question_id}`}
                      value={opt.option_id}
                      checked={answers[q.question_id] === opt.option_id}
                      onChange={() => handleOptionChange(q.question_id, opt.option_id)}
                      className="accent-blue-500"
                    />
                    <span>{opt.option_text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div>No questions available for this quiz.</div>
        )}

        {score === null ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <div className="mt-6 text-xl font-bold text-green-500">
            🎉 Quiz submitted! You scored {score} points.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
