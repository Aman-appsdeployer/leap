import endpoints from "@/api/endpoints";
import { Option } from "@/types";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Student {
  student_id: number;
  name: string;
  gender?: string;
  class_id_fk?: number;
  section_id_fk?: number;
  school_id_fk?: number;
}

const PromoteStudents: React.FC = () => {
  const navigate = useNavigate();

  const [currentSchool, setCurrentSchool] = useState<Option | null>(null);
  const [currentClass, setCurrentClass] = useState<Option | null>(null);
  const [currentSection, setCurrentSection] = useState<Option | null>(null);
  const [currentSession, setCurrentSession] = useState<Option | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [promotedStudents, setPromotedStudents] = useState<Student[]>([]);

  const [nextClass, setNextClass] = useState<Option | null>(null);
  const [nextSection, setNextSection] = useState<Option | null>(null);
  const [nextSession, setNextSession] = useState<Option | null>(null);
  const [nextSchool, setNextSchool] = useState<Option | null>(null);

  const [classOptions, setClassOptions] = useState<Option[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

  useEffect(() => {
    fetchClassSectionSession();
  }, []);

  useEffect(() => {
    if (currentSchool && currentClass && currentSection && currentSession) {
      fetchStudents();
      setPromotedStudents([]); // Clear previous promoted view
    }
  }, [currentSchool, currentClass, currentSection, currentSession]);

  const fetchClassSectionSession = async () => {
    const [cls, sec, ses] = await Promise.all([
      axios.get(endpoints.batches.classes),
      axios.get(endpoints.batches.sections),
      axios.get(endpoints.batches.sessions),
    ]);
    setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
    setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
    setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(endpoints.batches.filterStudents, {
        params: {
          school_id: currentSchool?.value,
          class_id: currentClass?.value,
          section_id: currentSection?.value,
          session_id: currentSession?.value,
          exclude_assigned: false,
        },
      });
      setStudents(res.data);
      setSelectedStudentIds([]);
      setAllSelected(false);
    } catch (err) {
      toast.error("Failed to fetch students.");
      console.error(err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadSchools = async (input: string) => {
    try {
      const res = await axios.get(endpoints.schools.list, {
        params: { search: input },
      });
      return res.data.map((s: any) => ({
        value: s.school_id,
        label: s.school_name,
      }));
    } catch {
      return [];
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handlePromote = async () => {
    if (!nextClass || !nextSection || !nextSession || !nextSchool || selectedStudentIds.length === 0) {
      toast.error("Please fill all promotion fields and select students.");
      return;
    }

    if (
      currentClass?.value === nextClass.value &&
      currentSection?.value === nextSection.value &&
      currentSession?.value === nextSession.value &&
      currentSchool?.value === nextSchool.value
    ) {
      toast.error("New class, section, session or school must differ from current.");
      return;
    }

    try {
      await axios.post(endpoints.batches.promote, {
        student_ids: selectedStudentIds,
        new_class_id: nextClass.value,
        new_section_id: nextSection.value,
        new_session_id: nextSession.value,
        new_school_id: nextSchool.value,
      });

      const promotedList = students.filter((s) => selectedStudentIds.includes(s.student_id));
      setPromotedStudents(promotedList);

      setSelectedStudentIds([]);
      setAllSelected(false);
      fetchStudents();

      setTimeout(() => navigate(-1), 5000); //  redirect back
    } catch (err) {
      toast.error("Promotion failed.");
      console.error(err);
    }
  };

  const handleSelectAllToggle = () => {
    if (allSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.student_id));
    }
    setAllSelected(!allSelected);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-blue-600 hover:underline"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-center">Promote Students</h1>

      {/* Current Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <AsyncSelect
          cacheOptions
          loadOptions={loadSchools}
          onChange={(option) => {
            setCurrentSchool(option);
            if (!nextSchool || nextSchool?.value === option?.value) {
              setNextSchool(option);
            }
          }}
          value={currentSchool}
          placeholder="Search Current School"
        />
        <select
          onChange={(e) => setCurrentClass(classOptions.find((c) => c.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={currentClass?.value || ""}
        >
          <option value="">Current Class</option>
          {classOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => setCurrentSection(sectionOptions.find((s) => s.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={currentSection?.value || ""}
        >
          <option value="">Current Section</option>
          {sectionOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => setCurrentSession(sessionOptions.find((s) => s.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={currentSession?.value || ""}
        >
          <option value="">Current Session</option>
          {sessionOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <h1 className="text-xl font-semibold mb-2">Select Students</h1>
      {students.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleSelectAllToggle}
            className={`px-4 py-2 rounded text-sm font-medium shadow-md transition duration-200 ${
              allSelected ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      {loadingStudents ? (
        <div className="text-center py-8">Loading students...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {students.map((s) => {
            const isSelected = selectedStudentIds.includes(s.student_id);
            return (
              <div
                key={s.student_id}
                onClick={() => toggleStudent(s.student_id)}
                className={`cursor-pointer border rounded-lg shadow-sm p-4 transition-all duration-200 hover:scale-105 ${
                  isSelected ? "bg-green-600 text-white ring-2 ring-green-300" : "bg-white dark:bg-gray-800"
                }`}
              >
                <p className="font-bold text-lg mb-1">{s.name}</p>
                <p className="text-sm">ID: {s.student_id}</p>
                <p className="text-sm">Gender: {s.gender || "N/A"}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Promotion Form */}
      <h1 className="text-3xl font-semibold mb-4">Promotion Details</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          onChange={(e) => setNextClass(classOptions.find((c) => c.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={nextClass?.value || ""}
        >
          <option value="">Next Class</option>
          {classOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => setNextSection(sectionOptions.find((s) => s.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={nextSection?.value || ""}
        >
          <option value="">Next Section</option>
          {sectionOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => setNextSession(sessionOptions.find((s) => s.value === +e.target.value) || null)}
          className="p-2 border rounded"
          value={nextSession?.value || ""}
        >
          <option value="">Next Session</option>
          {sessionOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <AsyncSelect
          cacheOptions
          loadOptions={loadSchools}
          onChange={setNextSchool}
          value={nextSchool}
          placeholder="Search Next School"
        />
      </div>

      <button
        onClick={handlePromote}
        className={`px-6 py-2 rounded text-white shadow-md transition duration-300 ${
          selectedStudentIds.length === 0 || !nextClass || !nextSection || !nextSession || !nextSchool
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        disabled={
          selectedStudentIds.length === 0 || !nextClass || !nextSection || !nextSession || !nextSchool
        }
      >
        Promote Selected Students
      </button>

      {/*  Promoted Students Section */}
      {promotedStudents.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-green-600">🎓 Promoted Students</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {promotedStudents.map((s) => (
              <div
                key={s.student_id}
                className="border rounded-lg shadow p-4 bg-green-100 dark:bg-green-900"
              >
                <p className="font-bold text-lg mb-1 text-green-900 dark:text-white">{s.name}</p>
                <p className="text-sm text-green-800 dark:text-green-200">ID: {s.student_id}</p>
                <p className="text-sm text-green-800 dark:text-green-200">Gender: {s.gender || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default PromoteStudents;







// import endpoints from "@/api/endpoints";
// import { Option } from "@/types";
// import axios from "axios";
// import { ArrowLeft } from "lucide-react";
// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AsyncSelect from "react-select/async";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// interface Student {
//   student_id: number;
//   name: string;
//   gender?: string;
//   class_id_fk?: number;
//   section_id_fk?: number;
//   school_id_fk?: number;
// }

// const PromoteStudents: React.FC = () => {
//   const navigate = useNavigate();

//   const [currentSchool, setCurrentSchool] = useState<Option | null>(null);
//   const [currentClass, setCurrentClass] = useState<Option | null>(null);
//   const [currentSection, setCurrentSection] = useState<Option | null>(null);
//   const [currentSession, setCurrentSession] = useState<Option | null>(null);

//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
//   const [allSelected, setAllSelected] = useState(false);
//   const [loadingStudents, setLoadingStudents] = useState(false);

//   const [nextClass, setNextClass] = useState<Option | null>(null);
//   const [nextSection, setNextSection] = useState<Option | null>(null);
//   const [nextSession, setNextSession] = useState<Option | null>(null);
//   const [nextSchool, setNextSchool] = useState<Option | null>(null);

//   const [classOptions, setClassOptions] = useState<Option[]>([]);
//   const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
//   const [sessionOptions, setSessionOptions] = useState<Option[]>([]);

//   useEffect(() => {
//     fetchClassSectionSession();
//   }, []);

//   useEffect(() => {
//     if (currentSchool && currentClass && currentSection && currentSession) {
//       fetchStudents();
//     }
//   }, [currentSchool, currentClass, currentSection, currentSession]);
  

//   const fetchClassSectionSession = async () => {
//     const [cls, sec, ses] = await Promise.all([
//       axios.get(endpoints.batches.classes),
//       axios.get(endpoints.batches.sections),
//       axios.get(endpoints.batches.sessions),
//     ]);
//     setClassOptions(cls.data.map((c: any) => ({ value: c.class_id, label: c.label })));
//     setSectionOptions(sec.data.map((s: any) => ({ value: s.section_id, label: s.label })));
//     setSessionOptions(ses.data.map((s: any) => ({ value: s.session_id, label: s.session_name })));
//   };

//   const fetchStudents = async () => {
//     setLoadingStudents(true);
//     try {
//       const res = await axios.get(endpoints.batches.filterStudents, {
//         params: {
//           school_id: currentSchool?.value,
//           class_id: currentClass?.value,
//           section_id: currentSection?.value,
//           session_id: currentSession?.value,
//           exclude_assigned: false,
//         },
//       });
//       setStudents(res.data);
//       setSelectedStudentIds([]);
//       setAllSelected(false);
//     } catch (err) {
//       toast.error("Failed to fetch students.");
//       console.error(err);
//       setStudents([]);
//     } finally {
//       setLoadingStudents(false);
//     }
//   };

//   const loadSchools = async (input: string) => {
//     try {
//       const res = await axios.get(endpoints.schools.list, {
//         params: { search: input },
//       });
//       return res.data.map((s: any) => ({
//         value: s.school_id,
//         label: s.school_name,
//       }));
//     } catch {
//       return [];
//     }
//   };

//   const toggleStudent = (id: number) => {
//     setSelectedStudentIds((prev) =>
//       prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
//     );
//   };

//   const handlePromote = async () => {
//     if (
//       !nextClass ||
//       !nextSection ||
//       !nextSession ||
//       !nextSchool ||
//       selectedStudentIds.length === 0
//     ) {
//       toast.error("Please fill all promotion fields and select students.");
//       return;
//     }

//     if (
//       currentClass?.value === nextClass.value &&
//       currentSection?.value === nextSection.value &&
//       currentSession?.value === nextSession.value &&
//       currentSchool?.value === nextSchool.value
//     ) {
//       toast.error("New class, section, session or school must differ from current.");
//       return;
//     }

//     try {
//       await axios.post(endpoints.batches.promote, {
//         student_ids: selectedStudentIds,
//         new_class_id: nextClass.value,
//         new_section_id: nextSection.value,
//         new_session_id: nextSession.value,
//         new_school_id: nextSchool.value,
//       });
//       toast.success("Students promoted successfully.");
//       setSelectedStudentIds([]);
//       setAllSelected(false);
//       fetchStudents();
//     } catch (err) {
//       toast.error("Promotion failed.");
//       console.error(err);
//     }
//   };

//   const handleSelectAllToggle = () => {
//     if (allSelected) {
//       setSelectedStudentIds([]);
//     } else {
//       setSelectedStudentIds(students.map((s) => s.student_id));
//     }
//     setAllSelected(!allSelected);
//   };

//   return (
//     <div className="p-6 bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen transition-opacity duration-300 animate-fade-in">
//       <button
//         onClick={() => navigate(-1)}
//         className="mb-4 flex items-center text-blue-600 hover:underline"
//       >
//         <ArrowLeft className="mr-2" /> 
//       </button>

//       <h1 className="text-3xl font-bold mb-6 text-center">Promote Students</h1>

//       {/* Current Filters */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={(option) => {
//             setCurrentSchool(option);
//             if (!nextSchool || nextSchool?.value === option?.value) {
//               setNextSchool(option);
//             }
//           }}
//           value={currentSchool}
//           placeholder="Search Current School"
//         />
//         <select
//           onChange={(e) =>
//             setCurrentClass(classOptions.find((c) => c.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={currentClass?.value || ""}
//         >
//           <option value="">Current Class</option>
//           {classOptions.map((c) => (
//             <option key={c.value} value={c.value}>{c.label}</option>
//           ))}
//         </select>
//         <select
//           onChange={(e) =>
//             setCurrentSection(sectionOptions.find((s) => s.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={currentSection?.value || ""}
//         >
//           <option value="">Current Section</option>
//           {sectionOptions.map((s) => (
//             <option key={s.value} value={s.value}>{s.label}</option>
//           ))}
//         </select>
//         <select
//           onChange={(e) =>
//             setCurrentSession(sessionOptions.find((s) => s.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={currentSession?.value || ""}
//         >
//           <option value="">Current Session</option>
//           {sessionOptions.map((s) => (
//             <option key={s.value} value={s.value}>{s.label}</option>
//           ))}
//         </select>
//       </div>

//       {/* Student List */}
//       <h1 className="text-xl font-semibold mb-2">Select Students</h1>
//       {students.length > 0 && (
//         <div className="mb-4">
//           <button
//             onClick={handleSelectAllToggle}
//             className={`px-4 py-2 rounded text-sm font-medium shadow-md transition duration-200 ${
//               allSelected ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
//             } text-white`}
//           >
//             {allSelected ? "Deselect All" : "Select All"}
//           </button>
//         </div>
//       )}

//       {loadingStudents ? (
//         <div className="text-center py-8">Loading students...</div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-opacity duration-500">
//           {students.map((s) => {
//             const isSelected = selectedStudentIds.includes(s.student_id);
//             return (
//               <div
//                 key={s.student_id}
//                 onClick={() => toggleStudent(s.student_id)}
//                 className={`cursor-pointer border rounded-lg shadow-sm p-4 transition-all duration-200 hover:scale-105 ${
//                   isSelected
//                     ? "bg-green-600 text-white ring-2 ring-green-300"
//                     : "bg-white dark:bg-gray-800"
//                 }`}
//               >
//                 <p className="font-bold text-lg mb-1">{s.name}</p>
//                 <p className="text-sm">ID: {s.student_id}</p>
//                 <p className="text-sm">Gender: {s.gender || "N/A"}</p>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Promotion Form */}
//       <h1 className="text-3xl font-semibold mb-4">Promotion Details</h1>
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//         <select
//           onChange={(e) =>
//             setNextClass(classOptions.find((c) => c.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={nextClass?.value || ""}
//         >
//           <option value="">Next Class</option>
//           {classOptions.map((c) => (
//             <option key={c.value} value={c.value}>{c.label}</option>
//           ))}
//         </select>
//         <select
//           onChange={(e) =>
//             setNextSection(sectionOptions.find((s) => s.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={nextSection?.value || ""}
//         >
//           <option value="">Next Section</option>
//           {sectionOptions.map((s) => (
//             <option key={s.value} value={s.value}>{s.label}</option>
//           ))}
//         </select>
//         <select
//           onChange={(e) =>
//             setNextSession(sessionOptions.find((s) => s.value === +e.target.value) || null)
//           }
//           className="p-2 border rounded"
//           value={nextSession?.value || ""}
//         >
//           <option value="">Next Session</option>
//           {sessionOptions.map((s) => (
//             <option key={s.value} value={s.value}>{s.label}</option>
//           ))}
//         </select>
//         <AsyncSelect
//           cacheOptions
//           loadOptions={loadSchools}
//           onChange={setNextSchool}
//           value={nextSchool}
//           placeholder="Search Next School"
//         />
//       </div>

//       <button
//         onClick={handlePromote}
//         className={`px-6 py-2 rounded text-white shadow-md transition duration-300 ${
//           selectedStudentIds.length === 0 || !nextClass || !nextSection || !nextSession || !nextSchool
//             ? "bg-gray-400 cursor-not-allowed"
//             : "bg-blue-600 hover:bg-blue-700"
//         }`}
//         disabled={
//           selectedStudentIds.length === 0 || !nextClass || !nextSection || !nextSession || !nextSchool
//         }
//       >
//         Promote Selected Students
//       </button>

//       <ToastContainer position="top-center" autoClose={2000} />
//     </div>
//   );
// };

// export default PromoteStudents;









