import endpoints from "@/api/endpoints";
import axios from "axios";
import { ArrowLeft, Edit2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";

interface Option {
  label: string;
  value: number;
}

interface Student {
  student_id: number;
  name: string;
  gender?: string;
}

interface Batch {
  batch_id: number;
  batch_name: string;
  school_id_fk: number;
  class_id: number;
  class_name?: string;
  section_id: number;
  section_name?: string;
  session_id: number;
  created_by: number;
  student_ids: number[];
  school_name?: string;
  boy_count?: number;
  girl_count?: number;
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
  const [searchQuery, setSearchQuery] = useState("");
  const totalBoys = students.filter(
    (s) => s.gender?.toLowerCase() === "male"
  ).length;
  const totalGirls = students.filter(
    (s) => s.gender?.toLowerCase() === "female"
  ).length;

  const navigate = useNavigate();

  useEffect(() => {
    fetchDropdownData();
    fetchBatches();
  }, []);

  // useEffect(() => {
  //   if (selectedClass && selectedSection && selectedSchool) {
  //     fetchStudents(
  //       selectedClass.value,
  //       selectedSection.value,
  //       selectedSchool.value,
  //       false
  //     );
  //   } else {
  //     setStudents([]);
  //     setSelectedStudents([]);
  //     setSelectAll(false);
  //   }
  // }, [selectedClass, selectedSection, selectedSchool]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedSchool && selectedSession) {
      fetchStudents(
        selectedClass.value,
        selectedSection.value,
        selectedSchool.value,
<<<<<<< HEAD
<<<<<<< HEAD
        selectedSession.value, // ✅ use session ID
        false
=======
        false // ⚠️ exclude_assigned = false for debug
>>>>>>> b74972c9 (main chla leave per)
=======
        false
>>>>>>> 693386cb (batches changes)
      );
    } else {
      setStudents([]);
      setSelectedStudents([]);
      setSelectAll(false);
    }
  }, [selectedClass, selectedSection, selectedSchool, selectedSession]);

  const fetchDropdownData = async () => {
    try {
      const [cls, sec, ses] = await Promise.all([
        axios.get(endpoints.batches.classes),
        axios.get(endpoints.batches.sections),
        axios.get(endpoints.batches.sessions),
      ]);

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 693386cb (batches changes)
      setClassOptions(
        cls.data.map((c: any) => ({ value: c.class_id, label: c.label }))
      );
      setSectionOptions(
        sec.data.map((s: any) => ({ value: s.section_id, label: s.label }))
      );
      setSessionOptions(
        ses.data.map((s: any) => ({
          value: s.session_id,
          label: s.session_name,
        }))
      );
<<<<<<< HEAD
=======
      setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
      setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
      setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
>>>>>>> b74972c9 (main chla leave per)
=======
>>>>>>> 693386cb (batches changes)
    } catch (err) {
      console.error("Dropdown fetch failed", err);
    }
  };

  const loadSchools = useCallback(async (input: string) => {
    try {
<<<<<<< HEAD
<<<<<<< HEAD
      const res = await axios.get(endpoints.schools.list, {
        params: { search: input },
      });
      return Array.isArray(res.data)
        ? res.data.map((s: any) => ({
            label: s.school_name,
            value: s.school_id,
          }))
=======
      const res = await axios.get(endpoints.schools.list, { params: { search: input } });
      return Array.isArray(res.data)
        ? res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }))
>>>>>>> b74972c9 (main chla leave per)
=======
      const res = await axios.get(endpoints.schools.list, {
        params: { search: input },
      });
      return Array.isArray(res.data)
        ? res.data.map((s: any) => ({
            label: s.school_name,
            value: s.school_id,
          }))
>>>>>>> 693386cb (batches changes)
        : [];
    } catch (err) {
      console.error("School search failed:", err);
      return [];
    }
  }, []);

  const fetchSchoolById = async (id: number) => {
    try {
      const res = await axios.get(endpoints.schools.list, {
        params: { school_id: id },
      });
      const school = res.data.find((s: any) => s.school_id === id);
      return school
        ? { value: id, label: school.school_name }
        : { value: id, label: `School ${id}` };
    } catch {
      return { value: id, label: `School ${id}` };
    }
  };
<<<<<<< HEAD
=======

