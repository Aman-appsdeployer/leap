import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import "chart.js/auto";
import { motion } from "framer-motion";
import {
  BadgeCheck, BarChart2, Bell, BookOpen, Link2, Menu, MessageCircle,
  Moon, PieChart, Star, Sun, Upload, User, Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const dashboardItems = [
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

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preQuizScore, setPreQuizScore] = useState<number | null>(null);
  const [postQuizScore, setPostQuizScore] = useState<number | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [studentName, setStudentName] = useState<string>("Student");

  const navigate = useNavigate();

  useEffect(() => {
    const studentData = localStorage.getItem("student");
    if (studentData) {
      const parsed = JSON.parse(studentData);
      setStudentName(parsed.name || "Student");
    }
  }, []);

  // useEffect(() => {
  //   axios.get("http://localhost:8000/api/quizzes")
  //     .then((res) => {
  //       if (Array.isArray(res.data)) setQuizzes(res.data);
  //       else setQuizzes([]);
  //     })
  //     .catch(() => setQuizzes([]));
  // }, []);

// useEffect(() => {
//   const studentData = localStorage.getItem("student");
//   if (studentData) {
//     const parsed = JSON.parse(studentData);
//     const studentId = parsed.student_details_id_pk; // ✅ Must match what's stored
//     console.log("Fetching quizzes for student ID:", studentId); // ✅ DEBUG

//     axios.get(`http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`)
//       .then((res) => {
//         setQuizzes(res.data); // ✅ Display assigned quizzes
//       })
//       .catch((err) => {
//         console.error("Failed to load assigned quizzes:", err);
//       });
//   }
// }, []);

useEffect(() => {
  const fetchStudentInfo = async () => {
    try {
      const res = await axios.get("http://localhost:8000/student", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setStudentName(res.data.name || "Student");

      const quizRes = await axios.get(
        `http://localhost:8000/api/quizzes/assigned-quizzes/${res.data.student_id}`
      );

      setQuizzes(quizRes.data);
    } catch (err) {
      console.error("Failed to load student or quizzes", err);
    }
  };

  fetchStudentInfo();
}, []);




useEffect(() => {
  const studentData = localStorage.getItem("student");
  if (studentData) {
    const parsed = JSON.parse(studentData);
    setStudentName(parsed.name || "Student");

    axios.get(`http://localhost:8000/api/quizzes/assigned-quizzes/${parsed.student_details_id_pk}`)
      .then((res) => {
        if (Array.isArray(res.data)) setQuizzes(res.data);
        else setQuizzes([]);
      })
      .catch(() => setQuizzes([]));
  }
}, []);


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
    navigate("/");
  };

  const takeQuiz = (type: "pre" | "post") => {
    const score = Math.floor(Math.random() * 100) + 1;
    if (type === "pre") setPreQuizScore(score);
    else setPostQuizScore(score);
  };

  const loadAndGoToQuiz = async (quizId: number) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
      console.log("Quiz loaded:", res.data); // ✅ DEBUG LOG
      navigate(`/quiz/${quizId}`, { state: res.data });
    } catch (err) {
      console.error("Quiz load error:", err);
      alert("Could not load quiz, please try again.");
    }
  };



  return (
    <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
        className="bg-gray-100 dark:bg-gray-900 p-5 min-h-screen fixed md:relative flex flex-col transition-all shadow-lg z-40"
      >
        <button onClick={toggleSidebar} className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700">
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        {sidebarOpen && <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>}
        <ul className="mt-6 space-y-4">
          {[{ label: "Dashboard", Icon: BarChart2 }, { label: "Students", Icon: Users }, { label: "Courses", Icon: BookOpen }, { label: "Analytics", Icon: PieChart }].map(({ label, Icon }) => (
            <li key={label} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400">
              <Icon className="w-5 h-5 mr-2" /> {sidebarOpen && label}
            </li>
          ))}
        </ul>
      </motion.aside>

      {/* Main */}
      <main className={`flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ml-${sidebarOpen ? "64" : "16"} md:ml-0`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
          <div className="flex items-center space-x-4">
            <Bell size={24} className="cursor-pointer text-gray-700 dark:text-gray-300" />
            <div className="relative">
              <button onClick={toggleProfileMenu} className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full">
                <User size={20} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600">Log Out</button>
                </div>
              )}
            </div>
            <button onClick={toggleDarkMode} className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full">
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
                  <div className="flex items-center gap-4 mb-4">{item.icon}<h4 className="text-xl font-semibold">{item.title}</h4></div>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">{item.count}</p>
                  <p className="text-gray-500 text-sm mt-2 dark:text-gray-300">{item.note}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        

        {/* Available Quizzes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4"></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300">No quizzes available right now.</p>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.quiz_id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{quiz.quiz_title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
                  <button
                    type="button"
                    onClick={() => loadAndGoToQuiz(quiz.quiz_id)}
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
//   const [preQuizScore, setPreQuizScore] = useState<number | null>(null);
//   const [postQuizScore, setPostQuizScore] = useState<number | null>(null);
//   const [profileMenuOpen, setProfileMenuOpen] = useState(false);
//   const [quizzes, setQuizzes] = useState<any[]>([]);
//   const [studentName, setStudentName] = useState<string>("Student");

//   const navigate = useNavigate();

//   useEffect(() => {
//     const studentData = localStorage.getItem("student");
//     if (studentData) {
//       const parsed = JSON.parse(studentData);
//       setStudentName(parsed.name || "Student");
//     }
//   }, []);

//   useEffect(() => {
//     axios.get("http://localhost:8000/api/quizzes")
//       .then((res) => {
//         if (Array.isArray(res.data)) setQuizzes(res.data);
//         else setQuizzes([]);
//       })
//       .catch(() => setQuizzes([]));
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

//   const takeQuiz = (type: "pre" | "post") => {
//     const score = Math.floor(Math.random() * 100) + 1;
//     if (type === "pre") setPreQuizScore(score);
//     else setPostQuizScore(score);
//   };

//   // const loadAndGoToQuiz = async (quizId: number) => {
//   //   try {
//   //     await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
//   //     navigate(`/quiz/${quizId}`, { state: res.data });
//   //   } catch {
//   //     alert("Could not load quiz, please try again.");
//   //   }
//   // };

// const loadAndGoToQuiz = async (quizId: number) => {
//   try {
// axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
//     console.log("Quiz loaded:", res.data); // ✅ DEBUG LOG
//     navigate(`/quiz/${quizId}`, { state: res.data });
//   } catch (err) {
//     console.error("Quiz load error:", err);
//     alert("Could not load quiz, please try again.");
//   }
// };

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

//         {/* Pre/Post Quizzes */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
//           <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md text-center">
//             <h3 className="text-lg font-semibold mb-3">Pre-Quiz</h3>
//             <button onClick={() => takeQuiz("pre")} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Take Pre-Quiz</button>
//             {preQuizScore !== null && <p className="mt-3 text-lg font-bold">Score: {preQuizScore}%</p>}
//           </div>
//           <div className="bg-gray-200 dark:bg-gray-700 p-6 rounded-lg shadow-md text-center">
//             <h3 className="text-lg font-semibold mb-3">Post-Quiz</h3>
//             <button onClick={() => takeQuiz("post")} className="px-4 py-2 bg-green-500 text-white rounded-lg">Take Post-Quiz</button>
//             {postQuizScore !== null && <p className="mt-3 text-lg font-bold">Score: {postQuizScore}%</p>}
//           </div>
//         </div>

//         {/* Available Quizzes */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-bold mb-4">📝 Available Quizzes</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {quizzes.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-300">No quizzes available right now.</p>
//             ) : (
//               quizzes.map((quiz) => (
//                 <div key={quiz.quiz_id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
//                   <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{quiz.quiz_title}</h3>
//                   <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
//                   <button
//                     type="button"
//                     onClick={() => loadAndGoToQuiz(quiz.quiz_id)}
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
