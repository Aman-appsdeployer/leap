<<<<<<< HEAD
import endpoints from "@/api/endpoints";
=======
import { BASE_URL } from "@/api/endpoints";
>>>>>>> b74972c9 (main chla leave per)
import axios from "axios";
import { saveAs } from "file-saver";
import {
  Edit2,
  FilePlus,
  FileText,
  Layers,
  ListChecks,
<<<<<<< HEAD
  LogOut,
  Menu,
  Moon,
  Sun,
  Trash,
  Users,
=======
  LogOut, Menu, Moon,
  Sun,
  Users
>>>>>>> 693386cb (batches changes)
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

<<<<<<< HEAD
=======


// UI Components
>>>>>>> b74972c9 (main chla leave per)
const Button = ({ className = "", ...props }) => (
  <button className={`px-4 py-2 rounded-lg ${className}`} {...props} />
);
const Input = ({ className = "", ...props }) => (
  <input
    type="text"
    className={`border p-2 rounded-lg ${className}`}
    {...props}
    required
  />
);
const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`border p-2 rounded-lg ${className}`}
    {...props}
    required
  />
);
const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children }) => <div className="p-4">{children}</div>;

const QuizManagement = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([
    { question: "", options: [""], answer: "" },
  ]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [description, setDescription] = useState("");

  const addQuestion = () =>
    setQuestions([...questions, { question: "", options: [""], answer: "" }]);

  const deleteQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push("");
    setQuestions(updated);
  };

  const deleteOption = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const updateQuestion = (index, value) => {
    const updated = [...questions];
    updated[index].question = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const updateAnswer = (index, value) => {
    const updated = [...questions];
    updated[index].answer = value;
    setQuestions(updated);
  };

  const isFormValid = () => {
    if (!quizTitle.trim()) return false;

    for (const q of questions) {
      const trimmedOptions = q.options.map((opt) => opt.trim()).filter(Boolean);
      if (!q.question.trim()) return false;
      if (trimmedOptions.length < 2) return false;
      if (!trimmedOptions.includes(q.answer.trim())) return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      return alert(
        "Please fix the following:\n- All questions must be filled\n- Each question must have at least 2 options\n- One correct answer must be selected."
      );
    }
    const payload = {
      quiz_title: quizTitle,
      description: description,
      created_by_mentor_id_fk: Number(localStorage.getItem("teacher_id")),
      questions: questions.map((q) => ({
        question_text: q.question,
        question_type: "mcq",
        points: 1,
        options: q.options.map((opt) => ({
          option_text: opt,
          is_correct: opt === q.answer,
        })),
      })),
    };

<<<<<<< HEAD
    const url = editingQuizId
      ? endpoints.quizzes.update(editingQuizId)
      : endpoints.quizzes.create;
=======
    const url = editingQuizId ? `${BASE_URL}/api/quizzes/quiz/${editingQuizId}` : `${BASE_URL}/api/quizzes/quiz`;
>>>>>>> b74972c9 (main chla leave per)
    const method = editingQuizId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        alert(editingQuizId ? "Quiz updated!" : "Quiz created!");
        resetForm();
        fetchQuizzes();
      } else alert("Failed to save quiz.");
<<<<<<< HEAD
    } catch (err) {
      console.error(err);
      alert("Quiz save failed.");
=======
    } catch (error) {
      console.error("Quiz save failed:", error);
      alert("Error saving quiz");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/quizzes`);
      setQuizzes(res.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      alert("Failed to load quizzes.");
>>>>>>> b74972c9 (main chla leave per)
    }
  };

  const resetForm = () => {
    setQuizTitle("");
    setQuestions([{ question: "", options: [""], answer: "" }]);
    setEditingQuizId(null);
  };

  const fetchQuizzes = async () => {
    try {
<<<<<<< HEAD
      const res = await axios.get(endpoints.quizzes.getAll);
      setAllQuizzes(res.data);
      setQuizzes(res.data);
    } catch (err) {
      alert("Failed to fetch quizzes.");
=======
      await axios.delete(`${BASE_URL}/api/quizzes/quiz/${quizId}`);
      alert("Deleted");
      fetchQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz.");
>>>>>>> b74972c9 (main chla leave per)
    }
  };

  const handleEdit = (quiz) => {
    setQuizTitle(quiz.quiz_title);
<<<<<<< HEAD
    axios.get(endpoints.quizzes.getById(quiz.quiz_id)).then((res) => {
=======
    axios.get(`${BASE_URL}/api/quizzes/quiz/${quiz.quiz_id}`).then((res) => {
>>>>>>> b74972c9 (main chla leave per)
      const { questions } = res.data;
      setQuestions(
        questions.map((q) => ({
          question: q.question_text,
          options: q.options.map((o) => o.option_text),
          answer: q.options.find((o) => o.is_correct)?.option_text || "",
        }))
      );
      setEditingQuizId(quiz.quiz_id);
    });
  };

  const handleViewReport = async (quizId) => {
    try {
<<<<<<< HEAD
      const res = await axios.get(
        `http://localhost:8000/api/quizzes/report/${quizId}`
      );