>>>>>>> 693386cb (batches changes)
  const fetchStudents = async (
    class_id: number,
    section_id: number,
    school_id: number,
    session_id: number,
    excludeAssigned: boolean
  ) => {
    try {
      const res = await axios.get(endpoints.batches.filterStudents, {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 693386cb (batches changes)
        params: {
          class_id,
          section_id,
          school_id,
<<<<<<< HEAD
          session_id, // ✅ important
          exclude_assigned: excludeAssigned,
        },
=======
        params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
>>>>>>> b74972c9 (main chla leave per)
=======
          exclude_assigned: excludeAssigned,
        },
>>>>>>> 693386cb (batches changes)
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Student fetch failed:", err);
      setStudents([]);
    }
  };

  // const fetchStudents = async (
  //   class_id: number,
  //   section_id: number,
  //   school_id: number,
  //   excludeAssigned: boolean
  // ) => {
  //   try {
  //     const res = await axios.get(endpoints.batches.filterStudents, {
  //       params: {
  //         class_id,
  //         section_id,
  //         school_id,
  //         exclude_assigned: excludeAssigned,
  //       },
  //     });
  //     setStudents(Array.isArray(res.data) ? res.data : []);
  //   } catch (err) {
  //     console.error("Student fetch failed:", err);
  //     setStudents([]);
  //   }
  // };

  const fetchBatches = async () => {
    try {
      const res = await axios.get(endpoints.batches.get);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Batch fetch failed:", err);
      setBatches([]);
    }
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
      !selectedSchool ||
      !selectedClass ||
      !selectedSection ||
      !selectedSession ||
      selectedStudents.length === 0
    ) {
      alert("Please fill all fields and select at least one student.");
      return;
    }
    const teacherId = Number(localStorage.getItem("teacher_id"));
    if (!teacherId || isNaN(teacherId)) {
      alert("Teacher is not logged in or ID is missing. Please log in again.");
      return;
    }

    const payload = {
      school_id_fk: selectedSchool.value,
      created_by: teacherId, //
      class_id: selectedClass.value,
      section_id: selectedSection.value,
      session_id: selectedSession.value,
      student_ids: selectedStudents,
    };

    setIsSubmitting(true);
    try {
      if (editingBatchId) {
        await axios.put(endpoints.batches.update(editingBatchId), payload);
<<<<<<< HEAD
        alert(" Batch updated successfully!");
      } else {
        await axios.post(endpoints.batches.create, payload);
        alert(" Batch created successfully!");
=======
        alert("Batch updated!");
      } else {
        await axios.post(endpoints.batches.create, payload);
        alert("Batch created!");
>>>>>>> b74972c9 (main chla leave per)
      }
      fetchBatches();
      resetForm();
    } catch (error: any) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 400 &&
        error.response?.data?.detail?.includes("already exists")
      ) {
        alert(" This batch already exists.");
      } else {
        alert(" Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  // const handleEdit = async (b: Batch) => {
  //   setEditingBatchId(b.batch_id);
  //   setBatchName(b.batch_name);
  //   const schoolOption = await fetchSchoolById(b.school_id_fk);
  //   setSelectedSchool(schoolOption);
  //   setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
  //   setSelectedSection({
  //     value: b.section_id,
  //     label: `Section ${b.section_id}`,
  //   });
  //   setSelectedSession({
  //     value: b.session_id,
  //     label: `Session ${b.session_id}`,
  //   });

  //   await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
  //   const assignedRes = await axios.get<{ student_ids: number[] }>(
  //     `${endpoints.batches.get}/${b.batch_id}/students`
  //   );
  //   setSelectedStudents(assignedRes.data.student_ids || []);
  //   setSelectAll(false);
  // };

  const handleEdit = async (b: Batch) => {
    setEditingBatchId(b.batch_id);
    setBatchName(b.batch_name);
    const schoolOption = await fetchSchoolById(b.school_id_fk);
    setSelectedSchool(schoolOption);
    setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
    setSelectedSection({
      value: b.section_id,
      label: `Section ${b.section_id}`,
    });
    setSelectedSession({
      value: b.session_id,
      label: `Session ${b.session_id}`,
    });

<<<<<<< HEAD
    // ✅ FIXED: Now includes session_id
    await fetchStudents(
      b.class_id,
      b.section_id,
      b.school_id_fk,
      b.session_id,
      false
    );

    const assignedRes = await axios.get<{ student_ids: number[] }>(
      `${endpoints.batches.get}/${b.batch_id}/students`
    );
=======
    await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
    const assignedRes = await axios.get<{ student_ids: number[] }>(
      `${endpoints.batches.get}/${b.batch_id}/students`
    );
>>>>>>> b74972c9 (main chla leave per)
    setSelectedStudents(assignedRes.data.student_ids || []);
    setSelectAll(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this batch?")) return;
    await axios.delete(endpoints.batches.delete(id));
    fetchBatches();
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="mr-1" size={18} />
          Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">
        {editingBatchId ? "Edit Batch" : "Create Batch"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
<<<<<<< HEAD
        {/* <AsyncSelect
=======
        <AsyncSelect
>>>>>>> 693386cb (batches changes)
          cacheOptions
          loadOptions={loadSchools}
          onChange={(val) => setSelectedSchool(val)}
          value={selectedSchool}
          placeholder="Select School"
          className="text-black dark:text-white"
        /> */}

        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadSchools}
          onChange={(val) => setSelectedSchool(val)}
          value={selectedSchool}
          placeholder="Select School"
          className="text-black dark:text-white"
        />

        <select
          value={selectedClass?.value || ""}
          onChange={(e) =>
            setSelectedClass(
              classOptions.find((c) => c.value === Number(e.target.value)) ||
                null
            )
          }
          className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
            setSelectedSection(
              sectionOptions.find((s) => s.value === Number(e.target.value)) ||
                null
            )
          }
          className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
            setSelectedSession(
              sessionOptions.find((s) => s.value === Number(e.target.value)) ||
                null
            )
          }
          className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
<<<<<<< HEAD
        {students.map((s) => {
          const isSelected = selectedStudents.includes(s.student_id);
          const isPreviouslyAssigned = editingBatchId && isSelected;

          return (
            <div
              key={s.student_id}
              className={`p-3 border rounded cursor-pointer transition 
    ${
      isSelected
        ? "bg-green-500 text-white"
        : "bg-white dark:bg-gray-800 text-black dark:text-white"
    }
    ${editingBatchId && isSelected ? "border-4 border-blue-500" : ""}`}
              onClick={() => handleSelectStudent(s.student_id)}
            >
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-green-700 dark:text-gray-300">
                ID: {s.student_id}
              </p>
            </div>
          );
        })}
=======
        {students.map((s) => (
          <div
            key={s.student_id}
            className={`p-3 border rounded cursor-pointer transition ${
              selectedStudents.includes(s.student_id)
                ? "bg-green-500 text-white"
                : "bg-white dark:bg-gray-800"
            }`}
            onClick={() => handleSelectStudent(s.student_id)}
          >
            {s.name}
          </div>
        ))}
>>>>>>> 693386cb (batches changes)
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="px-6 py-2 bg-green-600 text-white rounded"
      >
        {editingBatchId ? "Update Batch" : "Create Batch"}
      </button>

<<<<<<< HEAD
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-8 mb-4">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Existing Batches</h2>
        <input
          type="text"
          placeholder="🔍 Search by name or school"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-96 md:w-96 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.length > 0 ? (
          batches
            .filter(
              (b) =>
                b.batch_name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                (b.school_name || "")
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
            )
            .map((b) => (
              <div
                key={b.batch_id}
                className="p-5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-md transform hover:scale-[1.02] hover:shadow-lg transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                    {b.batch_name}
                  </p>
                  <p className="text-xl text-red-500 dark:text-gray-300 mb-2">
                    {b.school_name || `School ${b.school_id_fk}`}
                  </p>

                  <p className="text-xl text-gray-800 dark:text-gray-200">
                    Boys:{" "}
                    <span className="font-bold text-blue-600">
                      {b.boy_count || 0}
                    </span>
                    {" | "}
                    Girls:{" "}
                    <span className="font-bold text-pink-500">
                      {b.girl_count || 0}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(b)}
                    className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow"
                    title="Edit Batch"
                  >
                    <Edit2 size={22} />
                  </button>
                  {/* <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this batch?")
                      ) {
                        handleDelete(b.batch_id);
                      }
                    }}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center"
                    title="Delete Batch"
                  >
                    <Trash2 size={22} />
                  </button> */}
                </div>
              </div>
            ))
=======
      <h2 className="text-xl font-semibold mt-8 mb-4">Existing Batches</h2>
      <div className="space-y-4 w-full">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">
          Existing Batches
        </h2>
        {batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {batches.map((b) => (
              <div
                key={b.batch_id}
                className="p-4 bg-gradient-to-r from-white via-gray-100 to-white dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 border dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                      {b.batch_name}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {b.school_name || "Unnamed School"}
                    </p>
                    {/* Add class/section/session here if needed */}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow"
                      title="Edit"
                    >
                      ✏️ {/* Edit Icon */}
                    </button>
                    
              {/* <button
                onClick={() => handleDelete(b.batch_id)}
                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow"
                title="Delete"
              >
                🗑️
              </button> */}
             
                  </div>
                </div>
              </div>
<<<<<<< HEAD
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
          ))
>>>>>>> b74972c9 (main chla leave per)
=======
            ))}
          </div>
>>>>>>> 693386cb (batches changes)
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            No batches available.
          </p>
        )}
      </div>
    </div>
  );
};

