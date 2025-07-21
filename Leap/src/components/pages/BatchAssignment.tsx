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

  const navigate = useNavigate();

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
        false
      );
    } else {
      setStudents([]);
      setSelectedStudents([]);
      setSelectAll(false);
    }
  }, [selectedClass, selectedSection, selectedSchool]);

  const fetchDropdownData = async () => {
    try {
      const [cls, sec, ses] = await Promise.all([
        axios.get(endpoints.batches.classes),
        axios.get(endpoints.batches.sections),
        axios.get(endpoints.batches.sessions),
      ]);

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
    } catch (err) {
      console.error("Dropdown fetch failed", err);
    }
  };

  const loadSchools = useCallback(async (input: string) => {
    try {
      const res = await axios.get(endpoints.schools.list, {
        params: { search: input },
      });
      return Array.isArray(res.data)
        ? res.data.map((s: any) => ({
            label: s.school_name,
            value: s.school_id,
          }))
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

  const fetchStudents = async (
    class_id: number,
    section_id: number,
    school_id: number,
    excludeAssigned: boolean
  ) => {
    try {
      const res = await axios.get(endpoints.batches.filterStudents, {
        params: {
          class_id,
          section_id,
          school_id,
          exclude_assigned: excludeAssigned,
        },
      });
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Student fetch failed:", err);
      setStudents([]);
    }
  };

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

    const payload = {
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
        await axios.put(endpoints.batches.update(editingBatchId), payload);
        alert("Batch updated!");
      } else {
        await axios.post(endpoints.batches.create, payload);
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

    await fetchStudents(b.class_id, b.section_id, b.school_id_fk, false);
    const assignedRes = await axios.get<{ student_ids: number[] }>(
      `${endpoints.batches.get}/${b.batch_id}/students`
    );
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
        <AsyncSelect
          cacheOptions
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
        {students.map((s) => (
          <div
            key={s.student_id}
            className={`p-3 border rounded cursor-pointer transition ${
              selectedStudents.includes(s.student_id)
                ? "bg-green-500 text-white"
                : "bg-white dark:bg-gray-800 text-black dark:text-white"
            }`}
            onClick={() => handleSelectStudent(s.student_id)}
          >
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-green-700 dark:text-gray-300">
              ID: {s.student_id}
            </p>
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
        {batches.length > 0 ? (
          batches.map((b) => (
            <div
              key={b.batch_id}
              className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{b.batch_name}</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {b.school_name || `School ${b.school_id_fk}`}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(b)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded flex items-center justify-center"
                >
                  <Edit2 size={16} />
                </button>
                {/* <button
                  onClick={() => handleDelete(b.batch_id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button> */}
              </div>
            </div>
          ))
        ) : (
          <p>No batches available.</p>
        )}
      </div>
    </div>
  );
};

export default BatchAssignment;