=======
      const res = await axios.get(`${BASE_URL}/api/quizzes/report/${quizId}`);
>>>>>>> b74972c9 (main chla leave per)
      setReportData(res.data);
      setShowReportModal(true);
    } catch (err) {
      alert("Error fetching report.");
    }
  };

  const downloadReportAsExcel = () => {
    if (reportData.length === 0) {
      alert("No data to export.");
      return;
    }

    const teacherName = reportData[0]?.teacher_name || "Unknown";

    const formattedData = reportData.map((row) => ({
      "Quiz Title": row.quiz_title,
      Class: row.class_name,
      "Student Name": row.student_name,
      "Pre Score": row.pre_score ?? "-",
      "Post Score": row.post_score ?? "-",
      "Post - Pre Score": (row.post_score ?? 0) - (row.pre_score ?? 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData, { origin: "A3" });
    XLSX.utils.sheet_add_aoa(worksheet, [[`Teacher: ${teacherName}`]], {
      origin: "A1",
    });

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 2, c: C })];
      if (cell) {
        cell.s = {
          font: { bold: true },
        };
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, `quiz_report_${Date.now()}.xlsx`);
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await axios.delete(endpoints.quizzes.delete(quizId));
      fetchQuizzes();
    } catch (err) {
      alert("Failed to delete quiz.");
    }
  };

  const handleViewFullQuiz = async (quizId) => {
    try {
      const res = await axios.get(endpoints.quizzes.getById(quizId));
      const quiz = res.data;
      alert(
        `Quiz: ${quiz.quiz_title}\n\n` +
          quiz.questions
            .map(
              (q, i) =>
                `Q${i + 1}: ${q.question_text}\nOptions: ${q.options
                  .map((o) => o.option_text)
                  .join(", ")}\nAnswer: ${
                  q.options.find((o) => o.is_correct)?.option_text
                }`
            )
            .join("\n\n")
      );
    } catch (err) {
      alert("Failed to view quiz.");
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  return (
    <div className="mt-10">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          {editingQuizId ? "Edit Quiz" : "Create a New Quiz"}
        </h1>

        <Input
          className="w-full mb-6 text-lg"
          placeholder="Enter Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
        />
        <Textarea
          className="w-full mb-6 text-base"
          placeholder="Enter Quiz Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="mb-6 border shadow-sm">
            <CardContent>
              <Textarea
                placeholder={`Question ${qIndex + 1}`}
                value={q.question}
                onChange={(e) => updateQuestion(qIndex, e.target.value)}
                className="w-full text-base mb-4"
              />

              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2 mb-3">
                  <Input
                    className="flex-1"
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={(e) =>
                      updateOption(qIndex, oIndex, e.target.value)
                    }
                  />
                  <button
                    onClick={() => deleteOption(qIndex, oIndex)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Delete Option"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ))}

              <Button
                onClick={() => addOption(qIndex)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                + Add Option
              </Button>

              <select
                className="w-full mt-4 border p-2 rounded text-sm"
                value={q.answer}
                onChange={(e) => updateAnswer(qIndex, e.target.value)}
              >
                <option value="">Select Correct Answer</option>
                {q.options.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt || `Option ${idx + 1}`}
                  </option>
                ))}
              </select>

              <div className="text-right mt-4">
                <button
                  className="text-red-500 hover:text-red-700 transition"
                  onClick={() => deleteQuestion(qIndex)}
                  title="Delete Question"
                >
                  <Trash size={20} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between mt-8">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            onClick={addQuestion}
          >
            + Add Question
          </Button>
<<<<<<< HEAD
          <Button
            className="bg-green-600 hover:bg-green-700 text-white text-sm"
            onClick={handleSubmit}
          >
            {editingQuizId ? "Update Quiz" : "Create Quiz"}
=======
         
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow mt-5"
            onClick={() => handleViewReport(quiz.quiz_id)}
            title="View Report"
          >
            <FileText size={18} />
>>>>>>> 693386cb (batches changes)
          </Button>
        </div>
      </div>
      {/* 🔍 Search Quiz */}
      {/* <div className="max-w-3xl mx-auto mt-10">
        <Input
          className="w-full mb-4 text-base"
          placeholder="Search your quizzes..."
          onChange={(e) => {
            const value = e.target.value.toLowerCase();

            setQuizzes((prev) => {
              const matched = prev.filter((q) =>
                q.quiz_title.toLowerCase().includes(value)
              );
              const unmatched = prev.filter(
                (q) => !q.quiz_title.toLowerCase().includes(value)
              );
              return [...matched, ...unmatched];
            });
          }}
        />
      </div> */}

      {/* Quiz List */}
      <div className="mt-12 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Your Created Quizzes
          </h2>
          <input
            type="text"
            placeholder="Search quizzes..."
            className="border p-2 rounded-lg text-base w-96"
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              setQuizzes((prev) =>
                [...prev].sort((a, b) => {
                  const aMatch = a.quiz_title.toLowerCase().includes(query);
                  const bMatch = b.quiz_title.toLowerCase().includes(query);
                  return aMatch === bMatch ? 0 : aMatch ? -1 : 1;
                })
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.quiz_id}
              onDoubleClick={async () => {
                try {
                  const res = await axios.get(
                    endpoints.quizzes.getById(quiz.quiz_id)
                  );
                  const fullQuiz = res.data;
                  navigate("/quiz-view", {
                    state: {
                      ...fullQuiz,
                      viewOnly: true,
                    },
                  });
                } catch (err) {
                  console.error("❌ Failed to fetch full quiz", err);
                  alert("Could not open quiz view.");
                }
              }}
              className="relative group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-transform duration-300 transform hover:-translate-y-1 p-6 cursor-pointer min-h-[160px] flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 line-clamp-1">
                  {searchQuery ? (
                    <>
                      {quiz.quiz_title
                        .split(new RegExp(`(${searchQuery})`, "gi"))
                        .map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <span
                              key={i}
                              className="bg-yellow-200 px-1 rounded"
                            >
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        )}
                    </>
                  ) : (
                    quiz.quiz_title
                  )}
                </h3>
                <p className="text-xl text-red-500 dark:text-red-500 mt-1">
                  {quiz.description}
                </p>

                {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                  Double click to view details
                </p> */}

                <p className="text-xs text-blue-700 mt-1">
                  Created on:{" "}
                  {quiz.start_time
                    ? new Date(quiz.start_time).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black p-2 rounded-full shadow"
                  onClick={() => handleEdit(quiz)}
                  title="Edit Quiz"
                >
                  <Edit2 size={18} />
                </button>
                {/* <button
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow"
                  onClick={() => handleDelete(quiz.quiz_id)}
                  title="Delete Quiz"
                >
                  <Trash size={18} />
                </button> */}
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow"
                  onClick={() => handleViewReport(quiz.quiz_id)}
                  title="View Report"
                >
                  <FileText size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-2xl font-bold mb-2 text-black dark:text-white text-center">
              Quiz Report
            </h2>

            {/* ✅ Show Teacher Name at the top */}
            {reportData.length > 0 && (
              <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 text-center">
                Teacher: {reportData[0].teacher_name}
              </h3>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Quiz Name</th>
                  <th className="border-b p-2">Class</th>
                  {/* <th className="border-b p-2">Teacher Name</th> */}
                  <th className="border-b p-2">Student Name</th>
                  <th className="border-b p-2">Pre Score</th>
                  <th className="border-b p-2">Post Score</th>
                  <th className="border-b p-2">Post - Pre Score</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, i) => {
                  const delta = (row.post_score ?? 0) - (row.pre_score ?? 0);
                  return (
                    <tr key={i}>
                      <td className="border-b p-4">{row.quiz_title}</td>
                      <td className="border-b p-4">{row.class_name}</td>
                      {/* <td className="border-b p-2">{row.teacher_name}</td> */}
                      <td className="border-b p-2">{row.student_name}</td>
                      <td className="border-b p-2">{row.pre_score ?? "-"}</td>
                      <td className="border-b p-2">{row.post_score ?? "-"}</td>
                      <td
                        className={`border-b p-2 font-bold ${
                          delta >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {isNaN(delta) ? "-" : delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="text-center mt-4 flex gap-8 justify-center">
              <Button
                className="bg-blue-600 text-white"
                onClick={downloadReportAsExcel}
              >
                Download Excel
              </Button>
              <Button
                className="bg-gray-500 text-white"
                onClick={() => setShowReportModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Teacher = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("teacher_id");
    localStorage.removeItem("user_type");
    setIsLoggedIn(false);
    alert("You have logged out successfully.");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const teacherId = localStorage.getItem("teacher_id");

    //  Redirect if token or teacher_id is missing
    if (!token || !teacherId) {
      alert("You are not logged in. Please log in.");
      navigate("/login");
      return;
    }

    //  Fetch teacher info to display
    axios
      .get(endpoints.dashboard.teacher, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setTeacherName(res.data.name);
        localStorage.setItem("teacher_id", res.data.teacher_details_id_pk); // refresh ID if needed
      })
      .catch((err) => {
        console.error(" Failed to fetch teacher info", err);
        alert("Session expired. Please log in again.");
        navigate("/login");
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 transition-all">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`bg-white dark:bg-gray-800 z-30 fixed md:static top-0 left-0 w-64 p-4 shadow-md rounded-lg transition-all ${
          menuOpen ? "block" : "hidden"
        } md:block`}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Teacher Dashboard
        </h2>
        <nav>
          <ul>
            <li
              className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => navigate("/teacher/StudentView")}
            >
              <Users className="mr-2" /> Students
            </li>

            <li
              className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => navigate("/teacher/batches")}
            >
              <Layers className="mr-2" /> Batches
            </li>

            <li
              className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => navigate("/teacher/batch-assignments")}
            >
              <ListChecks className="mr-2" /> Batch Assign
            </li>

            <li
              className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() =>
                navigate("/teacher/PostEditor", {
                  state: { titleRequired: true },
                })
              }
            >
              <FilePlus className="mr-2" /> Post Create
            </li>
            <li
              className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => navigate("/teacher/PromoteStudents")}
            >
              <Layers className="mr-2" />
              Promote Batch
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 ml-0 md:ml-0">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu />
            </button>
            <h1 className="text-3xl font-semibold text-purple-800 dark:text-white">
              Teacher, {teacherName || "Teacher"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <QuizManagement />
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Confirm Logout
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;
