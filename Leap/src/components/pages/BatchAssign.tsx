import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";

interface Option {
  label: string;
  value: number;
}

const BatchAssign: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<Option | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Option | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // For modal popup
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedBatch || !selectedQuiz) {
      alert("⚠️ Please select both a Batch and a Quiz.");
      return;
    }

    const payload = {
      batch_id: selectedBatch.value,
      quiz_id: selectedQuiz.value,
    };

    setIsSubmitting(true);

    try {
      await axios.post("/api/quizzes/assign-quiz-to-batch", payload);
      setShowModal(true); // Show the success modal

      // Wait for 5 seconds after user clicks "OK"
      setTimeout(() => {
        navigate(-1); // Navigate back to the previous page
      }, 5000);

    } catch (error) {
      alert("❌ Failed to assign quiz.");
      console.error("Assignment Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch batches asynchronously
  const loadBatches = async (inputValue: string) => {
    try {
      const res = await axios.get("/api/batches/batches");
      setBatchError(null);
      return res.data.map((batch: Option) => ({
        label: batch.label,
        value: batch.value,
      }));
    } catch (error) {
      setBatchError("❌ Failed to load batches. Please try again.");
      console.error("Error fetching batches:", error);
      return [];
    }
  };

  // Fetch quizzes asynchronously
  const loadQuizzes = async (inputValue: string) => {
    try {
      const res = await axios.get("/api/quizzes/");
      setQuizError(null);
      return res.data.map((quiz: any) => ({
        label: quiz.quiz_title,  // ✅ displays actual quiz title
        value: quiz.quiz_id,     // ✅ uses the quiz ID
      }));
    } catch (error) {
      setQuizError("❌ Failed to load quizzes. Please try again.");
      console.error("Error fetching quizzes:", error);
      return [];
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

      {/* Error messages */}
      {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
      {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Batch selector */}
        <AsyncSelect
          cacheOptions
          loadOptions={loadBatches}
          onChange={(val) => {
            setSelectedBatch(val as Option);
            setSelectedQuiz(null);
          }}
          value={selectedBatch}
          placeholder="Select Batch"
          defaultOptions
        />

        {/* Quiz selector */}
        <AsyncSelect
          cacheOptions
          loadOptions={loadQuizzes}
          onChange={(val) => setSelectedQuiz(val as Option)}
          value={selectedQuiz}
          placeholder="Select Quiz"
          defaultOptions
          isDisabled={!selectedBatch}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedBatch || !selectedQuiz}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
      </button>

      {/* Success Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-2xl font-semibold text-green-600">✅ Quiz Assigned Successfully!</h3>
            <p className="mt-4 text-gray-700">The quiz has been successfully assigned to the batch..</p>
            <button
              onClick={() => setShowModal(false)} // Close the modal
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAssign;



// import axios from "axios";
// import React, { useState } from "react";
// import AsyncSelect from "react-select/async";

// interface Option {
//   label: string;
//   value: number;
// }

// const BatchAssign: React.FC = () => {
//   const [selectedBatch, setSelectedBatch] = useState<Option | null>(null);
//   const [selectedQuiz, setSelectedQuiz] = useState<Option | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [batchError, setBatchError] = useState<string | null>(null);
//   const [quizError, setQuizError] = useState<string | null>(null);

//   // Handle form submission
//   const handleSubmit = async () => {
//     if (!selectedBatch || !selectedQuiz) {
//       alert("⚠️ Please select both a Batch and a Quiz.");
//       return;
//     }

//     const payload = {
//       batch_id: selectedBatch.value,
//       quiz_id: selectedQuiz.value,
//     };

//     setIsSubmitting(true);

//     try {
//       await axios.post("/api/quizzes/assign-quiz-to-batch", payload);
//       alert("✅ Quiz assigned to batch successfully!");
//     } catch (error) {
//       alert("❌ Failed to assign quiz.");
//       console.error("Assignment Error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Fetch batches asynchronously
//   const loadBatches = async (inputValue: string) => {
//     try {
//       const res = await axios.get("/api/batches/batches");
//       setBatchError(null);
//       return res.data.map((batch: Option) => ({
//         label: batch.label,
//         value: batch.value,
//       }));
//     } catch (error) {
//       setBatchError("❌ Failed to load batches. Please try again.");
//       console.error("Error fetching batches:", error);
//       return [];
//     }
//   };

//   // Fetch quizzes asynchronously
// const loadQuizzes = async (inputValue: string) => {
//   try {
//     const res = await axios.get("/api/quizzes/");
//     setQuizError(null);
//     return res.data.map((quiz: any) => ({
//       label: quiz.quiz_title,  // ✅ displays actual quiz title
//       value: quiz.quiz_id      // ✅ uses the quiz ID
//     }));
//   } catch (error) {
//     setQuizError("❌ Failed to load quizzes. Please try again.");
//     console.error("Error fetching quizzes:", error);
//     return [];
//   }
// };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

//       {/* Error messages */}
//       {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
//       {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         {/* Batch selector */}
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadBatches}
//           onChange={(val) => {
//             setSelectedBatch(val as Option);
//             setSelectedQuiz(null);
//           }}
//           value={selectedBatch}
//           placeholder="Select Batch"
//           defaultOptions
//         />

//         {/* Quiz selector */}
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadQuizzes}
//           onChange={(val) => setSelectedQuiz(val as Option)}
//           value={selectedQuiz}
//           placeholder="Select Quiz"
//           defaultOptions
//           isDisabled={!selectedBatch}
//         />
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting || !selectedBatch || !selectedQuiz}
//         className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//       >
//         {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
//       </button>
//     </div>
//   );
// };

// export default BatchAssign;