export default BatchAssignment;
<<<<<<< HEAD
=======

// import endpoints from "@/api/endpoints";
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
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
//   class_name?: string;
//   section_id: number;
//   section_name?: string;
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

//   const navigate = useNavigate();

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
//         false // ⚠️ exclude_assigned = false for debug
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
//         axios.get(endpoints.batches.classes),
//         axios.get(endpoints.batches.sections),
//         axios.get(endpoints.batches.sessions),
//       ]);

//       setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
//       setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
//       setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
//     } catch (err) {
//       console.error("Dropdown fetch failed", err);
//     }
//   };

//   const loadSchools = useCallback(async (input: string) => {
//     try {
//       const res = await axios.get(endpoints.schools.list, { params: { search: input } });
//       return Array.isArray(res.data)
//         ? res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }))
//         : [];
//     } catch (err) {
//       console.error("School search failed:", err);
//       return [];
//     }
//   }, []);

//   const fetchStudents = async (
//     class_id: number,
//     section_id: number,
//     school_id: number,
//     excludeAssigned: boolean
//   ) => {
//     try {
//       const res = await axios.get(endpoints.batches.filterStudents, {
//         params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
//       });
//       setStudents(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Student fetch failed:", err);
//       setStudents([]);
//     }
//   };

//   const fetchBatches = async () => {
//     try {
//       const res = await axios.get(endpoints.batches.get);
//       setBatches(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Batch fetch failed:", err);
//       setBatches([]);
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
//         await axios.put(endpoints.batches.update(editingBatchId), payload);
//         alert("Batch updated!");
//       } else {
//         await axios.post(endpoints.batches.create, payload);
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
//     // setSelectedSchool({ value: b.school_id_fk, label: `School ${b.school_id_fk}` });
//     setSelectedClass({ value: b.class_id, label: `Class ${b.class_id}` });
//     setSelectedSection({ value: b.section_id, label: `Section ${b.section_id}` });
//     setSelectedSession({ value: b.session_id, label: `Session ${b.session_id}` });

