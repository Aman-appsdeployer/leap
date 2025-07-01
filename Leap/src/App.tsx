import { Route, Routes } from "react-router-dom";
import AboutPage from "./components/pages/about";
import Artefacts from "./components/pages/artefacts";
import BatchAssign from "./components/pages/BatchAssign";
import BatchAssignment from "./components/pages/BatchAssignment";
import PostEditor from "./components/PostEditor";
import PostViewer from "./components/PostViewer";
import UploadProject from "./components/UploadProject";

import Blog from "./components/pages/blog";
import Disclaimer from "./components/pages/disclaimer";
import Home from "./components/pages/home";
import Login from "./components/pages/login";
import QuizView from './components/pages/QuizView';
import Services from "./components/pages/services";
import Story from "./components/pages/story";
import Student from "./components/pages/student";
import StudentView from "./components/pages/StudentView";
import Teacher from "./components/pages/teacher";
import RootLayout from "./components/root-layout";

import { ActiveTabProvider } from "./components/ActiveTabContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
    return (
        <div className="min-h-screen bg-black text-foreground">
            <ActiveTabProvider>
                <Routes>
                    <Route element={<RootLayout />}>
                        <Route index element={<Home />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="blog" element={<Blog />} />
                        <Route path="disclaimer" element={<Disclaimer />} />
                        <Route path="services" element={<Services />} />
                        <Route path="story" element={<Story />} />
                        <Route path="login" element={<Login />} />
                        <Route path="artefacts" element={<Artefacts />} />
                        <Route path="PostViewer" element={<PostViewer />} />
                    </Route>

                    <Route path="/quiz/:quiz_id" element={<QuizView />} />
                    <Route path="/StudentView" element={<StudentView />} />

                    {/* ✅ Protected route for students */}
                    <Route
                        path="/upload-project"
                        element={
                            <ProtectedRoute allowedRoles={["students"]}>
                                <UploadProject />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ Protected teacher routes */}
                    <Route
                        path="teacher"
                        element={
                            <ProtectedRoute allowedRoles={["teacher"]}>
                                <Teacher />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="teacher/batches"
                        element={
                            <ProtectedRoute allowedRoles={["teacher"]}>
                                <BatchAssignment />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="teacher/batch-assignments"
                        element={
                            <ProtectedRoute allowedRoles={["teacher"]}>
                                <BatchAssign />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="teacher/PostEditor"
                        element={
                            <ProtectedRoute allowedRoles={["teacher"]}>
                                <PostEditor />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="teacher/StudentView"
                        element={
                            <ProtectedRoute allowedRoles={["teacher"]}>
                                <StudentView />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ Protected route for students */}
                    <Route
                        path="student"
                        element={
                            <ProtectedRoute allowedRoles={["students"]}>
                                <Student />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </ActiveTabProvider>
        </div>
    );
};

export default App;





// import { Route, Routes } from "react-router-dom";
// import AboutPage from "./components/pages/about";
// import Artefacts from "./components/pages/artefacts";
// import BatchAssign from "./components/pages/BatchAssign";
// import BatchAssignment from "./components/pages/BatchAssignment";
// import PostEditor from "./components/PostEditor";
// import PostViewer from "./components/PostViewer";
// import UploadProject from "./components/UploadProject";

// import Blog from "./components/pages/blog";
// import Disclaimer from "./components/pages/disclaimer";
// import Home from "./components/pages/home";
// import Login from "./components/pages/login";
// import QuizView from './components/pages/QuizView';
// import Services from "./components/pages/services";
// import Story from "./components/pages/story";
// import Student from "./components/pages/student";
// import Teacher from "./components/pages/teacher";
// import RootLayout from "./components/root-layout";

// import { ActiveTabProvider } from "./components/ActiveTabContext";
// import ProtectedRoute from "./components/ProtectedRoute"; // ✅ Import this

// const App = () => {
//     return (
//         <div className="min-h-screen bg-black text-foreground">
//             <ActiveTabProvider>
//                 <Routes>
//                     <Route element={<RootLayout />}>
//                         <Route index element={<Home />} />
//                         <Route path="about" element={<AboutPage />} />
//                         <Route path="blog" element={<Blog />} />
//                         <Route path="disclaimer" element={<Disclaimer />} />
//                         <Route path="services" element={<Services />} />
//                         <Route path="story" element={<Story />} />
//                         <Route path="login" element={<Login />} />
//                         <Route path="artefacts" element={<Artefacts />} />
//                         <Route path="post-editor" element={<PostEditor />} />
//                         <Route path="post-viewer" element={<PostViewer />} />
//                     </Route>

//                     <Route path="/quiz/:quiz_id" element={<QuizView />} />

//                     <Route
//                         path="/upload-project"
//                         element={
//                             <ProtectedRoute allowedRoles={["students"]}>
//                                 <UploadProject />
//                             </ProtectedRoute>
//                         }
//                     />

//                     {/* 🛡️ Protected Teacher Routes */}
//                     <Route
//                         path="teacher"
//                         element={
//                             <ProtectedRoute allowedRoles={["teacher"]}>
//                                 <Teacher />
//                             </ProtectedRoute>
//                         }
//                     />
//                     <Route
//                         path="teacher/batches"
//                         element={
//                             <ProtectedRoute allowedRoles={["teacher"]}>
//                                 <BatchAssignment />
//                             </ProtectedRoute>
//                         }
//                     />
//                     <Route
//                         path="/teacher/batch-assignments"
//                         element={
//                             <ProtectedRoute allowedRoles={["teacher"]}>
//                                 <BatchAssign />
//                             </ProtectedRoute>
//                         }
//                     />

//                     {/* 🛡️ Protected Student Routes */}
//                     <Route
//                         path="student"
//                         element={
//                             <ProtectedRoute allowedRoles={["students"]}>
//                                 <Student />
//                             </ProtectedRoute>
//                         }
//                     />

//                 </Routes>
//             </ActiveTabProvider>
//         </div>
//     );
// };

// export default App;





