import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bell,
  Link2,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Star,
  Sun,
  Upload
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

const getColorClass = (attemptCount: number) => {
  const nextAttempt = attemptCount + 1;
  if (nextAttempt === 1) return "bg-green-300 border-green-500";
  if (nextAttempt === 2) return "bg-blue-100 border-blue-500";
  if (nextAttempt === 3) return "bg-purple-100 border-purple-500";
  return "bg-gray-100 border-gray-300";
};

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<Quiz[]>([]);
  const [studentName, setStudentName] = useState<string>("Student");
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for controlling logout modal

  const navigate = useNavigate();

  const dashboardItems = [
    {
      icon: <Upload size={32} className="text-green-500" />,
      title: "Projects Uploaded",
      count: 1,
      note: "Total Uploaded Projects",
      onClick: () => navigate("/upload-project"),
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
      
      note: "View Your Badgr Credentials",
     onClick: async () => {
  const studentData = localStorage.getItem("student");
  if (!studentData) {
    alert("Student data missing. Please login again.");
    return;
  }

  const student = JSON.parse(studentData);
  const email = student.email;

  try {
    const res = await axios.get(`http://localhost:8000/student/badges/${email}`);

    const assertions = res.data?.result || res.data?.results || [];

    if (assertions.length > 0) {
      const firstAssertion = assertions[0];

      const assertionId =
        firstAssertion.entityId ||
        firstAssertion.id ||
        (firstAssertion['@id'] ? firstAssertion['@id'].split('/').pop() : null);

      const badgeId =
        firstAssertion.badgeclass?.id ||
        (firstAssertion.badgeclass?.['@id'] ? firstAssertion.badgeclass['@id'].split('/').pop() : null);

      if (assertionId && badgeId) {
        const badgeUrl = `https://badgr.com/issuers/684d2ecf1e0f1476a1c6c329/badges/${badgeId}/assertions/${assertionId}`;
        window.open(badgeUrl, '_blank');
      } else {
        alert("Badge data is incomplete — cannot open badge page.");
      }
    } else {
      alert("No badges found for your account.");
    }
  } catch (error) {
    console.error("Error fetching badges", error);
    alert("Failed to load badges.");
  }
},

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
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          setStudentName(res.data.name || "Student");
          studentId = res.data.student_details_id_pk || res.data.student_id || null;
          localStorage.setItem("student", JSON.stringify(res.data));
        }

        if (studentId) {
          const quizRes = await axios.get(
            `http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`
          );

          const allQuizzes: Quiz[] = Array.isArray(quizRes.data) ? quizRes.data : [];

          const uniqueQuizzes = allQuizzes.filter(
            (value, index, self) =>
              index === self.findIndex((t) => t.quiz_id === value.quiz_id)
          );

          const available = uniqueQuizzes.filter((q) => q.is_open === 1);
          const attempted = uniqueQuizzes.filter((q) => q.attempt_count >= 1);

          setAvailableQuizzes(available);
          setAttemptedQuizzes(attempted);
        }
      } catch (err) {
        console.error("❌ Failed to load quizzes", err);
        setAvailableQuizzes([]);
        setAttemptedQuizzes([]);
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

  const handleLogout = () => {
    localStorage.removeItem("student");
    localStorage.removeItem("token");
    navigate("/");
  };

  const loadAndGoToQuiz = async (quizId: number, attemptCount: number) => {
    if (attemptCount >= 2) {
      alert("❌ You have reached the maximum of 2 attempts for this quiz.");
      return;
    }

    if (attemptCount === 1) {
      const confirmAttempt = window.confirm(
        "⚠️ This will be your 2nd and final attempt. Are you sure you want to proceed?"
      );
      if (!confirmAttempt) return;
    }

    try {
      const quizRes = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
      navigate(`/quiz/${quizId}`, {
        state: { ...quizRes.data },
      });
    } catch (err) {
      console.error("Quiz load error:", err);
      alert("Could not load quiz. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
        className={`p-5 min-h-screen relative flex flex-col transition-all shadow-lg ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700"
        >
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        {sidebarOpen && (
          <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>
        )}
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
          <div className="flex items-center space-x-4">
            <Bell size={24} />
            <button
              onClick={() => setShowLogoutModal(true)} // Open the logout confirmation modal
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
              title="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer dark:bg-gray-700"
                onClick={item.onClick}
              >
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
            {availableQuizzes.length === 0 ? (
              <Card className="shadow-xl rounded-2xl p-6 dark:bg-gray-800 bg-white">
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">No quizzes available right now.</p>
                </CardContent>
              </Card>
            ) : (
              availableQuizzes.map((quiz) => (
                <Card
                  key={quiz.quiz_id}
                  className={`shadow-xl rounded-2xl p-6 border ${getColorClass(
                    quiz.attempt_count
                  )} dark:bg-gray-800 bg-white`}
                >
                  <CardContent>
                    <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
                      {quiz.quiz_title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-1">{quiz.description}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Attempts Taken: {quiz.attempt_count}
                    </p>
                    <button
                      type="button"
                      onClick={() => loadAndGoToQuiz(quiz.quiz_id, quiz.attempt_count)}
                      disabled={quiz.attempt_count >= 2}
                      className={`px-4 py-2 rounded-lg text-white ${quiz.attempt_count >= 2
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                        }`}
                    >
                      {quiz.attempt_count >= 2 ? "Maxed Out" : "Attempt Quiz"}
                    </button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Attempted Quizzes Section */}
        {attemptedQuizzes.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-4">Attempted Quizzes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attemptedQuizzes.map((quiz) => (
                <Card
                  key={quiz.quiz_id}
                  className="shadow-xl rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                >
                  <CardContent>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                      {quiz.quiz_title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>

                    <div className="text-sm text-green-700 dark:text-green-400 font-bold">
                      <p>Already Attempted</p>

                      {quiz.attempt_count > 0 && (
                        <>
                          <p>
                            Pre Score: {
                              quiz.attempts?.find((a) => a.attempt_type === "pre")?.score ?? "Not Attempted "
                            }
                          </p>
                          <p>
                            Post Score: {
                              quiz.attempts?.find((a) => a.attempt_type === "post")?.score ?? "Not Attempted "
                            }
                          </p>
                        </>
                      )}

                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Are you sure you want to log out?</h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 p-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white p-2 rounded"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;











// import { Card, CardContent } from "@/components/ui/card";
// import axios from "axios";
// import { motion } from "framer-motion";
// import {
//   BadgeCheck,
//   Bell,
//   Link2,
//   LogOut,
//   Menu,
//   MessageCircle,
//   Moon,
//   Star,
//   Sun,
//   Upload
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// // Quiz interface for type checking
// interface Quiz {
//   quiz_id: number;
//   quiz_title: string;
//   description: string;
//   attempt_count: number;
// }

// const getColorClass = (attemptCount: number) => {
//   const nextAttempt = attemptCount + 1;
//   if (nextAttempt === 1) return "bg-green-300 border-green-500";
//   if (nextAttempt === 2) return "bg-blue-100 border-blue-500";
//   if (nextAttempt === 3) return "bg-purple-100 border-purple-500";
//   return "bg-gray-100 border-gray-300";
// };

// const Dashboard = () => {
//   const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
//   const [attemptedQuizzes, setAttemptedQuizzes] = useState<Quiz[]>([]);
//   const [studentName, setStudentName] = useState<string>("Student");

//   const navigate = useNavigate();

//   const dashboardItems = [
//     {
//       icon: <Upload size={32} className="text-green-500" />,
//       title: "Projects Uploaded",
//       count: 1,
//       note: "Total Uploaded Projects",
//       onClick: () => navigate("/upload-project"),
//     },
//     {
//       icon: <Star size={32} className="text-yellow-400" />,
//       title: "Portal Points",
//       count: 0,
//       note: "We Will Update Soon",
//     },
//     {
//       icon: <BadgeCheck size={32} className="text-blue-500" />,
//       title: "Badges Received",
//       count: 0,
//       note: "View Your Badgr Credentials",
//       onClick: async () => {
//         try {
//           const studentData = localStorage.getItem("student");
//           if (!studentData) {
//             alert("Student data missing. Please login again.");
//             return;
//           }

//           const student = JSON.parse(studentData);
//           const email = student.email;

//           const res = await axios.get(`http://localhost:8000/student/badges/${email}`);

//           if (res.data?.result?.length > 0) {
//             const badges = res.data.result;
//             alert(`You have ${badges.length} badges! \n Example Badge Name: ${badges[0]?.badgeclass?.name ?? 'No name'}`);
//           } else {
//             alert("No badges found for your account.");
//           }
//         } catch (error) {
//           console.error("Error fetching badges", error);
//           alert("Failed to load badges.");
//         }
//       },
//     },
//     {
//       icon: <Link2 size={32} className="text-purple-500" />,
//       title: "Event Participation",
//       count: 0,
//       note: "Feature Coming Soon",
//     },
//     {
//       icon: <MessageCircle size={32} className="text-pink-500" />,
//       title: "Student Forum",
//       count: 0,
//       note: "Coming Soon",
//     },
//   ];

//   useEffect(() => {
//     const fetchStudentAndQuizzes = async () => {
//       try {
//         const studentData = localStorage.getItem("student");
//         let studentId: number | null = null;

//         if (studentData) {
//           const parsed = JSON.parse(studentData);
//           setStudentName(parsed.name || "Student");
//           studentId = parsed.student_details_id_pk || parsed.student_id || null;
//         } else {
//           const res = await axios.get("http://localhost:8000/student", {
//             headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//           });
//           setStudentName(res.data.name || "Student");
//           studentId = res.data.student_details_id_pk || res.data.student_id || null;
//           localStorage.setItem("student", JSON.stringify(res.data));
//         }

//         if (studentId) {
//           const quizRes = await axios.get(
//             `http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`
//           );

//           const allQuizzes: Quiz[] = Array.isArray(quizRes.data) ? quizRes.data : [];

//           const uniqueQuizzes = allQuizzes.filter(
//             (value, index, self) =>
//               index === self.findIndex((t) => t.quiz_id === value.quiz_id)
//           );

//           const available = uniqueQuizzes.filter((q) => q.is_open === 1);
//           const attempted = uniqueQuizzes.filter((q) => q.attempt_count >= 1);

//           setAvailableQuizzes(available);
//           setAttemptedQuizzes(attempted);
//         }
//       } catch (err) {
//         console.error("❌ Failed to load quizzes", err);
//         setAvailableQuizzes([]);
//         setAttemptedQuizzes([]);
//       }
//     };

//     fetchStudentAndQuizzes();
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

//   const toggleDarkMode = () => {
//     const newMode = !darkMode;
//     setDarkMode(newMode);
//     localStorage.setItem("theme", newMode ? "dark" : "light");
//     document.documentElement.classList.toggle("dark", newMode);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("student");
//     localStorage.removeItem("token");
//     navigate("/");
//   };

//   const loadAndGoToQuiz = async (quizId: number, attemptCount: number) => {
//     if (attemptCount >= 2) {
//       alert("❌ You have reached the maximum of 2 attempts for this quiz.");
//       return;
//     }

//     if (attemptCount === 1) {
//       const confirmAttempt = window.confirm(
//         "⚠️ This will be your 2nd and final attempt. Are you sure you want to proceed?"
//       );
//       if (!confirmAttempt) return;
//     }

//     try {
//       const quizRes = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
//       navigate(`/quiz/${quizId}`, {
//         state: { ...quizRes.data },
//       });
//     } catch (err) {
//       console.error("Quiz load error:", err);
//       alert("Could not load quiz. Please try again.");
//     }
//   };

//   return (
//     <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
//       {/* Sidebar */}
//       <motion.aside
//         animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
//         className="bg-gray-100 p-5 min-h-screen relative flex flex-col transition-all shadow-lg"
//       >
//         <button
//           onClick={() => setSidebarOpen(!sidebarOpen)}
//           className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700"
//         >
//           <Menu size={20} className="text-gray-700 dark:text-gray-300" />
//         </button>
//         {sidebarOpen && (
//           <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>
//         )}
//       </motion.aside>

//       {/* Main Content */}
//       <main className="flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-3xl font-bold">Welcome, {studentName}</h1>
//           <div className="flex items-center space-x-4">
//             <Bell size={24} />
//             <button
//               onClick={handleLogout}
//               className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full"
//               title="Log Out"
//             >
//               <LogOut size={20} />
//             </button>
//             <button
//               onClick={toggleDarkMode}
//               className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
//               title="Toggle Dark Mode"
//             >
//               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
//             </button>
//           </div>
//         </div>

//         {/* Dashboard Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {dashboardItems.map((item, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//             >
//               <Card
//                 className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer dark:bg-gray-700"
//                 onClick={item.onClick}
//               >
//                 <CardContent>
//                   <div className="flex items-center gap-4 mb-4">
//                     {item.icon}
//                     <h4 className="text-xl font-semibold">{item.title}</h4>
//                   </div>
//                   <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
//                     {item.count}
//                   </p>
//                   <p className="text-gray-500 text-sm mt-2 dark:text-gray-300">
//                     {item.note}
//                   </p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//         {/* Available Quizzes */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {availableQuizzes.length === 0 ? (
//               <Card className="shadow-xl rounded-2xl p-6 dark:bg-gray-800 bg-white">
//                 <CardContent>
//                   <p className="text-gray-600 dark:text-gray-300">No quizzes available right now.</p>
//                 </CardContent>
//               </Card>
//             ) : (
//               availableQuizzes.map((quiz) => (
//                 <Card
//                   key={quiz.quiz_id}
//                   className={`shadow-xl rounded-2xl p-6 border ${getColorClass(
//                     quiz.attempt_count
//                   )} dark:bg-gray-800 bg-white`}
//                 >
//                   <CardContent>
//                     <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
//                       {quiz.quiz_title}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-300 mb-1">{quiz.description}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                       Attempts Taken: {quiz.attempt_count}
//                     </p>
//                     <button
//                       type="button"
//                       onClick={() => loadAndGoToQuiz(quiz.quiz_id, quiz.attempt_count)}
//                       disabled={quiz.attempt_count >= 2}
//                       className={`px-4 py-2 rounded-lg text-white ${quiz.attempt_count >= 2
//                         ? "bg-gray-400 cursor-not-allowed"
//                         : "bg-blue-500 hover:bg-blue-600"
//                         }`}
//                     >
//                       {quiz.attempt_count >= 2 ? "Maxed Out" : "Attempt Quiz"}
//                     </button>
//                   </CardContent>
//                 </Card>
//               ))
//             )}
//           </div>
//         </div>

//         {/* You can keep rest of the Available Quizzes and Attempted Quizzes section unchanged */}
//         {/* Attempted Quizzes */}
//         {attemptedQuizzes.length > 0 && (
//           <div className="mt-16">
//             <h2 className="text-2xl font-bold mb-4">Attempted Quizzes</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {attemptedQuizzes.map((quiz) => (
//                 <Card
//                   key={quiz.quiz_id}
//                   className="shadow-xl rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
//                 >
//                   <CardContent>
//                     <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
//                       {quiz.quiz_title}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>

//                     <div className="text-sm text-green-700 dark:text-green-400 font-bold">
//                       <p>Already Attempted</p>

//                       {quiz.attempt_count > 0 && (
//                         <>
//                           <p>
//                             Pre Score: {
//                               quiz.attempts?.find((a) => a.attempt_type === "pre")?.score ?? "Not Attempted "
//                             }
//                           </p>
//                           <p>
//                             Post Score: {
//                               quiz.attempts?.find((a) => a.attempt_type === "post")?.score ?? "Not Attempted "
//                             }
//                           </p>
//                         </>
//                       )}

//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default Dashboard;










// import {
//   BarChart2,
//   BookOpen,
//   PieChart,
//   User,
//   Users
// } from "lucide-react";

// // Quiz interface for type checking
// interface Quiz {
//   quiz_id: number;
//   quiz_title: string;
//   description: string;
//   attempt_count: number; // how many attempts already taken
// }

// // Dashboard items to display
// interface DashboardItem {
//   icon: React.ReactNode;
//   title: string;
//   count: number;
//   note: string;
// }

// const dashboardItems: (DashboardItem & { onClick?: () => void })[] = [
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
//     note: "View Your Badgr Credentials",
//     onClick: async () => {
//       try {
//         const studentData = localStorage.getItem("student");
//         if (!studentData) {
//           alert("Student data missing. Please login again.");
//           return;
//         }

//         const student = JSON.parse(studentData);
//         const email = student.email;
//         console.log("Student Email:", email);

//         const res = await axios.get(`http://localhost:8000/student/badges/${email}`);

//         if (res.data?.result?.length > 0) {
//           const badges = res.data.result;
//           console.log("Badges:", badges);

//           // For now show in alert
//           alert(`You have ${badges.length} badges! \n Example Badge Name: ${badges[0]?.badgeclass?.name ?? 'No name'}`);

//           // TODO: You can show in modal or popup later

//         } else {
//           alert("No badges found for your account.");
//         }

//       } catch (error) {
//         console.error("Error fetching badges", error);
//         alert("Failed to load badges.");
//       }
//     }
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


// const getColorClass = (attemptCount: number) => {
//   const nextAttempt = attemptCount + 1;
//   if (nextAttempt === 1) return "bg-green-300 border-green-500";   // first attempt
//   if (nextAttempt === 2) return "bg-blue-100 border-blue-500";    // second attempt
//   if (nextAttempt === 3) return "bg-purple-100 border-purple-500"; // third attempt
//   return "bg-gray-100 border-gray-300"; // If they’ve already done 3 (or more), we show a neutral/grey
// };

// const Dashboard = () => {
//   const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [profileMenuOpen, setProfileMenuOpen] = useState(false);
//   const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
//   const [attemptedQuizzes, setAttemptedQuizzes] = useState<Quiz[]>([]);
//   const [studentName, setStudentName] = useState<string>("Student");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchStudentAndQuizzes = async () => {
//       try {
//         const studentData = localStorage.getItem("student");
//         let studentId: number | null = null;

//         if (studentData) {
//           const parsed = JSON.parse(studentData);
//           setStudentName(parsed.name || "Student");
//           studentId = parsed.student_details_id_pk || parsed.student_id || null;
//         } else {
//           const res = await axios.get("http://localhost:8000/student", {
//             headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//           });
//           setStudentName(res.data.name || "Student");
//           studentId = res.data.student_details_id_pk || res.data.student_id || null;
//           localStorage.setItem("student", JSON.stringify(res.data));
//         }

//         if (studentId) {
//           const quizRes = await axios.get(
//             `http://localhost:8000/api/quizzes/assigned-quizzes/${studentId}`
//           );

//           const allQuizzes: Quiz[] = Array.isArray(quizRes.data) ? quizRes.data : [];

//           // Remove duplicates based on quiz_id
//           const uniqueQuizzes = allQuizzes.filter(
//             (value, index, self) =>
//               index === self.findIndex((t) => t.quiz_id === value.quiz_id)
//           );

//           const available = uniqueQuizzes.filter((q) => q.is_open === 1);
//           const attempted = uniqueQuizzes.filter((q) => q.attempt_count >= 1);

//           setAvailableQuizzes(available);
//           setAttemptedQuizzes(attempted);
//         }
//       } catch (err) {
//         console.error("❌ Failed to load quizzes", err);
//         setAvailableQuizzes([]);
//         setAttemptedQuizzes([]);
//       }
//     };

//     fetchStudentAndQuizzes();
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

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
//     localStorage.removeItem("token");
//     navigate("/");
//   };

//   const loadAndGoToQuiz = async (quizId: number, attemptCount: number) => {
//     if (attemptCount >= 2) {
//       alert("❌ You have reached the maximum of 2 attempts for this quiz.");
//       return;
//     }

//     if (attemptCount === 1) {
//       const confirmAttempt = window.confirm(
//         "⚠️ This will be your 2nd and final attempt. Are you sure you want to proceed?"
//       );
//       if (!confirmAttempt) return;
//     }

//     try {
//       const quizRes = await axios.get(`http://localhost:8000/api/quizzes/quiz/${quizId}`);
//       navigate(`/quiz/${quizId}`, {
//         state: {
//           ...quizRes.data,
//         },
//       });
//     } catch (err) {
//       console.error("Quiz load error:", err);
//       alert("Could not load quiz. Please try again.");
//     }
//   };

//   return (
//     <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
//       {/* Sidebar */}
//       <motion.aside
//         animate={{ width: sidebarOpen ? "16rem" : "4rem" }}
//         className="bg-gray-100  p-5 min-h-screen fixed md:relative flex flex-col transition-all shadow-lg z-40"
//       >
//         <button
//           onClick={toggleSidebar}
//           className="mb-6 p-2 rounded-lg bg-gray-300 dark:bg-gray-700"
//           aria-label="Toggle Sidebar"
//         >
//           <Menu size={20} className="text-gray-700 dark:text-gray-300" />
//         </button>
//         {sidebarOpen && (
//           <h2 className="text-2xl font-bold dark:text-white">Student Dashboard</h2>
//         )}
//         <ul className="mt-6 space-y-4">
//           {[{ label: "Dashboard", Icon: BarChart2 }, { label: "Students", Icon: Users }, { label: "Courses", Icon: BookOpen }, { label: "Analytics", Icon: PieChart }]
//             .map(({ label, Icon }) => (
//               <li key={label} className="flex items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400">
//                 <Icon className="w-5 h-5 mr-2" /> {sidebarOpen && label}
//               </li>
//             ))}
//         </ul>
//       </motion.aside>

//       {/* Main Content */}
//       <main
//         className={`flex-1 p-6 md:p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${sidebarOpen ? "ml-64" : "ml-16"
//           } md:ml-0`}
//       >
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
//                 <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50">
//                   <button
//                     onClick={handleLogout}
//                     className="w-full px-4 py-2 text-left text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
//                   >
//                     Log Out
//                   </button>
//                 </div>
//               )}
//             </div>
//             <button
//               onClick={toggleDarkMode}
//               className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full"
//               aria-label="Toggle Dark Mode"
//             >
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
//               <Card
//                 className="bg-white shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer dark:bg-gray-700"
//                 onClick={item.onClick}
//               >
//                 <CardContent>
//                   <div className="flex items-center gap-4 mb-4">
//                     {item.icon}
//                     <h4 className="text-xl font-semibold">{item.title}</h4>
//                   </div>
//                   <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">
//                     {item.count}
//                   </p>
//                   <p className="text-gray-500 text-sm mt-2 dark:text-gray-300">
//                     {item.note}
//                   </p>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           ))}
//         </div>

//         {/* Available Quizzes */}
//         <div className="mt-12">
//           <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {availableQuizzes.length === 0 ? (
//               <Card className="shadow-xl rounded-2xl p-6 dark:bg-gray-800 bg-white">
//                 <CardContent>
//                   <p className="text-gray-600 dark:text-gray-300">No quizzes available right now.</p>
//                 </CardContent>
//               </Card>
//             ) : (
//               availableQuizzes.map((quiz) => (
//                 <Card
//                   key={quiz.quiz_id}
//                   className={`shadow-xl rounded-2xl p-6 border ${getColorClass(
//                     quiz.attempt_count
//                   )} dark:bg-gray-800 bg-white`}
//                 >
//                   <CardContent>
//                     <h3 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
//                       {quiz.quiz_title}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-300 mb-1">{quiz.description}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
//                       Attempts Taken: {quiz.attempt_count}
//                     </p>
//                     <button
//                       type="button"
//                       onClick={() => loadAndGoToQuiz(quiz.quiz_id, quiz.attempt_count)}
//                       disabled={quiz.attempt_count >= 2}
//                       className={`px-4 py-2 rounded-lg text-white ${quiz.attempt_count >= 2
//                         ? "bg-gray-400 cursor-not-allowed"
//                         : "bg-blue-500 hover:bg-blue-600"
//                         }`}
//                     >
//                       {quiz.attempt_count >= 2 ? "Maxed Out" : "Attempt Quiz"}
//                     </button>
//                   </CardContent>
//                 </Card>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Attempted Quizzes */}
//         {attemptedQuizzes.length > 0 && (
//           <div className="mt-16">
//             <h2 className="text-2xl font-bold mb-4">Attempted Quizzes</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {attemptedQuizzes.map((quiz) => (
//                 <Card
//                   key={quiz.quiz_id}
//                   className="shadow-xl rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
//                 >
//                   <CardContent>
//                     <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
//                       {quiz.quiz_title}
//                     </h3>
//                     <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>

//                     <div className="text-sm text-green-700 dark:text-green-400 font-bold">
//                       <p>Already Attempted</p>

//                       {quiz.attempt_count > 0 && (
//                         <>
//                           <p>
//                             Pre Score: {
//                               quiz.attempts?.find((a) => a.attempt_type === "pre")?.score ?? "Not Attempted "
//                             }
//                           </p>
//                           <p>
//                             Post Score: {
//                               quiz.attempts?.find((a) => a.attempt_type === "post")?.score ?? "Not Attempted "
//                             }
//                           </p>
//                         </>
//                       )}

//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}

//       </main>
//     </div>
//   );
// };

// export default Dashboard;








