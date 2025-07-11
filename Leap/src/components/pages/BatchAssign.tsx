import endpoints from "@/api/endpoints";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";

interface Option {
  label: string;
  value: number;
}

interface AssignedQuiz {
  quiz_id: number;
  quiz_title: string;
  description?: string;
  start_time?: string;
}

const BatchAssign: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<Option | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Option | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignedQuizzes, setAssignedQuizzes] = useState<AssignedQuiz[]>([]);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedBatch || !selectedQuiz) {
      alert(" Please select both a Batch and a Quiz.");
      return;
    }

    const alreadyAssigned = assignedQuizzes.some(
      (q) => q.quiz_id === selectedQuiz.value
    );
    if (alreadyAssigned) {
      alert(" This quiz has already been assigned to the selected batch.");
      return;
    }

    const payload = {
      batch_id: selectedBatch.value,
      quiz_id: selectedQuiz.value,
    };

    setIsSubmitting(true);

    try {
      await axios.post(endpoints.quizzes.assignToBatch, payload);
      setShowModal(true);
      fetchAssignedQuizzes(selectedBatch.value);
      setTimeout(() => navigate(-1), 5000);
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert(" Quiz is already assigned to this batch.");
      } else {
        alert(" Failed to assign quiz.");
      }
      console.error("Assignment Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadBatches = async (inputValue: string) => {
    try {
      const res = await axios.get(endpoints.batches.all);
      setBatchError(null);
      const allBatches = res.data.map((batch: any) => ({
        label: `${batch.label} (${batch.school_name})`,
        value: batch.value,
      }));

      if (!inputValue) return allBatches;

      return allBatches.filter((b: Option) =>
        b.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    } catch (error) {
      setBatchError(" Failed to load batches.");
      console.error("Error fetching batches:", error);
      return [];
    }
  };

  const loadQuizzes = async (inputValue: string) => {
    try {
      const res = await axios.get(endpoints.quizzes.getAll);
      setQuizError(null);
      const allQuizzes = res.data.map((quiz: any) => ({
        label: quiz.quiz_title,
        value: quiz.quiz_id,
      }));

      if (!inputValue) return allQuizzes;

      return allQuizzes.filter((q: Option) =>
        q.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    } catch (error) {
      setQuizError(" Failed to load quizzes.");
      console.error("Error fetching quizzes:", error);
      return [];
    }
  };

  const fetchAssignedQuizzes = async (batchId: number) => {
    try {
      const res = await axios.get(
        `${endpoints.quizzes.assignToBatch}/batch/${batchId}`
      );
      setAssignedQuizzes(res.data || []);
    } catch (error) {
      console.error("Failed to fetch assigned quizzes:", error);
    }
  };

  useEffect(() => {
    if (selectedBatch) {
      fetchAssignedQuizzes(selectedBatch.value);
    }
  }, [selectedBatch]);

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="mr-1" size={18} />
<<<<<<< HEAD
          Back
=======
>>>>>>> b74972c9 (main chla leave per)
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

      {/* Error messages */}
      {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
      {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          className="text-black "
        />

        <AsyncSelect
          cacheOptions
          loadOptions={loadQuizzes}
          onChange={(val) => setSelectedQuiz(val as Option)}
          value={selectedQuiz}
          placeholder="Select Quiz"
          defaultOptions
          isDisabled={!selectedBatch}
          className="text-black "
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedBatch || !selectedQuiz}
        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
      </button>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
            <h3 className="text-2xl font-semibold text-green-600">
              Quiz Assigned Successfully!
            </h3>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              The quiz has been successfully assigned to the batch.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* 📋 Assigned Quizzes */}
      {assignedQuizzes.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Assigned Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedQuizzes.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="p-4 rounded-lg border shadow-md bg-white dark:bg-gray-800
                   transform transition-transform duration-300 ease-in-out
                   hover:scale-105 hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold text-blue-900 dark:text-blue-400 mb-2">
                  {quiz.quiz_title}
                </h3>

                <p className="text-xl text-red-500 dark:text-gray-300 mb-1">
                  {quiz.description || "No description available."}
                </p>

                {/* <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Quiz ID: {quiz.quiz_id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Batch ID: {selectedBatch ? selectedBatch.value : "N/A"}
                </p> */}

                <p className="text-xs text-pink-500 dark:text-gray-400">
                  Created on:{" "}
                  {quiz.start_time
                    ? new Date(quiz.start_time).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div> 
      )}
    </div>
  );
};

export default BatchAssign;




<<<<<<< HEAD
// import endpoints from "@/api/endpoints";
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AsyncSelect from "react-select/async";
=======
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
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
//   const [showModal, setShowModal] = useState(false);

//   const navigate = useNavigate();

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
//       setShowModal(true);