//     await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
//     const assignedRes = await axios.get<{ student_ids: number[] }>(
//       `${endpoints.batches.get}/${b.batch_id}/students`
//     );
//     setSelectedStudents(assignedRes.data.student_ids || []);
//     setSelectAll(false);
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this batch?")) return;
//     await axios.delete(endpoints.batches.delete(id));
//     fetchBatches();
//   };

//   return (
//     <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//       <div className="mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
//         >
//           <ArrowLeft className="mr-1" size={18} />
//           Back
//         </button>
//       </div>

//       <h1 className="text-2xl font-bold mb-4">{editingBatchId ? "Edit Batch" : "Create Batch"}</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         {/* <input
//           type="text"
//           placeholder="Batch Name"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
//         /> */}
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={(val) => setSelectedSchool(val)}
//           value={selectedSchool}
//           placeholder="Select School"
//           className="text-black dark:text-white"
//         />
//         <select
//           value={selectedClass?.value || ""}
//           onChange={(e) =>
//             setSelectedClass(classOptions.find((c) => c.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//             className={`p-3 border rounded cursor-pointer transition ${
//               selectedStudents.includes(s.student_id)
//                 ? "bg-green-500 text-white"
//                 : "bg-white dark:bg-gray-800"
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
//         {batches.length > 0 ? (
//           batches.map((b) => (
//             <div
//               key={b.batch_id}
//               className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded flex justify-between items-center"
//             >
//               <div>
//                 <p className="font-semibold">{b.batch_name}</p>
//                 <p className="text-sm text-red-600 dark:text-red-400">
//                   Class {b.class_name || b.class_id} - Section {b.section_name || b.section_id} - Session {b.session_id}
//                 </p>
//               </div>
//               <div className="space-x-2">
//                 <button
//                   onClick={() => handleEdit(b)}
//                   className="px-3 py-1 bg-yellow-500 text-white rounded"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(b.batch_id)}
//                   className="px-3 py-1 bg-red-500 text-white rounded"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No batches available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;

