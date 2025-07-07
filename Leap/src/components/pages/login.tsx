import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import endpoints from "../../api/endpoints";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    if (!userType || !username || !password) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(endpoints.auth.login, {
        user_type: userType.toLowerCase(),
        username,
        password,
      });

      if (response.data.success) {
        const { token, student, redirect } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user_type", userType.toLowerCase());

        // ✅ Save student data (required for UploadProject)
        if (userType.toLowerCase() === "students" && student) {
          localStorage.setItem("student", JSON.stringify(student));
        }

        navigate(redirect);
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex justify-center items-center bg-black -mt-24">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden">
        <div
          className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center"
          style={{ backgroundImage: "url('/tiss.jfif')" }}
        ></div>

        <div className="w-full md:w-1/2 p-8 bg-stone-900 text-white">
          <h2 className="text-2xl font-bold text-red-500 text-center">
            Welcome to the LeaP Portal
          </h2>
          <p className="text-sm text-center text-gray-400 mt-1">
            <a
              href="https://t.me/ite_updates"
              className="text-red-500 hover:underline"
            >
              Join the Telegram group for regular notifications
            </a>
          </p>

          <div className="mt-6">
            <label className="block text-gray-300">Select User Type</label>
            <select
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="">Please Select</option>
              <option value="students">STUDENT</option>
              <option value="teacher">TEACHER</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-gray-300">Username / Email ID</label>
            <input
              type="text"
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mt-4 relative">
            <label className="block text-gray-300">Password</label>
            <div className="flex items-center border rounded-lg mt-2 bg-stone-800">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 bg-transparent text-white focus:ring focus:ring-red-600"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="px-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            className={`w-full mt-6 py-2 rounded-lg ${
              loading ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
            } text-white`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <div className="flex justify-between text-sm mt-4 text-gray-400">
            <a href="/" className="text-red-500 hover:underline">
              Forgot Password
            </a>
            <a
              href="https://leap21stcentury.org/contest"
              className="text-red-500 hover:underline"
            >
              Register for Illuminate-24
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;











// import axios from "axios";
// import { Eye, EyeOff } from "lucide-react";
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const Login: React.FC = () => {
//     const navigate = useNavigate();
//     const [userType, setUserType] = useState("");
//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");
//     const [error, setError] = useState("");
//     const [showPassword, setShowPassword] = useState(false);

//     const handleLogin = async () => {
//         setError("");

//         if (!userType || !username || !password) {
//             setError("Please fill all fields");
//             return;
//         }

//         try {
//             const response = await axios.post("http://localhost:8000/login", {
//                 user_type: userType.toLowerCase(),
//                 username,
//                 password,
//             });

//             if (response.data.success) {
//                 localStorage.setItem("token", response.data.token);
//                 navigate(response.data.redirect); // "/student" or "/teacher"
//             } else {
//                 setError(response.data.message || "Invalid credentials");
//             }
//         } catch (err: any) {
//             setError(err.response?.data?.detail || "Login failed. Please try again.");
//         }
//     };

//     return (
//         <section className="min-h-screen flex justify-center items-center bg-black -mt-10">
//             <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden -mt-10">
//                 {/* Left image column */}
//                 <div
//                     className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center"
//                     style={{ backgroundImage: "url('/tiss.jfif')" }}
//                 ></div>

//                 {/* Right login form */}
//                 <div className="w-full md:w-1/2 p-8 bg-stone-900 text-white">
//                     <h2 className="text-2xl font-bold text-red-500 text-center">
//                         Welcome to the LeaP Portal
//                     </h2>
//                     <p className="text-sm text-center text-gray-400 mt-1">
//                         <a
//                             href="https://t.me/ite_updates"
//                             className="text-red-500 hover:underline"
//                         >
//                             Join the Telegram group for regular notifications
//                         </a>
//                     </p>

//                     <div className="mt-6">
//                         <label className="block text-gray-300">Select User Type</label>
//                         <select
//                             className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
//                             value={userType}
//                             onChange={(e) => setUserType(e.target.value)}
//                         >
//                             <option value="">Please Select</option>
//                             <option value="students">STUDENT</option>
//                             <option value="teacher">TEACHER</option>
//                         </select>
//                     </div>

//                     <div className="mt-4">
//                         <label className="block text-gray-300">Username / Email ID</label>
//                         <input
//                             type="text"
//                             className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
//                             placeholder="Enter your username or email"
//                             value={username}
//                             onChange={(e) => setUsername(e.target.value)}
//                         />
//                     </div>

//                     <div className="mt-4 relative">
//                         <label className="block text-gray-300">Password</label>
//                         <div className="flex items-center border rounded-lg mt-2 bg-stone-800">
//                             <input
//                                 type={showPassword ? "text" : "password"}
//                                 className="w-full px-4 py-2 bg-transparent text-white focus:ring focus:ring-red-600"
//                                 placeholder="Enter your password"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                             />
//                             <button
//                                 type="button"
//                                 className="px-3 text-gray-400"
//                                 onClick={() => setShowPassword(!showPassword)}
//                             >
//                                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                             </button>
//                         </div>
//                     </div>

//                     {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

//                     <button
//                         className="w-full mt-6 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
//                         onClick={handleLogin}
//                     >
//                         LOGIN
//                     </button>

//                     <div className="flex justify-between text-sm mt-4 text-gray-400">
//                         <a href="/" className="text-red-500 hover:underline">
//                             Forgot Password
//                         </a>
//                         <a
//                             href="https://leap21stcentury.org/contest"
//                             className="text-red-500 hover:underline"
//                         >
//                             Register for Illuminate-24
//                         </a>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default Login;




















