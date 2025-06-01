import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>({});
  const [score, setScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

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
          totalScore += 1;
        }
      });

      setScore(totalScore);
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
          <>
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="confirmSubmit"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <label htmlFor="confirmSubmit">
                I have reviewed all answers and want to submit
              </label>
            </div>

            <button
              onClick={() => setShowConfirmPopup(true)}
              disabled={!confirmChecked || isSubmitting}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </>
        ) : (
          <div className="mt-6 text-xl font-bold text-green-500">
            🎉 Quiz submitted! You scored {score} points.
          </div>
        )}
      </div>

      {/* ✅ Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Confirm Submission</h2>
            <p className="mb-6">Are you sure you want to submit the quiz?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={async () => {
                  setShowConfirmPopup(false);
                  await handleSubmit();
                  setTimeout(() => navigate("/student"), 2000); // ✅ Redirect after 2 seconds
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;



// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// const QuizView = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [quiz, setQuiz] = useState<any>(null);
//   const [answers, setAnswers] = useState<{ [questionId: number]: number }>({});
//   const [score, setScore] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

//   // Get quiz data from router state
//   useEffect(() => {
//     if (!location.state) {
//       console.warn("No quiz data in navigation state.");
//       navigate("/student");
//     } else {
//       setQuiz(location.state);
//     }
//   }, [location.state, navigate]);

//   const handleOptionChange = (questionId: number, optionId: number) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [questionId]: optionId,
//     }));
//   };

//   const handleSubmit = async () => {
//     if (!quiz) return;

//     setIsSubmitting(true);

//     try {
//       let totalScore = 0;

//       quiz.questions.forEach((q: any) => {
//         const selectedOptionId = answers[q.question_id];

//         const correctOption = q.options.find((opt: any) => opt.is_correct);

//         if (correctOption && selectedOptionId === correctOption.option_id) {
//           totalScore += 1; // ✅ Correct answer gives 1 point
//         }
//       });

//       setScore(totalScore); // Update score
//     } catch (error) {
//       console.error("Error while checking answers:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!quiz) {
//     return (
//       <div className="p-8 text-red-600">
//         ⛔ Quiz not loaded. Please go back and try again.
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 text-gray-900 dark:text-white">
//       <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
//         <h1 className="text-3xl font-bold mb-2">{quiz.quiz_title}</h1>
//         <p className="mb-6 text-gray-500 dark:text-gray-300">{quiz.description}</p>

//         {quiz.questions && quiz.questions.length > 0 ? (
//           quiz.questions.map((q: any, index: number) => (
//             <div key={q.question_id} className="mb-6">
//               <h2 className="text-lg font-semibold mb-2">
//                 {index + 1}. {q.question_text}
//               </h2>
//               <div className="space-y-2">
//                 {q.options.map((opt: any) => (
//                   <label
//                     key={opt.option_id}
//                     className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg cursor-pointer"
//                   >
//                     <input
//                       type="radio"
//                       name={`question-${q.question_id}`}
//                       value={opt.option_id}
//                       checked={answers[q.question_id] === opt.option_id}
//                       onChange={() => handleOptionChange(q.question_id, opt.option_id)}
//                       className="accent-blue-500"
//                     />
//                     <span>{opt.option_text}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>
//           ))
//         ) : (
//           <div>No questions available for this quiz.</div>
//         )}

//         {score === null ? (
//           <button
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? "Submitting..." : "Submit Quiz"}
//           </button>
//         ) : (
//           <div className="mt-6 text-xl font-bold text-green-500">
//             🎉 Quiz submitted! You scored {score} points.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default QuizView;
