import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart2,
  Bell,
  BookOpen,
  Link2,
  Menu,
  MessageCircle,
  Moon,
  PieChart,
  Star,
  Sun,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Quiz interface for type checking
interface Quiz {
  quiz_id: number;
  quiz_title: string;
  description: string;
  attempt_count: number;
}

// Dashboard items to display
interface DashboardItem {
  icon: React.ReactNode;
  title: string;
  count: number;
  note: string;
}

// Static dashboard items, add more as needed
const dashboardItems: DashboardItem[] = [
  {
    icon: <Upload size={32} className="text-green-500" />,
    title: "Projects Uploaded",
    count: 1,
    note: "Total Uploaded Projects",
  },
  {
    icon: <Star size={32} className="text-yellow-400" />,
    title: "Portal Points",
    count: 0,
    note: "We Will Update Soon",
  },
  {
    icon: <BadgeCheck size={32} className="text-blue-500" />,
    title: "Badges Received",
    count: 0,
    note: "Digital Badges Coming Soon",
  },
  {
    icon: <Link2 size={32} className="text-purple-500" />,
    title: "Event Participation",
    count: 0,
    note: "Feature Coming Soon",
  },
  {
    icon: <MessageCircle size={32} className="text-pink-500" />,
    title: "Student Forum",
    count: 0,
    note: "Coming Soon",
  },
];

