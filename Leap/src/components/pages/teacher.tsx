import axios from "axios";
import { saveAs } from "file-saver";
import {
  Edit2,
  FilePlus,
  FileText,
  Layers,
  ListChecks,
  LogOut, Menu, Moon,
  Sun, Trash, Users
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";


// UI Components
const Button = ({ className = "", ...props }) => (
  <button className={`px-4 py-2 rounded-lg ${className}`} {...props} />
);
const Input = ({ className = "", ...props }) => (
  <input type="text" className={`border p-2 rounded-lg ${className}`} {...props} required />
);
const Textarea = ({ className = "", ...props }) => (
  <textarea className={`border p-2 rounded-lg ${className}`} {...props} required />
);
const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl ${className}`}>{children}</div>
);
const CardContent = ({ children }) => <div className="p-4">{children}</div>;

const QuizManagement = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], answer: "" }]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: "" }]);

  const updateQuestion = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].question = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const updateAnswer = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].answer = value;
    setQuestions(newQuestions);
  };

  const isFormValid = () => {
    if (!quizTitle.trim()) return false;
    for (const q of questions) {
      if (!q.question.trim()) return false;
      if (q.options.some((opt) => !opt.trim())) return false;
      if (!q.answer.trim() || !q.options.includes(q.answer)) return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return alert("Please fill in all fields and correct answers.");

    const payload = {
      quiz_title: quizTitle,
      description: "",
      created_by_mentor_id_fk: 1,
      questions: questions.map((q) => ({
        question_text: q.question,
        question_type: "mcq",
        points: 1,
        options: q.options.map((opt) => ({ option_text: opt, is_correct: opt === q.answer }))
      }))
    };

    const url = editingQuizId ? `http://localhost:8000/api/quizzes/quiz/${editingQuizId}` : "http://localhost:8000/api/quizzes/quiz";
    const method = editingQuizId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data.message) {
        alert(editingQuizId ? "Quiz updated successfully!" : "Quiz created successfully!");
        resetForm();
        fetchQuizzes();
      } else alert("Failed to save quiz.");
    } catch (error) {
      console.error("Quiz save failed:", error);
      alert("Error saving quiz");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/quizzes");
      setQuizzes(res.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      alert("Failed to load quizzes.");
    }
  };

  const resetForm = () => {
    setQuizTitle("");
    setQuestions([{ question: "", options: ["", "", "", ""], answer: "" }]);
    setEditingQuizId(null);
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
      alert("Deleted");
      fetchQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz.");
    }
  };

  const handleEdit = (quiz) => {
    setQuizTitle(quiz.quiz_title);
    axios.get(`http://localhost:8000/api/quizzes/quiz/${quiz.quiz_id}`).then((res) => {
      const { questions } = res.data;
      setQuestions(questions.map((q) => ({
        question: q.question_text,
        options: q.options.map((o) => o.option_text),
        answer: q.options.find((o) => o.is_correct)?.option_text || ""
      })));
      setEditingQuizId(quiz.quiz_id);
    });
  };

  const handleViewReport = async (quizId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/quizzes/report/${quizId}`);
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

  // Prepare report data
  const formattedData = reportData.map((row) => ({
    "Quiz Title": row.quiz_title,
    "Class": row.class_name,
    "Student Name": row.student_name,
    "Pre Score": row.pre_score ?? "-",
    "Post Score": row.post_score ?? "-",
    "Post - Pre Score": (row.post_score ?? 0) - (row.pre_score ?? 0),
  }));

  // Step 1: Create a worksheet from the quiz data
  const worksheet = XLSX.utils.json_to_sheet(formattedData, { origin: "A3" }); // Start from row 3

  // Step 2: Manually add teacher name to A1
  XLSX.utils.sheet_add_aoa(worksheet, [[`Teacher: ${teacherName}`]], { origin: "A1" });

  // Step 3: Optional: style the header row
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 2, c: C })]; // row 3 = header
    if (cell) {
      cell.s = {
        font: { bold: true },
      };
    }
  }

  // Step 4: Build and export
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Report");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });

  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `quiz_report_${Date.now()}.xlsx`);
};


  useEffect(() => { fetchQuizzes(); }, []);

  return (
    <div className="mt-10">
      {/* Create Quiz Form */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
  <h1 className="text-2xl font-bold mb-4 text-center text-black dark:text-white">
    {editingQuizId ? "Edit Quiz" : "Create a New Quiz"}
  </h1>

  <Input
    className="w-full mb-4 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-gray-400"
    placeholder="Enter Quiz Title"
    value={quizTitle}
    onChange={(e) => setQuizTitle(e.target.value)}
  />

  {questions.map((q, qIndex) => (
    <Card key={qIndex} className="mb-4 border border-gray-300 dark:border-gray-600">
      <CardContent>
        <Textarea
          className="w-full bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-gray-400"
          placeholder="Enter Question"
          value={q.question}
          onChange={(e) => updateQuestion(qIndex, e.target.value)}
        />
        {q.options.map((opt, oIndex) => (
          <Input
            key={oIndex}
            className="w-full mt-2 bg-white dark:bg-gray-900 text-black dark:text-white placeholder:text-gray-400"
            placeholder={`Option ${oIndex + 1}`}
            value={opt}
            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
          />
        ))}
        <select
          className="w-full mt-2 border p-2 rounded bg-white dark:bg-gray-900 text-black dark:text-white"
          value={q.answer}
          onChange={(e) => updateAnswer(qIndex, e.target.value)}
          required
        >
          <option value="">Select Correct Answer</option>
          {q.options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt || `Option ${idx + 1}`}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  ))}

  <div className="flex justify-between">
    <Button
      className="bg-blue-500 text-white flex items-center gap-2 sm:gap-4 "
      onClick={addQuestion}
    >
       Add Question
    </Button>
    <Button
      className="bg-green-600 text-white flex items-center gap-2"
      onClick={handleSubmit}
    >
       {editingQuizId ? "Update Quiz" : "Create Quiz"}
    </Button>
  </div>
</div>


      {/* Quiz List */}
     <div className="mt-10 max-w-4xl mx-auto">
  <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white ">
     Your Created Quizzes
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {quizzes.map((quiz) => (
      <div
        key={quiz.quiz_id}
        className="relative group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md p-6 transition hover:shadow-xl"
      >
        {/* Quiz Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {quiz.quiz_title}
        </h3>

        {/* Optional info (like # of questions or created date) */}
        <p className="text-sm text-gray-500 dark:text-gray-400">Click to manage this quiz</p>

        {/* Hidden Action Buttons (visible on hover) */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-black p-2 rounded-full shadow mt-5"
            onClick={() => handleEdit(quiz)}
            title="Edit Quiz"
          >
            <Edit2 size={18} />
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow mt-5"
            onClick={() => handleDelete(quiz.quiz_id)}
            title="Delete Quiz"
          >
            <Trash size={18} />
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow mt-5"
            onClick={() => handleViewReport(quiz.quiz_id)}
            title="View Report"
          >
            <FileText size={18} />
          </Button>
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
                <td className={`border-b p-2 font-bold ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {isNaN(delta) ? "-" : delta}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-center mt-4 flex gap-8 justify-center">
        <Button className="bg-blue-600 text-white" onClick={downloadReportAsExcel}>Download Excel</Button>
        <Button className="bg-gray-500 text-white" onClick={() => setShowReportModal(false)}>Close</Button>
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
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    alert("You have logged out successfully.");
    navigate("/login");
  };

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 transition-all">
      <aside ref={sidebarRef} className={`bg-white dark:bg-gray-800 z-30 fixed md:static top-0 left-0 w-64 p-4 shadow-md rounded-lg transition-all ${menuOpen ? "block" : "hidden"} md:block`}>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Teacher Dashboard</h2>
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
    onClick={() => navigate("/teacher/PostEditor", { state: { titleRequired: true } })}

  >
    <FilePlus className="mr-2" /> Post Create
  </li>
</ul>
        </nav>
      </aside>

      <div className="flex-1 p-4 md:p-6 ml-0 md:ml-0">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome, Teacher</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLogoutModal(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"><LogOut size={20} /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          </div>
        </header>

        <QuizManagement />
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Are you sure you want to logout?</h2>
            <div className="flex justify-end gap-4">
              <Button className="bg-gray-400 text-white" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
              <Button className="bg-red-500 text-white" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;











