
import { Route, Routes } from "react-router-dom";
import AboutPage from "./components/pages/about";
import Artefacts from "./components/pages/artefacts";
import BatchAssignment from "./components/pages/BatchAssignment";
import Blog from "./components/pages/blog";
import Disclaimer from "./components/pages/disclaimer";
import Home from "./components/pages/home";
import Login from "./components/pages/login";
import QuizView from './components/pages/QuizView';
import Services from "./components/pages/services";
import Story from "./components/pages/story";
import Student from "./components/pages/student";
import Teacher from "./components/pages/teacher";
import RootLayout from "./components/root-layout";

import { ActiveTabProvider } from "./components/ActiveTabContext";



const App = () => {
    return (
        <div className="min-h-screen bg-black text-foreground">
            {/* Wrap everything inside ActiveTabProvider */}
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
                        <Route path="artefacts" element={< Artefacts/>} />

                    </Route>
                    <Route path="student" element={<Student />} />
                    <Route path="teacher" element={<Teacher />} />
                    <Route path="/quiz/:quiz_id" element={<QuizView />} />
                    <Route path="teacher/batches" element={<BatchAssignment />} />

                    


                </Routes>
                
            </ActiveTabProvider>
        </div>
    );
};
export default App;



// import { Route, Routes } from "react-router-dom";
// import AboutPage from "./components/pages/about";
// import Blog from "./components/pages/blog";
// // import ContactPage from "./components/pages/contact";
// // import { ContactsPage } from "./components/pages/ContactPage";
// import Disclaimer from "./components/pages/disclaimer";
// import Home from "./components/pages/home";
// import Login from "./components/pages/login";
// import Services from "./components/pages/services";
// import Story from "./components/pages/story";
// import Student from "./components/pages/student";
// import Teacher from "./components/pages/teacher";

// import RootLayout from "./components/root-layout";
// // Import the ActiveTabProvider
// import { ActiveTabProvider } from "./components/ActiveTabContext";


// const App = () => {
//     return (
//         <div className="min-h-screen bg-black text-foreground">
//             {/* Wrap everything inside ActiveTabProvider */}
//             <ActiveTabProvider>
//                 <Routes>
//                     <Route element={<RootLayout />}>
//                         <Route index element={<Home />} />
//                         {/* <Route path="contact" element={<ContactPage />} /> */}
//                         <Route path="about" element={<AboutPage />} />
//                         <Route path="blog" element={<Blog />} />
//                         <Route path="disclaimer" element={<Disclaimer />} />
//                         <Route path="services" element={<Services />} />
//                         <Route path="story" element={<Story />} />
//                         <Route path="login" element={<Login />} />
//                         {/* <Route path="ContactsPage" element={<ContactsPage />} /> */}
//                     </Route>
                    
//                     <Route path="student" element={<Student />} />
//                     <Route path="teacher" element={<Teacher />} />


//                 </Routes>
                
//             </ActiveTabProvider>
//         </div>
//     );
// };
// export default App;