// Get the appropriate color based on attempt number
const getColorClass = (attemptNumber) => {
  if (attemptNumber === 1) return "bg-green-100 border-green-500"; // Green for first attempt
  if (attemptNumber === 2) return "bg-blue-100 border-blue-500";  // Blue for second attempt
  if (attemptNumber === 3) return "bg-purple-100 border-purple-500"; // Purple for third attempt
  return "bg-white border-gray-300"; // Default if no attempts
};

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [studentName, setStudentName] = useState<string>("Student");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentAndQuizzes = async () => {
      try {
        const studentData = localStorage.getItem("student");
        let studentId: number | null = null;

        if (studentData) {
          const parsed = JSON.parse(studentData);
          setStudentName(parsed.name || "Student");
          studentId = parsed.student_details_id_pk || parsed.student_id || null;
        } else {
          const res = await axios.get("http://localhost:8000/student", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setStudentName(res.data.name || "Student");
          studentId = res.data.student_details_id_pk || res.data.student_id || null;
        }

        if (studentId) {
          const quizRes = await axios.get(
            `http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`
          );
          setQuizzes(Array.isArray(quizRes.data) ? quizRes.data : []);
        }
      } catch (err) {
        console.error("Failed to load student or quizzes", err);
        setQuizzes([]);
      }
    };

    fetchStudentAndQuizzes();
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Load and navigate to quiz with necessary checks
  const loadAndGoToQuiz = async (quizId: number, attemptCount: number) => {
    if (attemptCount >= 3) {
      alert("❌ You have reached the maximum of 3 attempts for this quiz.");
      return;
    }

    try {
      const studentData = localStorage.getItem("student");
      const parsedStudent = studentData ? JSON.parse(studentData) : null;
      let studentId = parsedStudent?.student_id || parsedStudent?.student_details_id_pk;

      if (!studentId) {
        const res = await axios.get("http://localhost:8000/student", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        localStorage.setItem("student", JSON.stringify(res.data));
        studentId = res.data.student_id || res.data.student_details_id_pk;
      }

      if (!studentId) {
        alert("❌ Student ID not found. Please re-login.");
        return;
      }

      if (attemptCount === 2) {
        const confirmAttempt = window.confirm(
          "⚠️ This will be your 3rd and final attempt. Are you sure you want to continue?"
        );
        if (!confirmAttempt) return;
      }

      const attemptRes = await axios.post("http://localhost:8000/api/quizzes/attempt", {
        quiz_id: quizId,
        attempt_type: "post",
        student_id: studentId,
      });

      const quizRes = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);

      navigate(`/quiz/${quizId}`, {
        state: {
          ...quizRes.data,
          attempt_type: "post",
          attempt_message: attemptRes.data.message,
        },
      });
    } catch (err) {
      console.error("Quiz load or attempt error:", err);
      alert("Could not load or attempt quiz. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
        className="bg-gray-100 dark:bg-gray-900 p-5 min-h-screen fixed md:relative flex flex-col transition-all shadow-lg z-40"
      >
        <button
          onClick={toggleSidebar}
          className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        {sidebarOpen && (
          <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>
        )}
        <ul className="mt-6 space-y-4">
          {[{ label: "Dashboard", Icon: BarChart2 }, { label: "Students", Icon: Users }, { label: "Courses", Icon: BookOpen }, { label: "Analytics", Icon: PieChart }].map(
            ({ label, Icon }) => (
              <li
                key={label}
                className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
              >
                <Icon className="w-5 h-5 mr-2" /> {sidebarOpen && label}
              </li>
            )
          )}
        </ul>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
          sidebarOpen ? "ml-64" : "ml-16"
        } md:ml-0`}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
          <div className="flex items-center space-x-4">
            <Bell size={24} className="cursor-pointer text-gray-700 dark:text-gray-300" />
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
              >
                <User size={20} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {dashboardItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer dark:bg-gray-700">
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    {item.icon}
                    <h4 className="text-xl font-semibold">{item.title}</h4>
                  </div>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
                    {item.count}
                  </p>
                  <p className="text-gray-500 text-sm mt-2 dark:text-gray-300">
                    {item.note}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Available Quizzes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">
                No quizzes available right now.
              </p>
            ) : (
              quizzes.map((quiz) => (
                <div
                  key={quiz.quiz_id}
                  className={`p-6 rounded-lg shadow-md border ${getColorClass(
                    quiz.attempt_count
                  )} dark:border-gray-700`}
                >
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                    {quiz.quiz_title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    {quiz.description}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Attempts Taken: {quiz.attempt_count}
                  </p>
                  <button
                    type="button"
                    onClick={() => loadAndGoToQuiz(quiz.quiz_id, quiz.attempt_count)}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Attempt Quiz
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;









// import { Card, CardContent } from "@/components/ui/card";
// import axios from "axios";
// import "chart.js/auto";
// import { motion } from "framer-motion";
// import {
//   BadgeCheck, BarChart2, Bell, BookOpen, Link2, Menu, MessageCircle,
//   Moon, PieChart, Star, Sun, Upload, User, Users
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const dashboardItems = [
//   {
//     icon: <Upload size={32} className="text-green-500" />,
//     title: "Projects Uploaded",
//     count: 1,
//     note: "Total Uploaded Projects",
//   },
//   {
//     icon: <Star size={32} className="text-yellow-400" />,
//     title: "Portal Points",
//     count: 0,
//     note: "We Will Update Soon",
//   },
//   {
//     icon: <BadgeCheck size={32} className="text-blue-500" />,
//     title: "Badges Received",
//     count: 0,
//     note: "Digital Badges Coming Soon",
//   },
//   {
//     icon: <Link2 size={32} className="text-purple-500" />,
//     title: "Event Participation",
//     count: 0,
//     note: "Feature Coming Soon",
//   },
//   {
//     icon: <MessageCircle size={32} className="text-pink-500" />,
//     title: "Student Forum",
//     count: 0,
//     note: "Coming Soon",
//   },
// ];

// const Dashboard = () => {
//   const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [profileMenuOpen, setProfileMenuOpen] = useState(false);
//   const [quizzes, setQuizzes] = useState<any[]>([]);
//   const [studentName, setStudentName] = useState<string>("Student");

//   const navigate = useNavigate();

//   const getColorClass = (attemptId: number) => {
//     switch (attemptId) {
//       case 1: return "bg-green-100 border-green-500";
//       case 2: return "bg-blue-100 border-blue-500";
//       case 3: return "bg-purple-100 border-purple-500";
//       default: return "bg-white border-gray-300";
//     }
//   };

//   useEffect(() => {
//     const fetchStudentAndQuizzes = async () => {
//       try {
//         const studentData = localStorage.getItem("student");
//         let studentId: number | null = null;

//         if (studentData) {
//           const parsed = JSON.parse(studentData);
//           setStudentName(parsed.name || "Student");
//           studentId = parsed.student_details_id_pk;
//         } else {
//           const res = await axios.get("http://localhost:8000/student", {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem("token")}`
//             }
//           });
//           setStudentName(res.data.name || "Student");
//           studentId = res.data.student_id;
//         }

//         if (studentId) {
//           const quizRes = await axios.get(
//             `http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`
//           );
//           setQuizzes(Array.isArray(quizRes.data) ? quizRes.data : []);
//         }
//       } catch (err) {
//         console.error("Failed to load student or quizzes", err);
//         setQuizzes([]);
//       }
//     };

//     fetchStudentAndQuizzes();
//   }, []);

//   const toggleDarkMode = () => {
//     const newMode = !darkMode;
//     setDarkMode(newMode);
//     localStorage.setItem("theme", newMode ? "dark" : "light");
//     document.documentElement.classList.toggle("dark", newMode);
//   };

//   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
//   const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);
//   const handleLogout = () => {
//     localStorage.removeItem("student");
//     navigate("/");
//   };

//   const loadAndGoToQuiz = async (quizId: number, attemptId: number) => {
//     if (attemptId >= 3) {
//       alert("❌ You have reached the maximum of 3 attempts for this quiz.");
//       return;
//     }

//     try {
//       const res = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);

//       if (attemptId === 2) {
//         const confirm = window.confirm("⚠️ This will be your 3rd and final attempt. Are you sure you want to continue?");
//         if (!confirm) return;
//       }

//       navigate(`/quiz/${quizId}`, { state: { ...res.data, attempt_type: "post" } });
//     } catch (err) {
//       console.error("Quiz load error:", err);
//       alert("Could not load quiz, please try again.");
//     }
//   };

//   return (
//     <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
//       {/* Sidebar */}
//       <motion.aside
//         animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
//         className="bg-gray-100 dark:bg-gray-900 p-5 min-h-screen fixed md:relative flex flex-col transition-all shadow-lg z-40"
//       >
//         <button onClick={toggleSidebar} className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700">
//           <Menu size={20} className="text-gray-700 dark:text-gray-300" />
//         </button>
//         {sidebarOpen && <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>}
//         <ul className="mt-6 space-y-4">
//           {[{ label: "Dashboard", Icon: BarChart2 }, { label: "Students", Icon: Users }, { label: "Courses", Icon: BookOpen }, { label: "Analytics", Icon: PieChart }].map(({ label, Icon }) => (
//             <li key={label} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400">
//               <Icon className="w-5 h-5 mr-2" /> {sidebarOpen && label}
//             </li>
//           ))}
//         </ul>
//       </motion.aside>

//       {/* Main */}
//       <main className={`flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ml-${sidebarOpen ? "64" : "16"} md:ml-0`}>
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//           <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
//           <div className="flex items-center space-x-4">
//             <Bell size={24} className="cursor-pointer text-gray-700 dark:text-gray-300" />
//             <div className="relative">
//               <button onClick={toggleProfileMenu} className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full">
//                 <User size={20} />
//               </button>
//               {profileMenuOpen && (
//                 <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
//                   <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600">Log Out</button>
//                 </div>
//               )}
//             </div>
//             <button onClick={toggleDarkMode} className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full">
//               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
//             </button>
//           </div>
//         </div>

//         {/* Dashboard Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
//           {dashboardItems.map((item, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//             >
//               <Card className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer dark:bg-gray-700">
//                 <CardContent>
//                   <div className="flex items-center gap-4 mb-4">{item.icon}<h4 className="text-xl font-semibold">{item.title}</h4></div>
//                   <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">{item.count}</p>
//                   <p className="text-gray-500 text-sm mt-2 dark:text-gray-300">{item.note}</p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>

//         {/* Available Quizzes */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {quizzes.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-300">No quizzes available right now.</p>
//             ) : (
//               quizzes.map((quiz) => (
//                 <div key={quiz.quiz_id} className={`p-6 rounded-lg shadow-md border ${getColorClass(quiz.attempt_id)} dark:border-gray-700`}>
//                   <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{quiz.quiz_title}</h3>
//                   <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
//                   <button
//                     type="button"
//                     onClick={() => loadAndGoToQuiz(quiz.quiz_id, quiz.attempt_id)}
//                     className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
//                   >
//                     Attempt Quiz
//                   </button>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;
