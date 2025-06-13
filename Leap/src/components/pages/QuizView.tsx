import axios from "axios";
import clsx from "clsx"; // Make sure clsx is installed
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const QuizView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [k: number]: number }>({});
  const [score, setScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => {
    const quizData = location.state;
    if (!quizData) {
      navigate("/student");
      return;
    }
    setQuiz(quizData);
    fetchAttemptCount(quizData.quiz_id);
  }, [location.state, navigate]);

  const fetchAttemptCount = async (quizId: number) => {
    try {
      const studentData = localStorage.getItem("student");
      if (!studentData) return;
      const parsed = JSON.parse(studentData);
      const studentId = parsed.student_details_id_pk || parsed.student_id;
      const response = await axios.get(
        `http://localhost:8000/api/quizzes/attempt/count?quiz_id=${quizId}&student_id=${studentId}`
      );
      const count = response.data.attempt_count || 0;
      setAttemptCount(count);
    } catch (err) {
      console.error("Failed to fetch attempt count", err);
    }
  };

  const handleOptionChange = (questionId: number, optionId: number) => {
    if (score !== null || attemptCount >= 2) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quiz || attemptCount >= 2) return;
    setIsSubmitting(true);

    let totalScore = 0;
    quiz.questions.forEach((q: any) => {
      const selectedOptionId = answers[q.question_id];
      const correct = q.options.find((o: any) => o.is_correct);
      if (correct && correct.option_id === selectedOptionId) {
        totalScore += 1;
      }
    });
    setScore(totalScore);

    try {
      const studentDataRaw = localStorage.getItem("student") || "{}";
      const parsed = JSON.parse(studentDataRaw);
      const studentId = parsed.student_details_id_pk || parsed.student_id;

      const attemptType = attemptCount === 0 ? "pre" : "post";

     await axios.post("http://localhost:8000/api/quizzes/attempt", {
  student_id: studentId,
  quiz_id: quiz.quiz_id,
  attempt_type: attemptType,  // 'pre' or 'post'
  score: totalScore,  // Include score in the request
});


      await fetchAttemptCount(quiz.quiz_id);
    } catch (error) {
      console.error("Error recording attempt", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleConfirmSubmit = async () => {
    setShowConfirmPopup(false);
    await handleSubmit();
    setTimeout(() => {
      navigate("/student");
    }, 4000);
  };

  const showConfirmSubmitPopup = () => {
    setTimeout(() => {
      setShowConfirmPopup(true);
    }, 1000);
  };

  if (!quiz) {
    return <div className="p-8 text-red-600">❌ Quiz not loaded.</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold mb-2">{quiz.quiz_title}</h1>
        <p className="mb-4 text-gray-500 dark:text-gray-300">{quiz.description}</p>

        {attemptCount >= 2 && (
          <div className="text-red-600 font-semibold mb-4">
            ❌ Max 2 attempts reached. You are now in view-only mode.
          </div>
        )}

        {quiz.questions.map((q: any) => (
          <div key={q.question_id} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{q.question_text}</h2>
            <div className="space-y-2">
              {q.options.map((opt: any) => {
                const isSelected = answers[q.question_id] === opt.option_id;
                const isCorrect = opt.is_correct;
                const showFeedback = score !== null;

                const boxColor = clsx(
                  "flex items-center space-x-3 p-2 rounded-lg cursor-pointer",
                  {
                    "bg-green-200": showFeedback && isSelected && isCorrect,
                    "bg-red-200": showFeedback && isSelected && !isCorrect,
                    "bg-yellow-100": !showFeedback && isSelected,
                    "bg-gray-100 dark:bg-gray-700": !isSelected,
                  }
                );

                return (
                  <label key={opt.option_id} className={boxColor}>
                    <input
                      type="radio"
                      name={`question-${q.question_id}`}
                      checked={isSelected}
                      onChange={() =>
                        handleOptionChange(q.question_id, opt.option_id)
                      }
                      disabled={score !== null || isSubmitting || attemptCount >= 2}
                      className="accent-blue-500"
                    />
                    <span>{opt.option_text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {score === null && attemptCount < 2 && (
          <>
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="confirmSubmit"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <label htmlFor="confirmSubmit">Confirm before submitting</label>
            </div>
            <button
              onClick={showConfirmSubmitPopup}
              disabled={!confirmChecked || isSubmitting}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </>
        )}

        {score !== null && (
          <div className="mt-6 text-xl font-bold text-green-500">
          </div>
        )}
      </div>

      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Confirm Submission</h2>
            <p className="mb-6">Are you sure you want to submit the quiz?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmSubmit}
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








// import axios from "axios";
// import clsx from "clsx"; // Make sure clsx is imported
// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";

// const QuizView = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [quiz, setQuiz] = useState<any>(null);
//   const [answers, setAnswers] = useState<{ [k: number]: number }>({});
//   const [score, setScore] = useState<number | null>(null);
//   const [attemptCount, setAttemptCount] = useState<number>(0);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [maxReached, setMaxReached] = useState(false);
//   const [confirmChecked, setConfirmChecked] = useState(false);
//   const [showConfirmPopup, setShowConfirmPopup] = useState(false);

//   useEffect(() => {
//     const quizData = location.state;
//     if (!quizData) {
//       navigate("/student");
//       return;
//     }
//     setQuiz(quizData);
//     fetchAttemptCount(quizData.quiz_id);
//   }, [location.state, navigate]);

//   const fetchAttemptCount = async (quizId: number) => {
//     try {
//       const studentData = localStorage.getItem("student");
//       if (!studentData) return;
//       const parsed = JSON.parse(studentData);
//       const studentId = parsed.student_details_id_pk || parsed.student_id;
//       const response = await axios.get(
//         `http://localhost:8000/api/quizzes/attempt/count?quiz_id=${quizId}&student_id=${studentId}`
//       );
//       const count = response.data.attempt_count || 0;
//       setAttemptCount(count);
//       if (count >= 3) setMaxReached(true);
//     } catch (err) {
//       console.error("Failed to fetch attempt count", err);
//     }
//   };

//   const handleOptionChange = (questionId: number, optionId: number) => {
//     if (score !== null || maxReached) return;
//     setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
//   };

// const handleSubmit = async () => {
//   if (!quiz) return;
//   setIsSubmitting(true);

//   let totalScore = 0;
//   quiz.questions.forEach((q: any) => {
//     const selectedOptionId = answers[q.question_id];
//     const correct = q.options.find((o: any) => o.is_correct);
//     if (correct && correct.option_id === selectedOptionId) {
//       totalScore += 1;
//     }
//   });
//   setScore(totalScore);

//   try {
//     const studentDataRaw = localStorage.getItem("student") || "{}";
//     const parsed = JSON.parse(studentDataRaw);
//     const studentId = parsed.student_details_id_pk || parsed.student_id;
//     const attemptType = location.state?.attempt_type || "post";

//     // ✅ BLOCK if already 2 attempts made
//     if (attemptCount >= 2) {
//       alert("❌ You’ve already attempted this quiz twice. No more attempts allowed.");
//       return;
//     }

//     // ✅ Only insert if under 2 attempts
//     await axios.post("http://localhost:8000/api/quizzes/attempt", {
//       student_id: studentId,
//       quiz_id: quiz.quiz_id,
//       attempt_type: attemptType,
//     });

//     await fetchAttemptCount(quiz.quiz_id);
//   } catch (error) {
//     console.error("Error recording attempt", error);
//   } finally {
//     setIsSubmitting(false);
//   }
// };


//   const showConfirmSubmitPopup = () => {
//     setTimeout(() => {
//       setShowConfirmPopup(true);
//     }, 3000); // 3-sec delay before showing “Are you sure?”
//   };

//   const handleConfirmSubmit = async () => {
//     setShowConfirmPopup(false);
//     await handleSubmit();
//     setTimeout(() => {
//       navigate("/student");
//     }, 5000);
//   };

//   const getColorClass = (attemptCount: number) => {
//     const nextAttempt = attemptCount + 1; // color is based on the upcoming attempt
//     if (nextAttempt === 1) return "bg-green-100 border-green-500";   // first attempt
//     if (nextAttempt === 2) return "bg-blue-100 border-blue-500";    // second attempt
//     if (nextAttempt === 3) return "bg-purple-100 border-purple-500"; // third attempt
//     return "bg-gray-100 border-gray-300"; // If they’ve already done 3 (or more), we show a neutral/grey
//   };

//   if (!quiz) {
//     return (
//       <div className="p-8 text-red-600">
//         ❌ Quiz not loaded. Please go back and try again.
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
//       <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
//         <h1 className="text-3xl font-bold mb-2">{quiz.quiz_title}</h1>
//         <p className="mb-6 text-gray-500 dark:text-gray-300">{quiz.description}</p>

//         {maxReached && (
//           <div className="text-red-600 font-semibold mb-4">
//             ❌ Max 3 attempts reached.
//           </div>
//         )}

//         {!maxReached &&
//           quiz.questions.map((q: any) => (
//             <div key={q.question_id} className="mb-6">
//               <h2 className="text-lg font-semibold mb-2">{q.question_text}</h2>
//               <div className="space-y-2">
//                 {q.options.map((opt: any) => {
//                   const isSelected = answers[q.question_id] === opt.option_id;
//                   const isCorrect = opt.is_correct;
//                   const showFeedback = score !== null;

//                   const boxColor = clsx(
//                     "flex items-center space-x-3 p-2 rounded-lg cursor-pointer",
//                     {
//                       "bg-green-200": showFeedback && isSelected && isCorrect,
//                       "bg-red-200": showFeedback && isSelected && !isCorrect,
//                       "bg-yellow-100": !showFeedback && isSelected,
//                       "bg-gray-100 dark:bg-gray-700": !isSelected,
//                     }
//                   );

//                   return (
//                     <label key={opt.option_id} className={boxColor}>
//                       <input
//                         type="radio"
//                         name={`question-${q.question_id}`}
//                         checked={isSelected}
//                         onChange={() =>
//                           handleOptionChange(q.question_id, opt.option_id)
//                         }
//                         disabled={score !== null || isSubmitting}
//                         className="accent-blue-500"
//                       />
//                       <span>{opt.option_text}</span>
//                     </label>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}

//         {score === null && !maxReached && (
//           <>
//             <div className="flex items-center space-x-2 mt-6">
//               <input
//                 type="checkbox"
//                 id="confirmSubmit"
//                 checked={confirmChecked}
//                 onChange={(e) => setConfirmChecked(e.target.checked)}
//               />
//               <label htmlFor="confirmSubmit">Confirm before submitting</label>
//             </div>
//             <button
//               onClick={showConfirmSubmitPopup}
//               disabled={!confirmChecked || isSubmitting || maxReached}
//               className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//             >
//               {isSubmitting ? "Submitting..." : "Submit Quiz"}
//             </button>
//           </>
//         )}

//         {score !== null && (
//           <div className="mt-6 text-xl font-bold text-green-500">
//             🎉 You scored {score} out of {quiz.questions.length}.
//           </div>
//         )}
//       </div>

//       {showConfirmPopup && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center max-w-sm">
//             <h2 className="text-xl font-semibold mb-4">Confirm Submission</h2>
//             <p className="mb-6">Are you sure you want to submit the quiz?</p>
//             <div className="flex justify-center space-x-4">
//               <button
//                 onClick={handleConfirmSubmit}
//                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//               >
//                 Yes, Submit
//               </button>
//               <button
//                 onClick={() => setShowConfirmPopup(false)}
//                 className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default QuizView;