// import endpoints from "@/api/endpoints"; // ✅ Make sure this path is correct
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
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

//   const navigate = useNavigate();

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
//     try {
//       const [cls, sec, ses] = await Promise.all([
//         axios.get(endpoints.batches.classes),
//         axios.get(endpoints.batches.sections),
//         axios.get(endpoints.batches.sessions),
//       ]);

//       if (Array.isArray(cls.data)) {
//         setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
//       }

//       if (Array.isArray(sec.data)) {
//         setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
//       }

//       if (Array.isArray(ses.data)) {
//         setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
//       }
//     } catch (err) {
//       console.error("Dropdown fetch failed", err);
//     }
//   };

//   const loadSchools = useCallback(async (input: string) => {
//     try {
//       const res = await axios.get(endpoints.schools.list, { params: { search: input } });
//       return Array.isArray(res.data)
//         ? res.data.map((s: any) => ({ label: s.school_name, value: s.school_id }))
//         : [];
//     } catch (err) {
//       console.error("School search failed:", err);
//       return [];
//     }
//   }, []);

//   const fetchStudents = async (
//     class_id: number,
//     section_id: number,
//     school_id: number,
//     excludeAssigned: boolean
//   ) => {
//     try {
//       const res = await axios.get(endpoints.batches.filterStudents, {
//         params: { class_id, section_id, school_id, exclude_assigned: excludeAssigned },
//       });
//       setStudents(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Student fetch failed:", err);
//       setStudents([]);
//     }
//   };

//   const fetchBatches = async () => {
//     try {
//       const res = await axios.get(endpoints.batches.get);
//       setBatches(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Batch fetch failed:", err);
//       setBatches([]);
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
//       created_by: 1,
//       class_id: selectedClass.value,
//       section_id: selectedSection.value,
//       session_id: selectedSession.value,
//       student_ids: selectedStudents,
//     };

//     setIsSubmitting(true);
//     try {
//       if (editingBatchId) {
//         await axios.put(endpoints.batches.update(editingBatchId), payload);
//         alert("Batch updated!");
//       } else {
//         await axios.post(endpoints.batches.create, payload);
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
//       `${endpoints.batches.get}/${b.batch_id}/students`
//     );
//     setSelectedStudents(assignedRes.data.student_ids || []);
//     setSelectAll(false);
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Delete this batch?")) return;
//     await axios.delete(endpoints.batches.delete(id));
//     fetchBatches();
//   };

//   return (
//     <div className="p-6 min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//       <div className="mb-4">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-sm hover:text-blue-600 dark:hover:text-blue-400 transition"
//         >
//           <ArrowLeft className="mr-1" size={18} />
//           Back
//         </button>
//       </div>

//       <h1 className="text-2xl font-bold mb-4">{editingBatchId ? "Edit Batch" : "Create Batch"}</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Batch Name"
//           value={batchName}
//           onChange={(e) => setBatchName(e.target.value)}
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
//         />
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={(val) => setSelectedSchool(val)}
//           value={selectedSchool}
//           placeholder="Select School"
//           className="text-black dark:text-white"
//         />
//         <select
//           value={selectedClass?.value || ""}
//           onChange={(e) =>
//             setSelectedClass(classOptions.find((c) => c.value === Number(e.target.value)) || null)
//           }
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//           className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
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
//             className={`p-3 border rounded cursor-pointer transition ${
//               selectedStudents.includes(s.student_id)
//                 ? "bg-red-500 text-white"
//                 : "bg-white dark:bg-gray-800"
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
//         {Array.isArray(batches) && batches.length > 0 ? (
//           batches.map((b) => (
//             <div
//               key={b.batch_id}
//               className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded flex justify-between items-center"
//             >
//               <div>
//                 <p className="font-semibold">{b.batch_name}</p>
//                 <p className="text-sm text-red-600 dark:text-red-400">
//                   Class {b.class_id} - Section {b.section_id} - Session {b.session_id}
//                 </p>
//               </div>
//               <div className="space-x-2">
//                 <button
//                   onClick={() => handleEdit(b)}
//                   className="px-3 py-1 bg-yellow-500 text-white rounded"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(b.batch_id)}
//                   className="px-3 py-1 bg-red-500 text-white rounded"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No batches available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default BatchAssignment;
<<<<<<< HEAD























>>>>>>> b74972c9 (main chla leave per)
=======
>>>>>>> 693386cb (batches changes)
