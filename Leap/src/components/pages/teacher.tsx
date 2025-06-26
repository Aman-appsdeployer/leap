







import axios from "axios";
import {
  Bell,
  Calendar,
  CheckCircle,
  Edit2,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  Trash,
  Users
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// UI Components
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
  <textarea className={`border p-2 rounded-lg ${className}`} {...props} required />
);
const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children }) => <div className="p-4">{children}</div>;

// ==========================
// Quiz Management Component
// ==========================
const QuizManagement = () => {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], answer: "" },
  ]);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], answer: "" }]);
  };

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
    if (!isFormValid()) {
      alert("Please fill in all fields and correct answers.");
      return;
    }

    const payload = {
      quiz_title: quizTitle,
      description: "",
      created_by_mentor_id_fk: 1,
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

    const url = editingQuizId
      ? `http://localhost:8000/api/quizzes/quiz/${editingQuizId}`
      : "http://localhost:8000/api/quizzes/quiz";
    const method = editingQuizId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        alert(editingQuizId ? "Quiz updated successfully!" : "Quiz created successfully!");
        resetForm();
        fetchQuizzes();
      } else {
        alert("Failed to save quiz.");
      }
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

  useEffect(() => {
    fetchQuizzes();
  }, []);

  return (
    <div className="mt-10">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-black dark:text-white">
          {editingQuizId ? "Edit Quiz" : "Create a New Quiz"}
        </h1>

        <Input
          className="w-full mb-4"
          placeholder="Enter Quiz Title"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
        />

        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="mb-4 border border-gray-300 dark:border-gray-600">
            <CardContent>
              <Textarea
                className="w-full"
                placeholder="Enter Question"
                value={q.question}
                onChange={(e) => updateQuestion(qIndex, e.target.value)}
              />
              {q.options.map((opt, oIndex) => (
                <Input
                  key={oIndex}
                  className="w-full mt-2"
                  placeholder={`Option ${oIndex + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
              ))}
              <select
                className="w-full mt-2 border p-2 rounded"
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
          <Button className="bg-blue-500 text-white flex items-center gap-2" onClick={addQuestion}>
            <Plus size={16} /> Add Question
          </Button>
          <Button className="bg-green-600 text-white flex items-center gap-2" onClick={handleSubmit}>
            <CheckCircle size={16} /> {editingQuizId ? "Update Quiz" : "Create Quiz"}
          </Button>
        </div>
      </div>

      <div className="mt-10 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Your Quizzes</h2>
        {quizzes.map((quiz) => (
          <div
            key={quiz.quiz_id}
            className="mb-4 p-4 bg-white dark:bg-gray-700 shadow rounded flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{quiz.quiz_title}</h3>
            </div>
            <div className="flex gap-2">
              <Button className="bg-yellow-400 text-black p-2 rounded-full" onClick={() => handleEdit(quiz)}>
                <Edit2 size={18} />
              </Button>
              <Button className="bg-red-500 text-white p-2 rounded-full" onClick={() => handleDelete(quiz.quiz_id)}>
                <Trash size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =======================
// Main Teacher Component
// =======================
const Teacher = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for logout confirmation modal
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear session or token here
    setIsLoggedIn(false);
    alert("You have logged out successfully.");
    navigate("/login"); // Redirect to login page
  };

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
            <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer">
              <Users className="mr-2" /> Students
            </li>
            <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer">
              <Calendar className="mr-2" /> Schedule
            </li>
            <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer">
              <Bell className="mr-2" /> Notifications
            </li>
            <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer" onClick={() => navigate("/teacher/batches")}>
              <Bell className="mr-2" /> Batches
            </li>
            <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer" onClick={() => navigate("/teacher/batch-assignments")}>
              <Bell className="mr-2" /> Batch Assign
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 ml-0 md:ml-0">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Welcome, Teacher
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

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Are you sure you want to logout?</h2>
            <div className="flex justify-end gap-4">
              <Button className="bg-gray-400 text-white" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </Button>
              <Button className="bg-red-500 text-white" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;