//       // Auto-navigate after 5 seconds
//       setTimeout(() => {
//         navigate(-1);
//       }, 5000);
//     } catch (error) {
//       alert("❌ Failed to assign quiz.");
//       console.error("Assignment Error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const loadBatches = async (inputValue: string) => {
//     try {
//       const res = await axios.get("/api/batches/batches");
//       setBatchError(null);
//       return res.data.map((batch: Option) => ({
//         label: batch.label,
//         value: batch.value,
//       }));
//     } catch (error) {
//       setBatchError("❌ Failed to load batches.");
//       console.error("Error fetching batches:", error);
//       return [];
//     }
//   };

//   const loadQuizzes = async (inputValue: string) => {
//     try {
//       const res = await axios.get("/api/quizzes/");
//       setQuizError(null);
//       return res.data.map((quiz: any) => ({
//         label: quiz.quiz_title,
//         value: quiz.quiz_id,
//       }));
//     } catch (error) {
//       setQuizError("❌ Failed to load quizzes.");
//       console.error("Error fetching quizzes:", error);
//       return [];
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//       {/* 🔙 Back Icon */}
//       <div className="mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
//         >
//           <ArrowLeft className="mr-1" size={18} />
        
//         </button>
//       </div>

//       <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

//       {/* Error messages */}
//       {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
//       {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
//           className="text-black dark:text-white"
//         />

//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadQuizzes}
//           onChange={(val) => setSelectedQuiz(val as Option)}
//           value={selectedQuiz}
//           placeholder="Select Quiz"
//           defaultOptions
//           isDisabled={!selectedBatch}
//           className="text-black dark:text-white"
//         />
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting || !selectedBatch || !selectedQuiz}
//         className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//       >
//         {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
//       </button>

//       {/* ✅ Success Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
//             <h3 className="text-2xl font-semibold text-green-600">
//               ✅ Quiz Assigned Successfully!
//             </h3>
//             <p className="mt-4 text-gray-700 dark:text-gray-300">
//               The quiz has been successfully assigned to the batch.
//             </p>
//             <button
//               onClick={() => setShowModal(false)}
//               className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BatchAssign;




>>>>>>> b74972c9 (main chla leave per)

// interface Option {
//   label: string;
//   value: number;
// }

// interface AssignedQuiz {
//   quiz_id: number;
//   quiz_title: string;
// }

// const BatchAssign: React.FC = () => {
//   const [selectedBatch, setSelectedBatch] = useState<Option | null>(null);
//   const [selectedQuiz, setSelectedQuiz] = useState<Option | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [batchError, setBatchError] = useState<string | null>(null);
//   const [quizError, setQuizError] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [assignedQuizzes, setAssignedQuizzes] = useState<AssignedQuiz[]>([]);

//   const navigate = useNavigate();

//   const handleSubmit = async () => {
//     if (!selectedBatch || !selectedQuiz) {
//       alert(" Please select both a Batch and a Quiz.");
//       return;
//     }

//     const alreadyAssigned = assignedQuizzes.some(
//       (q) => q.quiz_id === selectedQuiz.value
//     );
//     if (alreadyAssigned) {
//       alert(" This quiz has already been assigned to the selected batch.");
//       return;
//     }

//     const payload = {
//       batch_id: selectedBatch.value,
//       quiz_id: selectedQuiz.value,
//     };

//     setIsSubmitting(true);

//     try {
//       await axios.post(endpoints.quizzes.assignToBatch, payload);
//       setShowModal(true);
//       fetchAssignedQuizzes(selectedBatch.value);
//       setTimeout(() => navigate(-1), 5000);
//     } catch (error: any) {
//       if (error.response?.status === 409) {
//         alert(" Quiz is already assigned to this batch.");
//       } else {
//         alert(" Failed to assign quiz.");
//       }
//       console.error("Assignment Error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const loadBatches = async (inputValue: string) => {
//     try {
//       const res = await axios.get(endpoints.batches.all);
//       setBatchError(null);
//       const allBatches = res.data.map((batch: any) => ({
//         label: `${batch.label} (${batch.school_name})`,
//         value: batch.value,
//       }));

//       if (!inputValue) return allBatches;

//       return allBatches.filter((b: Option) =>
//         b.label.toLowerCase().includes(inputValue.toLowerCase())
//       );
//     } catch (error) {
//       setBatchError(" Failed to load batches.");
//       console.error("Error fetching batches:", error);
//       return [];
//     }
//   };

//   const loadQuizzes = async (inputValue: string) => {
//     try {
//       const res = await axios.get(endpoints.quizzes.getAll);
//       setQuizError(null);
//       const allQuizzes = res.data.map((quiz: any) => ({
//         label: quiz.quiz_title,
//         value: quiz.quiz_id,
//       }));

//       if (!inputValue) return allQuizzes;

//       return allQuizzes.filter((q: Option) =>
//         q.label.toLowerCase().includes(inputValue.toLowerCase())
//       );
//     } catch (error) {
//       setQuizError(" Failed to load quizzes.");
//       console.error("Error fetching quizzes:", error);
//       return [];
//     }
//   };

