import axios from "axios";
import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

interface SchoolOption {
  label: string;
  value: number;
}

interface Student {
  id: number;
  name: string;
}

interface Batch {
  batch_id: number;
  batch_name: string;
  school_id_fk: number;
  class_id: number;
  section_id: number;
  session_id: number;
  created_by: number;
}

const BatchAssignment: React.FC = () => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [batchName, setBatchName] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const loadSchools = async (inputValue: string) => {
    try {
      const res = await axios.get("http://localhost:8000/api/schools", {
        params: { search: inputValue },
      });
      return res.data.map((school: { school_name: string; school_id: number }) => ({
        label: school.school_name,
        value: school.school_id,
      }));
    } catch (error) {
      console.error("Error loading schools:", error);
      return [];
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get<Batch[]>("http://localhost:8000/api/batches");
      setBatches(res.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const fetchStudents = async (schoolId: number) => {
    try {
      const res = await axios.get<Student[]>(`http://localhost:8000/api/students`, {
        params: { school_id: schoolId },
      });
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSchoolChange = (selected: SchoolOption | null) => {
    setSelectedSchool(selected);
    setSelectedStudents([]);
    setSelectAll(false);
    if (selected) {
      fetchStudents(selected.value);
    } else {
      setStudents([]);
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
    setSelectAll(!selectAll);
  };

  const resetForm = () => {
    setBatchName("");
    setSelectedSchool(null);
    setClassId("");
    setSectionId("");
    setSessionId("");
    setStudents([]);
    setSelectedStudents([]);
    setSelectAll(false);
    setEditingBatchId(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!batchName || !selectedSchool || !classId || !sectionId || !sessionId || selectedStudents.length === 0) {
      alert("Please fill all fields and select students.");
      return;
    }

    const payload = {
      batch_name: batchName,
      school_id: selectedSchool.value,
      class_id: Number(classId),
      section_id: Number(sectionId),
      session_id: Number(sessionId),
      created_by: 1, // Static for now. Ideally, dynamic teacher ID
      student_ids: selectedStudents,
    };

    setIsSubmitting(true);
    try {
      if (editingBatchId) {
        await axios.put(`http://localhost:8000/api/update_batch/${editingBatchId}`, payload);
        alert("✅ Batch updated successfully!");
      } else {
        await axios.post(`http://localhost:8000/api/create_batch`, payload);
        alert("✅ Batch created successfully!");
      }
      fetchBatches();
      resetForm();
    } catch (error) {
      console.error("Error submitting batch:", error);
      alert("❌ Failed to create/update batch.");
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (batch: Batch) => {
    setBatchName(batch.batch_name);
    setClassId(batch.class_id.toString());
    setSectionId(batch.section_id.toString());
    setSessionId(batch.session_id.toString());
    setEditingBatchId(batch.batch_id);

    try {
      const res = await axios.get(`http://localhost:8000/api/school/${batch.school_id_fk}`);
      setSelectedSchool({
        label: res.data.school_name,
        value: res.data.school_id,
      });
      fetchStudents(batch.school_id_fk);
    } catch (error) {
      console.error("Failed to fetch school info:", error);
    }
  };

  const handleDelete = async (batchId: number) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/delete_batch/${batchId}`);
      alert("✅ Batch deleted successfully!");
      fetchBatches();
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("❌ Failed to delete batch.");
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">
        📋 {editingBatchId ? "Edit Batch" : "Create a New Batch"}
      </h1>

      {/* Form */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-sm font-medium">Select School</label>
          <AsyncSelect
            cacheOptions
            loadOptions={loadSchools}
            defaultOptions
            onChange={handleSchoolChange}
            value={selectedSchool}
            placeholder="Search school name..."
            className="text-black dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Batch Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Enter batch name"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Class ID</label>
          <input
            type="number"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="Enter class ID"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Section ID</label>
          <input
            type="number"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            placeholder="Enter section ID"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Session ID</label>
          <input
            type="number"
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter session ID"
          />
        </div>
      </div>

      {/* Students */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Select Students</label>
        {students.length > 0 && (
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="mr-2"
            />
            <span>Select All</span>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto border rounded p-4 dark:border-gray-700">
          {students.length === 0 ? (
            <p className="text-gray-500 text-sm">No students available.</p>
          ) : (
            students.map((student) => (
              <div key={student.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="mr-2"
                />
                <span>{student.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 mb-8 font-semibold rounded transition-all ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isSubmitting
          ? "Processing..."
          : editingBatchId
          ? "🚀 Update Batch"
          : "🚀 Create Batch"}
      </button>

      {/* Batches */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">📚 Existing Batches</h2>
        <div className="space-y-4">
          {batches.length === 0 ? (
            <p>No batches created yet.</p>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.batch_id}
                className="p-4 bg-white dark:bg-gray-800 border rounded flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{batch.batch_name}</p>
                  <p className="text-sm text-gray-500">
                    Class: {batch.class_id}, Section: {batch.section_id}, Session: {batch.session_id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.batch_id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAssignment;












// import React, { useState } from "react";
// import AsyncSelect from "react-select/async";
// import axios from "axios";

// interface SchoolOption {
//   label: string;
//   value: number;
// }

// interface Student {
//   id: number;
//   name: string;
// }

// const BatchAssignment: React.FC = () => {
//   const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
//   const [batchName, setBatchName] = useState("");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
//   const [selectAll, setSelectAll] = useState(false);

//   // Load schools based on user input
//   const loadSchools = async (inputValue: string) => {
//     try {
//       const res = await axios.get(`http://localhost:8000/api/schools?search=${inputValue}`);
//       return res.data.map((school: any) => ({
//         label: school.school_name,
//         value: school.school_id,
//       }));
//     } catch (error) {
//       console.error("Error loading schools:", error);
//       return [];
//     }
//   };

//   const handleSchoolChange = (selected: SchoolOption | null) => {
//     setSelectedSchool(selected);
//     if (selected) {
//       fetchStudents(selected.value);
//     } else {
//       setStudents([]);
//     }
//   };

//   const fetchStudents = async (schoolId: number) => {
//     try {
//       const res = await axios.get<Student[]>(`http://localhost:8000/api/students?school_id=${schoolId}`);
//       setStudents(res.data);
//     } catch (error) {
//       console.error("Failed to fetch students:", error);
//     }
//   };

//   const toggleStudent = (id: number) => {
//     setSelectedStudents((prev) =>
//       prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
//     );
//   };

//   const toggleSelectAll = () => {
//     if (selectAll) {
//       setSelectedStudents([]);
//     } else {
//       setSelectedStudents(students.map((s) => s.id));
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleSubmit = async () => {
//     if (!batchName || !selectedSchool || selectedStudents.length === 0) {
//       alert("Please fill all fields and select students.");
//       return;
//     }

//     try {
//       await axios.post("http://localhost:8000/api/create_batch", {
//         batch_name: batchName,
//         school_id: selectedSchool.value,
//         created_by: 1, // Replace with actual teacher ID
//         student_ids: selectedStudents,
//       });
//       alert("✅ Batch created successfully!");
//       setBatchName("");
//       setStudents([]);
//       setSelectedStudents([]);
//       setSelectAll(false);
//       setSelectedSchool(null);
//     } catch (error) {
//       console.error("Error submitting batch:", error);
//       alert("❌ Failed to create batch.");
//     }
//   };

//   return (
//     <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
//       <h1 className="text-2xl font-bold mb-6 text-center">📋 Create a New Batch</h1>

//       {/* School Select */}
//       <div className="mb-6">
//         <label className="block mb-2 text-sm font-medium">Select School</label>
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           defaultOptions
//           onChange={handleSchoolChange}
//           value={selectedSchool}
//           placeholder="Search school name..."
//           className="text-black dark:text-white"
//         />
//       </div>

//       {/* Batch Name Input */}
//       <div className="mb-6">
//         <label className="block mb-2 text-sm font-medium">Batch Name</label>
//         <input
//           type="text"
//           className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           placeholder="Enter batch name"
//         />
//       </div>

//       {/* Students Checkbox */}
//       <div className="mb-6">
//         <label className="block mb-2 text-sm font-medium">Select Students</label>
//         {students.length > 0 && (
//           <div className="flex items-center mb-2">
//             <input
//               type="checkbox"
//               checked={selectAll}
//               onChange={toggleSelectAll}
//               className="mr-2"
//             />
//             <span>Select All</span>
//           </div>
//         )}
//         <div className="max-h-64 overflow-y-auto border rounded p-4 dark:border-gray-700">
//           {students.length === 0 ? (
//             <p className="text-gray-500 text-sm">No students available.</p>
//           ) : (
//             students.map((student) => (
//               <div key={student.id} className="flex items-center mb-2">
//                 <input
//                   type="checkbox"
//                   checked={selectedStudents.includes(student.id)}
//                   onChange={() => toggleStudent(student.id)}
//                   className="mr-2"
//                 />
//                 <span>{student.name}</span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Submit Button */}
//       <button
//         onClick={handleSubmit}
//         className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-all"
//       >
//         🚀 Create Batch
//       </button>
//     </div>
//   );
// };

// export default BatchAssignment;
