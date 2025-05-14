import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";

interface Option {
  label: string;
  value: number;
}

interface Student {
  student_id: number;
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
  student_ids: number[];
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
    if (selectedClass && selectedSection && selectedSchool) {
      fetchStudents(
        selectedClass.value,
        selectedSection.value,
        selectedSchool.value,
        editingBatchId === null
      );
    } else {
      setStudents([]);
      setSelectedStudents([]);
      setSelectAll(false);
    }
  }, [selectedClass, selectedSection, selectedSchool]);

  const fetchDropdownData = async () => {
    const [cls, sec, ses] = await Promise.all([
      axios.get("/api/batches/classes"),
      axios.get("/api/batches/sections"),
      axios.get("/api/batches/sessions"),
    ]);
    setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
    setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
    setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
  };

  const loadSchools = useCallback(async (input: string) => {
    const res = await axios.get("/api/schools", { params: { search: input } });
    return res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }));
  }, []);

  const fetchStudents = async (
    class_id: number,
    section_id: number,
    school_id: number,
    excludeAssigned: boolean
  ) => {
    const res = await axios.get("/api/batches/students/filter", {
      params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
    });
    setStudents(res.data);
  };

  const fetchBatches = async () => {
    const res = await axios.get<Batch[]>("/api/batches");
    setBatches(res.data);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.student_id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectStudent = (sid: number) => {
    setSelectedStudents((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
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
      alert("Please fill all fields and select at least one student.");
      return;
    }

    const payload = {
      batch_name: batchName,
      school_id_fk: selectedSchool.value,
      created_by: 1,
      class_id: selectedClass.value,
      section_id: selectedSection.value,
      session_id: selectedSession.value,
      student_ids: selectedStudents,
    };

    setIsSubmitting(true);
    try {
      if (editingBatchId) {
        await axios.put(`/api/batches/${editingBatchId}`, payload);
        alert("Batch updated!");
      } else {
        await axios.post("/api/batches", payload);
        alert("Batch created!");
      }
      fetchBatches();
      resetForm();
    } catch {
      alert("Failed to save batch.");
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (b: Batch) => {
    setEditingBatchId(b.batch_id);
    setBatchName(b.batch_name);
    setSelectedSchool({ value: b.school_id_fk, label: `School ${b.school_id_fk}` });
    setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
    setSelectedSection({ value: b.section_id, label: `Section ${b.section_id}` });
    setSelectedSession({ value: b.session_id, label: `Session ${b.session_id}` });

    await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
    const assignedRes = await axios.get<{ student_ids: number[] }>(
      `/api/batches/${b.batch_id}/students`
    );
    setSelectedStudents(assignedRes.data.student_ids);
    setSelectAll(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this batch?")) return;
    await axios.delete(`/api/batches/${id}`);
    fetchBatches();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        {editingBatchId ? "Edit Batch" : "Create Batch"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Batch Name"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="p-2 border rounded"
        />
        <AsyncSelect
          cacheOptions
          loadOptions={loadSchools}
          onChange={(val) => setSelectedSchool(val)}
          value={selectedSchool}
          placeholder="Select School"
        />
        <select
          value={selectedClass?.value || ""}
          onChange={(e) =>
            setSelectedClass(classOptions.find((c) => c.value === Number(e.target.value)) || null)
          }
          className="p-2 border rounded"
        >
          <option value="">Select Class</option>
          {classOptions.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={selectedSection?.value || ""}
          onChange={(e) =>
            setSelectedSection(sectionOptions.find((s) => s.value === Number(e.target.value)) || null)
          }
          className="p-2 border rounded"
        >
          <option value="">Select Section</option>
          {sectionOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={selectedSession?.value || ""}
          onChange={(e) =>
            setSelectedSession(sessionOptions.find((s) => s.value === Number(e.target.value)) || null)
          }
          className="p-2 border rounded"
        >
          <option value="">Select Session</option>
          {sessionOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <h2 className="text-xl font-semibold mb-2">Students</h2>
      <button
        onClick={handleSelectAll}
        className="mb-4 px-3 py-1 bg-blue-600 text-white rounded"
      >
        {selectAll ? "Deselect All" : "Select All"}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {students.map((s) => (
          <div
            key={s.student_id}
            className={`p-3 border rounded cursor-pointer ${
              selectedStudents.includes(s.student_id) ? "bg-red-500" : "bg-white"
            }`}
            onClick={() => handleSelectStudent(s.student_id)}
          >
            {s.name}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="px-6 py-2 bg-green-600 text-white rounded"
      >
        {editingBatchId ? "Update Batch" : "Create Batch"}
      </button>

      <h2 className="text-xl font-semibold mt-8 mb-4">Existing Batches</h2>
      <div className="space-y-4">
        {batches.map((b) => (
          <div
            key={b.batch_id}
            className="p-4 bg-white border rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{b.batch_name}</p>
              <p className="text-sm text-red-600">
                Class {b.class_id} - Section {b.section_id} - Session {b.session_id}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(b)}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(b.batch_id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchAssignment;
















// import axios from "axios";
// import React, { useCallback, useEffect, useState } from "react";
// import AsyncSelect from "react-select/async";

// interface Option {
//   label: string;
//   value: number;
// }

// interface Student {
//   student_id: number;
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
//   student_ids: number[];
// }

// const BatchAssignment: React.FC = () => {
//   const [selectedSchool, setSelectedSchool] = useState<Option | null>(null);
//   const [selectedClass, setSelectedClass] = useState<Option | null>(null);
//   const [selectedSection, setSelectedSection] = useState<Option | null>(null);
//   const [selectedSession, setSelectedSession] = useState<Option | null>(null);

//   const [classOptions, setClassOptions] = useState<Option[]>([]);
//   const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
//   const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

//   const [batchName, setBatchName] = useState("");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
//   const [selectAll, setSelectAll] = useState(false);

//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     fetchDropdownData();
//     fetchBatches();
//   }, []);

//   useEffect(() => {
//     if (selectedClass && selectedSection && selectedSchool) {
//       fetchStudents(
//         selectedClass.value,
//         selectedSection.value,
//         selectedSchool.value,
//         editingBatchId === null // exclude assigned only when creating
//       );
//     } else {
//       setStudents([]);
//       setSelectedStudents([]);
//       setSelectAll(false);
//     }
//   }, [selectedClass, selectedSection, selectedSchool]);

//   const fetchDropdownData = async () => {
//     try {
//       const [cls, sec, ses] = await Promise.all([
//         axios.get("/api/batches/classes"),
//         axios.get("/api/batches/sections"),
//         axios.get("/api/batches/sessions"),
//       ]);
//       setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label || `Class ${c.class_id}` })));
//       setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label || `Section ${s.section_id}` })));
//       setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name || `Session ${s.session_id}` })));
//     } catch (error) {
//       alert("Failed to load dropdown data");
//     }
//   };

//   const loadSchools = useCallback(async (input: string) => {
//     const res = await axios.get("/api/schools", { params: { search: input } });
//     return res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }));
//   }, []);

//   const fetchStudents = async (
//     class_id: number,
//     section_id: number,
//     school_id: number,
//     excludeAssigned: boolean
//   ) => {
//     try {
//       const res = await axios.get("/api/batches/students/filter", {
//         params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
//       });
//       setStudents(res.data);
//     } catch (error) {
//       alert("Failed to load students");
//     }
//   };

//   const fetchBatches = async () => {
//     try {
//       const res = await axios.get<Batch[]>("/api/batches");
//       setBatches(res.data);
//     } catch (error) {
//       alert("Failed to load batches");
//     }
//   };

//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedStudents([]);
//     } else {
//       setSelectedStudents(students.map((s) => s.student_id));
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleSelectStudent = (sid: number) => {
//     setSelectedStudents((prev) =>
//       prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
//     );
//   };

//   const resetForm = () => {
//     setBatchName("");
//     setSelectedSchool(null);
//     setSelectedClass(null);
//     setSelectedSection(null);
//     setSelectedSession(null);
//     setStudents([]);
//     setSelectedStudents([]);
//     setSelectAll(false);
//     setEditingBatchId(null);
//     setIsSubmitting(false);
//   };

//   const handleSubmit = async () => {
//     if (
//       !batchName ||
//       !selectedSchool ||
//       !selectedClass ||
//       !selectedSection ||
//       !selectedSession ||
//       selectedStudents.length === 0
//     ) {
//       alert("Please fill all fields and select at least one student.");
//       return;
//     }

//     const payload = {
//       batch_name: batchName,
//       school_id_fk: selectedSchool.value,
//       created_by: 1, // Replace with actual user ID if available
//       class_id: selectedClass.value,
//       section_id: selectedSection.value,
//       session_id: selectedSession.value,
//       student_ids: selectedStudents,
//     };

//     setIsSubmitting(true);
//     try {
//       if (editingBatchId) {
//         await axios.put(`/api/batches/${editingBatchId}`, payload);
//         alert("Batch updated!");
//       } else {
//         await axios.post("/api/batches", payload);
//         alert("Batch created!");
//       }
//       fetchBatches();
//       resetForm();
//     } catch (error) {
//       alert("Failed to save batch.");
//       setIsSubmitting(false);
//     }
//   };

//   const handleEdit = async (b: Batch) => {
//     setEditingBatchId(b.batch_id);
//     setBatchName(b.batch_name);
//     setSelectedSchool({ value: b.school_id_fk, label: `School ${b.school_id_fk}` });
//     setSelectedClass(classOptions.find((c) => c.value === b.class_id) || {
//       value: b.class_id,
//       label: `Class ${b.class_id}`,
//     });
//     setSelectedSection(sectionOptions.find((s) => s.value === b.section_id) || {
//       value: b.section_id,
//       label: `Section ${b.section_id}`,
//     });
//     setSelectedSession(sessionOptions.find((s) => s.value === b.session_id) || {
//       value: b.session_id,
//       label: `Session ${b.session_id}`,
//     });

//     await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
//     const assignedRes = await axios.get<{ student_ids: number[] }>(
//       `/api/batches/${b.batch_id}/students`
//     );
//     setSelectedStudents(assignedRes.data.student_ids);
//     setSelectAll(false);
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this batch?")) return;
//     try {
//       await axios.delete(`/api/batches/${id}`);
//       fetchBatches();
//     } catch {
//       alert("Failed to delete batch");
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">
//         {editingBatchId ? "Edit Batch" : "Create Batch"}
//       </h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Batch Name"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           className="p-2 border rounded"
//         />
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={setSelectedSchool}
//           value={selectedSchool}
//           placeholder="Select School"
//         />
//         <select
//           value={selectedClass?.value || ""}
//           onChange={(e) =>
//             setSelectedClass(
//               classOptions.find((c) => c.value === Number(e.target.value)) || null
//             )
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Class</option>
//           {classOptions.map((c) => (
//             <option key={c.value} value={c.value}>
//               {c.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSection?.value || ""}
//           onChange={(e) =>
//             setSelectedSection(
//               sectionOptions.find((s) => s.value === Number(e.target.value)) || null
//             )
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Section</option>
//           {sectionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSession?.value || ""}
//           onChange={(e) =>
//             setSelectedSession(
//               sessionOptions.find((s) => s.value === Number(e.target.value)) || null
//             )
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Session</option>
//           {sessionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <h2 className="text-xl font-semibold mb-2">Students</h2>
//       <button
//         onClick={handleSelectAll}
//         className="mb-4 px-3 py-1 bg-blue-600 text-white rounded"
//       >
//         {selectAll ? "Deselect All" : "Select All"}
//       </button>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
//         {students.map((s) => (
//           <div
//             key={s.student_id}
//             className={`p-3 border rounded cursor-pointer ${
//               selectedStudents.includes(s.student_id)
//                 ? "bg-red-500 text-white"
//                 : "bg-white"
//             }`}
//             onClick={() => handleSelectStudent(s.student_id)}
//           >
//             {s.name}
//           </div>
//         ))}
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting}
//         className="px-6 py-2 bg-green-600 text-white rounded"
//       >
//         {editingBatchId ? "Update Batch" : "Create Batch"}
//       </button>

//       <h2 className="text-xl font-semibold mt-8 mb-4">Existing Batches</h2>
//       <div className="space-y-4">
//         {batches.map((b) => (
//           <div
//             key={b.batch_id}
//             className="p-4 bg-white border rounded flex justify-between items-center"
//           >
//             <div>
//               <p className="font-semibold">{b.batch_name}</p>
//               <p className="text-sm text-gray-600">
//                 Class {b.class_id} - Section {b.section_id} - Session {b.session_id}
//               </p>
//             </div>
//             <div className="space-x-2">
//               <button
//                 onClick={() => handleEdit(b)}
//                 className="px-3 py-1 bg-yellow-500 text-white rounded"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDelete(b.batch_id)}
//                 className="px-3 py-1 bg-red-500 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;










// import axios from "axios";
// import React, { useCallback, useEffect, useState } from "react";
// import AsyncSelect from "react-select/async";

// interface Option {
//   label: string;
//   value: number;
// }

// interface Student {
//   student_id: number;
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
//   student_ids: number[];
// }

// const BatchAssignment: React.FC = () => {
//   const [selectedSchool, setSelectedSchool] = useState<Option | null>(null);
//   const [selectedClass, setSelectedClass] = useState<Option | null>(null);
//   const [selectedSection, setSelectedSection] = useState<Option | null>(null);
//   const [selectedSession, setSelectedSession] = useState<Option | null>(null);

//   const [classOptions, setClassOptions] = useState<Option[]>([]);
//   const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
//   const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

//   const [batchName, setBatchName] = useState("");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
//   const [selectAll, setSelectAll] = useState(false);

//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     fetchDropdownData();
//     fetchBatches();
//   }, []);

//   useEffect(() => {
//     if (selectedClass && selectedSection && selectedSchool) {
//       fetchStudents(
//         selectedClass.value,
//         selectedSection.value,
//         selectedSchool.value,
//         editingBatchId === null
//       );
//     } else {
//       setStudents([]);
//       setSelectedStudents([]);
//       setSelectAll(false);
//     }
//   }, [selectedClass, selectedSection, selectedSchool]);

//   const fetchDropdownData = async () => {
//     const [cls, sec, ses] = await Promise.all([
//       axios.get("/api/batches/classes"),
//       axios.get("/api/batches/sections"),
//       axios.get("/api/batches/sessions"),
//     ]);
//     setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
//     setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
//     setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
//   };

//   const loadSchools = useCallback(async (input: string) => {
//     const res = await axios.get("/api/schools", { params: { search: input } });
//     return res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }));
//   }, []);

//   const fetchStudents = async (
//     class_id: number,
//     section_id: number,
//     school_id: number,
//     excludeAssigned: boolean
//   ) => {
//     const res = await axios.get("/api/batches/students/filter", {
//       params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
//     });
//     setStudents(res.data);
//   };

//   const fetchBatches = async () => {
//     const res = await axios.get<Batch[]>("/api/batches");
//     setBatches(res.data);
//   };

//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedStudents([]);
//     } else {
//       setSelectedStudents(students.map((s) => s.student_id));
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleSelectStudent = (sid: number) => {
//     setSelectedStudents((prev) =>
//       prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
//     );
//   };

//   const resetForm = () => {
//     setBatchName("");
//     setSelectedSchool(null);
//     setSelectedClass(null);
//     setSelectedSection(null);
//     setSelectedSession(null);
//     setStudents([]);
//     setSelectedStudents([]);
//     setSelectAll(false);
//     setEditingBatchId(null);
//     setIsSubmitting(false);
//   };

//   const handleSubmit = async () => {
//     if (
//       !batchName ||
//       !selectedSchool ||
//       !selectedClass ||
//       !selectedSection ||
//       !selectedSession ||
//       selectedStudents.length === 0
//     ) {
//       alert("Please fill all fields and select at least one student.");
//       return;
//     }

//     const payload = {
//       batch_name: batchName,
//       school_id_fk: selectedSchool.value,
//       created_by: 1,
//       class_id: selectedClass.value,
//       section_id: selectedSection.value,
//       session_id: selectedSession.value,
//       student_ids: selectedStudents,
//     };

//     setIsSubmitting(true);
//     try {
//       if (editingBatchId) {
//         await axios.put(`/api/batches/${editingBatchId}`, payload);
//         alert("Batch updated!");
//       } else {
//         await axios.post("/api/batches", payload);
//         alert("Batch created!");
//       }
//       fetchBatches();
//       resetForm();
//     } catch {
//       alert("Failed to save batch.");
//       setIsSubmitting(false);
//     }
//   };

//   const handleEdit = async (b: Batch) => {
//     setEditingBatchId(b.batch_id);
//     setBatchName(b.batch_name);
//     setSelectedSchool({ value: b.school_id_fk, label: `School ${b.school_id_fk}` });
//     setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
//     setSelectedSection({ value: b.section_id, label: `Section ${b.section_id}` });
//     setSelectedSession({ value: b.session_id, label: `Session ${b.session_id}` });

//     await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
//     const assignedRes = await axios.get<{ student_ids: number[] }>(
//       `/api/batches/${b.batch_id}/students`
//     );
//     setSelectedStudents(assignedRes.data.student_ids);
//     setSelectAll(false);
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this batch?")) return;
//     await axios.delete(`/api/batches/${id}`);
//     fetchBatches();
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">
//         {editingBatchId ? "Edit Batch" : "Create Batch"}
//       </h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Batch Name"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           className="p-2 border rounded"
//         />
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={(val) => setSelectedSchool(val)}
//           value={selectedSchool}
//           placeholder="Select School"
//         />
//         <select
//           value={selectedClass?.value || ""}
//           onChange={(e) =>
//             setSelectedClass(classOptions.find((c) => c.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Class</option>
//           {classOptions.map((c) => (
//             <option key={c.value} value={c.value}>
//               {c.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSection?.value || ""}
//           onChange={(e) =>
//             setSelectedSection(sectionOptions.find((s) => s.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Section</option>
//           {sectionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSession?.value || ""}
//           onChange={(e) =>
//             setSelectedSession(sessionOptions.find((s) => s.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Session</option>
//           {sessionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <h2 className="text-xl font-semibold mb-2">Students</h2>
//       <button
//         onClick={handleSelectAll}
//         className="mb-4 px-3 py-1 bg-blue-600 text-white rounded"
//       >
//         {selectAll ? "Deselect All" : "Select All"}
//       </button>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
//         {students.map((s) => (
//           <div
//             key={s.student_id}
//             className={`p-3 border rounded cursor-pointer ${selectedStudents.includes(s.student_id) ? "bg-red-500" : "bg-white"}`}
//             onClick={() => handleSelectStudent(s.student_id)}
//           >
//             {s.name}
//           </div>
//         ))}
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting}
//         className="px-6 py-2 bg-green-600 text-white rounded"
//       >
//         {editingBatchId ? "Update Batch" : "Create Batch"}
//       </button>

//       <h2 className="text-xl font-semibold mt-8 mb-4">Existing Batches</h2>
//       <div className="space-y-4">
//         {batches.map((b) => (
//           <div
//             key={b.batch_id}
//             className="p-4 bg-white border rounded flex justify-between items-center"
//           >
//             <div>
//               <p className="font-semibold">{b.batch_name}</p>
//               <p className="text-sm text-red-600">
//                 Class {b.class_id} - Section {b.section_id} - Session {b.session_id}
//               </p>
//             </div>
//             <div className="space-x-2">
//               <button
//                 onClick={() => handleEdit(b)}
//                 className="px-3 py-1 bg-yellow-500 text-white rounded"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDelete(b.batch_id)}
//                 className="px-3 py-1 bg-red-500 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;




// import axios from "axios";
// import React, { useCallback, useEffect, useState } from "react";
// import AsyncSelect from "react-select/async";

// interface Option {
//   label: string;
//   value: number;
// }

// interface Student {
//   student_id: number;
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
//   student_ids: number[];
// }

// const BatchAssignment: React.FC = () => {
//   const [selectedSchool, setSelectedSchool] = useState<Option | null>(null);
//   const [selectedClass, setSelectedClass] = useState<Option | null>(null);
//   const [selectedSection, setSelectedSection] = useState<Option | null>(null);
//   const [selectedSession, setSelectedSession] = useState<Option | null>(null);

//   const [classOptions, setClassOptions] = useState<Option[]>([]);
//   const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
//   const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

//   const [batchName, setBatchName] = useState("");
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
//   const [selectAll, setSelectAll] = useState(false);

//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [editingBatchId, setEditingBatchId] = useState<number | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     fetchDropdownData();
//     fetchBatches();
//   }, []);

//   useEffect(() => {
//     if (selectedClass && selectedSection && selectedSchool) {
//       fetchStudents(
//         selectedClass.value,
//         selectedSection.value,
//         selectedSchool.value,
//         editingBatchId === null
//       );
//     } else {
//       setStudents([]);
//       setSelectedStudents([]);
//       setSelectAll(false);
//     }
//   }, [selectedClass, selectedSection, selectedSchool]);

//   const fetchDropdownData = async () => {
//     const [cls, sec, ses] = await Promise.all([
//       axios.get("/api/batches/classes"),
//       axios.get("/api/batches/sections"),
//       axios.get("/api/batches/sessions"),
//     ]);
//     setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
//     setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
//     setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
//   };

//   const loadSchools = useCallback(async (input: string) => {
//     const res = await axios.get("/api/schools", { params: { search: input } });
//     return res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }));
//   }, []);

//   const fetchStudents = async (
//     class_id: number,
//     section_id: number,
//     school_id: number,
//     excludeAssigned: boolean
//   ) => {
//     const res = await axios.get("/api/batches/students/filter", {
//       params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
//     });
//     setStudents(res.data);
//   };

//   const fetchBatches = async () => {
//     const res = await axios.get<Batch[]>("/api/batches");
//     setBatches(res.data);
//   };

//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedStudents([]);
//     } else {
//       setSelectedStudents(students.map((s) => s.student_id));
//     }
//     setSelectAll(!selectAll);
//   };

//   const handleSelectStudent = (sid: number) => {
//     setSelectedStudents((prev) =>
//       prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
//     );
//   };

//   const resetForm = () => {
//     setBatchName("");
//     setSelectedSchool(null);
//     setSelectedClass(null);
//     setSelectedSection(null);
//     setSelectedSession(null);
//     setStudents([]);
//     setSelectedStudents([]);
//     setSelectAll(false);
//     setEditingBatchId(null);
//     setIsSubmitting(false);
//   };

//   const handleSubmit = async () => {
//     if (
//       !batchName ||
//       !selectedSchool ||
//       !selectedClass ||
//       !selectedSection ||
//       !selectedSession ||
//       selectedStudents.length === 0
//     ) {
//       alert("Please fill all fields and select at least one student.");
//       return;
//     }

//     const payload = {
//       batch_name: batchName,
//       school_id_fk: selectedSchool.value,
//       created_by: 1,
//       class_id: selectedClass.value,
//       section_id: selectedSection.value,
//       session_id: selectedSession.value,
//       student_ids: selectedStudents,
//     };

//     setIsSubmitting(true);
//     try {
//       if (editingBatchId) {
//         await axios.put(`/api/batches/${editingBatchId}`, payload);
//         alert("Batch updated!");
//       } else {
//         await axios.post("/api/batches", payload);
//         alert("Batch created!");
//       }
//       fetchBatches();
//       resetForm();
//     } catch {
//       alert("Failed to save batch.");
//       setIsSubmitting(false);
//     }
//   };

//   const handleEdit = async (b: Batch) => {
//     setEditingBatchId(b.batch_id);
//     setBatchName(b.batch_name);
//     setSelectedSchool({ value: b.school_id_fk, label: `School ${b.school_id_fk}` });
//     setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
//     setSelectedSection({ value: b.section_id, label: `Section ${b.section_id}` });
//     setSelectedSession({ value: b.session_id, label: `Session ${b.session_id}` });

//     await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
//     const assignedRes = await axios.get<{ student_ids: number[] }>(
//       `/api/batches/${b.batch_id}/students`
//     );
//     setSelectedStudents(assignedRes.data.student_ids);
//     setSelectAll(false);
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this batch?")) return;
//     await axios.delete(`/api/batches/${id}`);
//     fetchBatches();
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4">
//         {editingBatchId ? "Edit Batch" : "Create Batch"}
//       </h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Batch Name"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           className="p-2 border rounded"
//         />
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={(val) => setSelectedSchool(val)}
//           value={selectedSchool}
//           placeholder="Select School"
//         />
//         <select
//           value={selectedClass?.value || ""}
//           onChange={(e) =>
//             setSelectedClass(classOptions.find((c) => c.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Class</option>
//           {classOptions.map((c) => (
//             <option key={c.value} value={c.value}>
//               {c.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSection?.value || ""}
//           onChange={(e) =>
//             setSelectedSection(sectionOptions.find((s) => s.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Section</option>
//           {sectionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//         <select
//           value={selectedSession?.value || ""}
//           onChange={(e) =>
//             setSelectedSession(sessionOptions.find((s) => s.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded"
//         >
//           <option value="">Select Session</option>
//           {sessionOptions.map((s) => (
//             <option key={s.value} value={s.value}>
//               {s.label}
//             </option>
//           ))}
//         </select>
//       </div>

//       <h2 className="text-xl font-semibold mb-2">Students</h2>
//       <button
//         onClick={handleSelectAll}
//         className="mb-4 px-3 py-1 bg-blue-600 text-white rounded"
//       >
//         {selectAll ? "Deselect All" : "Select All"}
//       </button>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
//         {students.map((s) => (
//           <div
//             key={s.student_id}
//             className={`p-3 border rounded cursor-pointer ${
//               selectedStudents.includes(s.student_id) ? "bg-red-500" : "bg-white"
//             }`}
//             onClick={() => handleSelectStudent(s.student_id)}
//           >
//             {s.name}
//           </div>
//         ))}
//       </div>

//       <button
//         onClick={handleSubmit}
//         disabled={isSubmitting}
//         className="px-6 py-2 bg-green-600 text-white rounded"
//       >
//         {editingBatchId ? "Update Batch" : "Create Batch"}
//       </button>

//       <h2 className="text-xl font-semibold mt-8 mb-4">Existing Batches</h2>
//       <div className="space-y-4">
//         {batches.map((b) => (
//           <div
//             key={b.batch_id}
//             className="p-4 bg-white border rounded flex justify-between items-center"
//           >
//             <div>
//               <p className="font-semibold">{b.batch_name}</p>
//               <p className="text-sm text-red-600">
//                 Class {b.class_id} - Section {b.section_id} - Session {b.session_id}
//               </p>
//             </div>
//             <div className="space-x-2">
//               <button
//                 onClick={() => handleEdit(b)}
//                 className="px-3 py-1 bg-yellow-500 text-white rounded"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => handleDelete(b.batch_id)}
//                 className="px-3 py-1 bg-red-500 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;