//   const fetchAssignedQuizzes = async (batchId: number) => {
//     try {
//       const res = await axios.get(
//         `${endpoints.quizzes.assignToBatch}/batch/${batchId}`
//       );
//       setAssignedQuizzes(res.data || []);
//     } catch (error) {
//       console.error("Failed to fetch assigned quizzes:", error);
//     }
//   };

//   useEffect(() => {
//     if (selectedBatch) {
//       fetchAssignedQuizzes(selectedBatch.value);
//     }
//   }, [selectedBatch]);

//   return (
//     <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//       {/*  Back Icon */}
//       <div className="mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
//         >
//           <ArrowLeft className="mr-1" size={18} />
//           Back
//         </button>
//       </div>

//       <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

//       {/* Error messages */}
//       {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
//       {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
//           className="text-black dark:text-white"
//         />

//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadQuizzes}
//           onChange={(val) => setSelectedQuiz(val as Option)}
//           value={selectedQuiz}
//           placeholder="Select Quiz"
//           defaultOptions
//           isDisabled={!selectedBatch}
//           className="text-black dark:text-white"
//         />
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting || !selectedBatch || !selectedQuiz}
//         className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//       >
//         {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
//       </button>

//       {/* Success Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
//             <h3 className="text-2xl font-semibold text-green-600">
//               Quiz Assigned Successfully!
//             </h3>
//             <p className="mt-4 text-gray-700 dark:text-gray-300">
//               The quiz has been successfully assigned to the batch.
//             </p>
//             <button
//               onClick={() => setShowModal(false)}
//               className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}

//       {/* 📋 Assigned Quizzes */}
//       {assignedQuizzes.length > 0 && (
//         <div className="mt-10">
//           <h2 className="text-xl font-semibold mb-4">Assigned Quizzes</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {assignedQuizzes.map((quiz) => (
//               <div
//                 key={quiz.quiz_id}
//                 className="p-4 rounded-lg border shadow-md bg-white dark:bg-gray-800"
//               >
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                   {quiz.quiz_title}
//                 </h3>

//                 <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
//                   {quiz.description || "No description available."}
//                 </p>

//                 <p className="text-xs text-gray-500 dark:text-gray-400">
//                   Created on:{" "}
//                   {quiz.start_time
//                     ? new Date(quiz.start_time).toLocaleString()
//                     : "N/A"}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BatchAssign;

// import endpoints from "@/api/endpoints"; // adjust path if needed
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
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
//   const [showModal, setShowModal] = useState(false);

//   const navigate = useNavigate();

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
//       await axios.post(endpoints.quizzes.assignToBatch, payload);
//       setShowModal(true);

//       setTimeout(() => {
//         navigate(-1);
//       }, 5000);
//     } catch (error) {
//       alert("❌ Failed to assign quiz.");
//       console.error("Assignment Error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const loadBatches = async (inputValue: string) => {
//     try {
//       const res = await axios.get(endpoints.batches.all);
//       setBatchError(null);
//       return res.data.map((batch: Option) => ({
//         label: batch.label,
//         value: batch.value,
//       }));
//     } catch (error) {
//       setBatchError("❌ Failed to load batches.");
//       console.error("Error fetching batches:", error);
//       return [];
//     }
//   };

//   const loadQuizzes = async (inputValue: string) => {
//     try {
//       const res = await axios.get(endpoints.quizzes.getAll);
//       setQuizError(null);
//       return res.data.map((quiz: any) => ({
//         label: quiz.quiz_title,
//         value: quiz.quiz_id,
//       }));
//     } catch (error) {
//       setQuizError("❌ Failed to load quizzes.");
//       console.error("Error fetching quizzes:", error);
//       return [];
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//       {/* 🔙 Back Icon */}
//       <div className="mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
//         >
//           <ArrowLeft className="mr-1" size={18} />
//           Back
//         </button>
//       </div>

//       <h1 className="text-2xl font-bold mb-6">Assign Quiz to Batch</h1>

//       {/* Error messages */}
//       {batchError && <div className="text-red-500 mb-2">{batchError}</div>}
//       {quizError && <div className="text-red-500 mb-2">{quizError}</div>}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
//           className="text-black dark:text-white"
//         />

//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadQuizzes}
//           onChange={(val) => setSelectedQuiz(val as Option)}
//           value={selectedQuiz}
//           placeholder="Select Quiz"
//           defaultOptions
//           isDisabled={!selectedBatch}
//           className="text-black dark:text-white"
//         />
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting || !selectedBatch || !selectedQuiz}
//         className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//       >
//         {isSubmitting ? "Assigning..." : "Assign Quiz to Batch"}
//       </button>

//       {/* ✅ Success Modal */}
//       {showModal && (
//         <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
//             <h3 className="text-2xl font-semibold text-green-600">
//               ✅ Quiz Assigned Successfully!
//             </h3>
//             <p className="mt-4 text-gray-700 dark:text-gray-300">
//               The quiz has been successfully assigned to the batch.
//             </p>
//             <button
//               onClick={() => setShowModal(false)}
//               className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
//             >
//               OK
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BatchAssign;
