import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

interface Option {
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
  const [selectedSchool, setSelectedSchool] = useState<Option | null>(null);
  const [selectedClass, setSelectedClass] = useState<Option | null>(null);
  const [selectedSection, setSelectedSection] = useState<Option | null>(null);
  const [selectedSession, setSelectedSession] = useState<Option | null>(null);

  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

  const [batchName, setBatchName] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDropdownData();
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedSchool && selectedClass && selectedSection) {
      fetchStudents(selectedSchool.value, selectedClass.value, selectedSection.value);
    } else {
      setStudents([]);
    }
  }, [selectedSchool, selectedClass, selectedSection]);

  const fetchDropdownData = async () => {
    try {
      const [classesRes, sectionsRes, sessionsRes] = await Promise.all([
        axios.get("http://localhost:8000/api/batches/classes"),
        axios.get("http://localhost:8000/api/batches/sections"),
        axios.get("http://localhost:8000/api/batches/sessions"),
      ]);

      setClassOptions(classesRes.data.map((c: any) => ({
        label: `${c.class_name} (ID: ${c.class_id})`,
        value: c.class_id,
      })));

      setSectionOptions(sectionsRes.data.map((s: any) => ({
        label: `${s.section_name} (ID: ${s.section_id})`,
        value: s.section_id,
      })));

      setSessionOptions(sessionsRes.data.map((s: any) => ({
        label: s.session_name,
        value: s.session_id,
      })));
    } catch (err) {
      console.error("Error fetching dropdown data", err);
    }
  };

  const loadSchools = useCallback(async (inputValue: string) => {
    try {
      const res = await axios.get("http://localhost:8000/api/schools", {
        params: { search: inputValue },
      });
      return res.data.map((school: any) => ({
        label: school.school_name,
        value: school.school_id,
      }));
    } catch (err) {
      console.error("Error loading schools", err);
      return [];
    }
  }, []);

  const fetchStudents = async (school_id: number, class_id: number, section_id: number) => {
    try {
      const res = await axios.get("http://localhost:8000/api/students", {
        params: {
          school_id,
          class_id,
          section_id,
          exclude_assigned: true,
        },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Error fetching batches", err);
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
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSession(null);
    setStudents([]);
    setSelectedStudents([]);
    setSelectAll(false);
    setEditingBatchId(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (
      !batchName ||
      !selectedSchool ||
      !selectedClass ||
      !selectedSection ||
      !selectedSession ||
      selectedStudents.length === 0
    ) {
      alert("Please fill all fields and select students.");
      return;
    }

    const payload = {
      batch_name: batchName,
      school_id_fk: selectedSchool.value,
      class_id: selectedClass.value,
      section_id: selectedSection.value,
      session_id: selectedSession.value,
      created_by: 1,
      student_ids: selectedStudents,
    };

    setIsSubmitting(true);
    try {
      if (editingBatchId) {
        await axios.put(`http://localhost:8000/api/batches/${editingBatchId}`, payload);
        alert("✅ Batch updated successfully!");
      } else {
        await axios.post(`http://localhost:8000/api/batches`, payload);
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

  const handleEdit = (batch: Batch) => {
    setEditingBatchId(batch.batch_id);
    setBatchName(batch.batch_name);
    setSelectedSchool({ label: `School ID ${batch.school_id_fk}`, value: batch.school_id_fk });
    setSelectedClass(classOptions.find(c => c.value === batch.class_id) || null);
    setSelectedSection(sectionOptions.find(s => s.value === batch.section_id) || null);
    setSelectedSession(sessionOptions.find(s => s.value === batch.session_id) || null);
    setSelectedStudents([]); // Optional: populate if you fetch student_ids for editing
  };

  const handleDelete = async (batch_id: number) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      try {
        await axios.delete(`http://localhost:8000/api/batches/${batch_id}`);
        fetchBatches();
        alert("✅ Batch deleted.");
      } catch (err) {
        console.error("Error deleting batch", err);
        alert("❌ Failed to delete batch.");
      }
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">{editingBatchId ? "Edit Batch" : "Create A New Batch"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block mb-2 text-sm font-medium">Batch Name</label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            placeholder="Enter batch name"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Select School</label>
          <AsyncSelect
            cacheOptions
            loadOptions={loadSchools}
            defaultOptions
            onChange={setSelectedSchool}
            value={selectedSchool}
            placeholder="Search school..."
            isDisabled={isSubmitting}
            className="text-black dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Class</label>
          <select
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={selectedClass?.value ?? ""}
            onChange={(e) => {
              const cls = classOptions.find((c) => c.value === +e.target.value);
              setSelectedClass(cls || null);
            }}
            disabled={isSubmitting}
          >
            <option value="">Select class</option>
            {classOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Section</label>
          <select
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={selectedSection?.value ?? ""}
            onChange={(e) => {
              const sec = sectionOptions.find((s) => s.value === +e.target.value);
              setSelectedSection(sec || null);
            }}
            disabled={isSubmitting}
          >
            <option value="">Select section</option>
            {sectionOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium">Academic Session</label>
          <select
            className="w-full p-2 border rounded bg-white dark:bg-gray-800"
            value={selectedSession?.value ?? ""}
            onChange={(e) => {
              const sess = sessionOptions.find((s) => s.value === +e.target.value);
              setSelectedSession(sess || null);
            }}
            disabled={isSubmitting}
          >
            <option value="">Select session</option>
            {sessionOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium">Select Students</label>
        {students.length > 0 && (
          <div className="flex items-center mb-2">
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="mr-2" />
            <span>Select All</span>
          </div>
        )}
        <div className="max-h-64 overflow-y-auto border rounded p-4 dark:border-gray-700">
          {students.length === 0 ? (
            <p className="text-sm text-gray-500">No students available.</p>
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

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 font-semibold rounded ${isSubmitting ? "bg-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"}`}
      >
        {isSubmitting ? "Processing..." : editingBatchId ? "Update Batch" : "Create Batch"}
      </button>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Your Batches</h2>
        <div className="space-y-4">
          {batches.length === 0 ? (
            <p>No batches created yet.</p>
          ) : (
            batches.map((batch) => (
              <div key={batch.batch_id} className="p-4 bg-white dark:bg-gray-800 border rounded">
                <p className="font-semibold">{batch.batch_name}</p>
                <p className="text-sm text-gray-500">
                  Class ID: {batch.class_id}, Section ID: {batch.section_id}, Session ID: {batch.session_id}
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.batch_id)}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
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













// import axios from "axios";
// import React, { useEffect, useState } from "react";
// import AsyncSelect from "react-select/async";

// interface SchoolOption {
//   label: string;
//   value: number;
// }

// interface Student {
//   id: number;
//   name: string;
// }

// interface Batch {
//   batch_id: number;
//   batch_name: string;
//   school_id_fk: number;
//   class_id: number;
//   section_id: number;
//   session_id: number;
//   created_by: number;
// }

// const sessionOptions = [
//   { label: "2023-2024", value: 1 },
//   { label: "2024-2025", value: 2 },
//   { label: "2025-2026", value: 3 },
// ];

// const BatchAssignment: React.FC = () => {
//   const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
//   const [batchName, setBatchName] = useState("");
//   const [classId, setClassId] = useState("");
//   const [sectionId, setSectionId] = useState("");
//   const [sessionId, setSessionId] = useState<number | null>(null);
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     fetchBatches();
//   }, []);

//   const loadSchools = async (inputValue: string) => {
//     try {
//       const res = await axios.get("http://localhost:8000/api/schools", {
//         params: { search: inputValue },
//       });
//       return res.data.map((school: { school_name: string; school_id: number }) => ({
//         label: school.school_name,
//         value: school.school_id,
//       }));
//     } catch (error) {
//       console.error("Error loading schools:", error);
//       return [];
//     }
//   };

//   const fetchBatches = async () => {
//     try {
//       const res = await axios.get<Batch[]>("http://localhost:8000/api/batches");
//       setBatches(res.data);
//     } catch (error) {
//       console.error("Error fetching batches:", error);
//     }
//   };

//   const fetchStudents = async (schoolId: number, classId: string, sectionId: string) => {
//     if (!classId || !sectionId) return;
//     try {
//       const res = await axios.get<Student[]>("http://localhost:8000/api/students", {
//         params: {
//           school_id: schoolId,
//           class_id: classId,
//           section_id: sectionId,
//         },
//       });
//       setStudents(res.data);
//     } catch (error) {
//       console.error("Error fetching students:", error);
//     }
//   };
  

//   const handleSchoolChange = (selected: SchoolOption | null) => {
//     setSelectedSchool(selected);
//     setSelectedStudents([]);
//     setSelectAll(false);
//     setStudents([]);
//     if (selected && classId && sectionId) {
//       fetchStudents(selected.value, classId, sectionId);
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

//   const resetForm = () => {
//     setBatchName("");
//     setSelectedSchool(null);
//     setClassId("");
//     setSectionId("");
//     setSessionId(null);
//     setStudents([]);
//     setSelectedStudents([]);
//     setSelectAll(false);
//     setEditingBatchId(null);
//     setIsSubmitting(false);
//   };

//   const handleSubmit = async () => {
//     if (!batchName || !selectedSchool || !classId || !sectionId || !sessionId || selectedStudents.length === 0) {
//       alert("Please fill all fields and select students.");
//       return;
//     }

//     const payload = {
//       batch_name: batchName,
//       school_id_fk: selectedSchool.value,
//       class_id: Number(classId),
//       section_id: Number(sectionId),
//       session_id: sessionId,
//       created_by: 1,
//       student_ids: selectedStudents,
//     };

//     setIsSubmitting(true);
//     try {
//       if (editingBatchId) {
//         await axios.put(`http://localhost:8000/api/batches/${editingBatchId}`, payload);
//         alert("✅ Batch updated successfully!");
//       } else {
//         await axios.post(`http://localhost:8000/api/batches`, payload);
//         alert("✅ Batch created successfully!");
//       }
//       fetchBatches();
//       resetForm();
//     } catch (error) {
//       console.error("Error submitting batch:", error);
//       alert("❌ Failed to create/update batch.");
//       setIsSubmitting(false);
//     }
//   };

//   const handleEdit = async (batch: Batch) => {
//     setBatchName(batch.batch_name);
//     setClassId(batch.class_id.toString());
//     setSectionId(batch.section_id.toString());
//     setSessionId(batch.session_id);
//     setEditingBatchId(batch.batch_id);

//     try {
//       const res = await axios.get(`http://localhost:8000/api/school/${batch.school_id_fk}`);
//       setSelectedSchool({
//         label: res.data.school_name,
//         value: res.data.school_id,
//       });
//       fetchStudents(batch.school_id_fk);
//     } catch (error) {
//       console.error("Failed to fetch school info:", error);
//     }
//   };

//   const handleDelete = async (batchId: number) => {
//     if (!window.confirm("Are you sure you want to delete this batch?")) return;

//     try {
//       await axios.delete(`http://localhost:8000/api/batches/${batchId}`);
//       alert("✅ Batch deleted successfully!");
//       fetchBatches();
//     } catch (error) {
//       console.error("Error deleting batch:", error);
//       alert("❌ Failed to delete batch.");
//     }
//   };

//   return (
//     <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
//       <h1 className="text-2xl font-bold mb-6 text-center">
//         {editingBatchId ? "Edit Batch" : "Create A New Batch"}
//       </h1>

//       {/* Form */}
//       <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div>
//           <label className="block mb-2 text-sm font-medium">Batch Name</label>
//           <input
//             type="text"
//             className="w-full p-2 border rounded bg-white dark:bg-gray-800"
//             value={batchName}
//             onChange={(e) => setBatchName(e.target.value)}
//             placeholder="Enter batch name"
//           />
//         </div>

//         <div>
//           <label className="block mb-2 text-sm font-medium">Section ID</label>
//           <input
//             type="number"
//             className="w-full p-2 border rounded bg-white dark:bg-gray-800"
//             value={sectionId}
//             onChange={(e) => setSectionId(e.target.value)}
//             placeholder="Enter section ID"
//           />
//         </div>

//         <div>
//           <label className="block mb-2 text-sm font-medium">Class ID</label>
//           <input
//             type="number"
//             className="w-full p-2 border rounded bg-white dark:bg-gray-800"
//             value={classId}
//             onChange={(e) => setClassId(e.target.value)}
//             placeholder="Enter class ID"
//           />
//         </div>

//         <div>
//           <label className="block mb-2 text-sm font-medium">Select School</label>
//           <AsyncSelect
//             cacheOptions
//             loadOptions={loadSchools}
//             defaultOptions
//             onChange={handleSchoolChange}
//             value={selectedSchool}
//             placeholder="Search school name..."
//             className="text-black dark:text-white"
//           />
//         </div>

//         <div>
//           <label className="block mb-2 text-sm font-medium">Academic Session</label>
//           <select
//             value={sessionId ?? ""}
//             onChange={(e) => setSessionId(Number(e.target.value))}
//             className="w-full p-2 border rounded bg-white dark:bg-gray-800"
//           >
//             <option value="" disabled>Select session</option>
//             {sessionOptions.map((session) => (
//               <option key={session.value} value={session.value}>
//                 {session.label}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Students */}
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
//         disabled={isSubmitting}
//         className={`w-full py-3 mb-8 font-semibold rounded transition-all ${
//           isSubmitting
//             ? "bg-gray-400 cursor-not-allowed"
//             : "bg-blue-600 hover:bg-blue-700 text-white"
//         }`}
//       >
//         {isSubmitting
//           ? "Processing..."
//           : editingBatchId
//           ? " Update Batch"
//           : " Create Batch"}
//       </button>

//       {/* Batches */}
//       <div className="mt-12">
//         <h2 className="text-xl font-bold mb-4">Your Batches</h2>
//         <div className="space-y-4">
//           {batches.length === 0 ? (
//             <p>No batches created yet.</p>
//           ) : (
//             batches.map((batch) => (
//               <div
//                 key={batch.batch_id}
//                 className="p-4 bg-white dark:bg-gray-800 border rounded flex justify-between items-center"
//               >
//                 <div>
//                   <p className="font-semibold">{batch.batch_name}</p>
//                   <p className="text-sm text-gray-500">
//                     Class: {batch.class_id}, Section: {batch.section_id}, Session: {batch.session_id}
//                   </p>
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => handleEdit(batch)}
//                     className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(batch.batch_id)}
//                     className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;
