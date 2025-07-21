import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    // Validation
    if (!name || !phone || !gender || !userType || !email || !state || !password || !confirmPassword) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://209.182.233.188:8000/register", {
        name,
        phone,
        gender,
        user_type: userType.toLowerCase(),
        email,
        state,
        password,
      });

      if (response.data.success) {
        navigate("/login"); // Redirect to login after successful registration
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex justify-center items-center bg-black -mt-10">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden -mt-10">
        {/* Left image column */}
        <div
          className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center"
          style={{ backgroundImage: "url('/tiss.jfif')" }}
        ></div>

        {/* Right registration form */}
        <div className="w-full md:w-1/2 p-8 bg-stone-900 text-white">
          <h2 className="text-2xl font-bold text-red-500 text-center">Welcome to the LeaP Portal</h2>
          <p className="text-sm text-center text-gray-400 mt-1">
            <a
              href="https://t.me/ite_updates"
              className="text-red-500 hover:underline"
            >
              Join the Telegram group for regular notifications
            </a>
          </p>

          <div className="mt-6">
            <label className="block text-gray-300">Full Name</label>
            <input
              type="text"
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-300">Phone</label>
            <input
              type="text"
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-300">Gender</label>
            <select
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Please Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="mt-4">
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
            <label className="block text-gray-300">Email</label>
            <input
              type="email"
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-gray-300">State</label>
            <select
              className="w-full mt-2 px-4 py-2 border rounded-lg bg-stone-800 text-white focus:ring focus:ring-red-600"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Please Select</option>
              <option value="state1">State 1</option>
              <option value="state2">State 2</option>
            </select>
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

          <div className="mt-4 relative">
            <label className="block text-gray-300">Confirm Password</label>
            <div className="flex items-center border rounded-lg mt-2 bg-stone-800">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full px-4 py-2 bg-transparent text-white focus:ring focus:ring-red-600"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="px-3 text-gray-400"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            className={`w-full mt-6 py-2 rounded-lg ${loading ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"} text-white`}
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "REGISTER"}
          </button>

          <div className="flex justify-between text-sm mt-4 text-gray-400">
            <a href="/login" className="text-red-500 hover:underline">
              Already have an account? Login
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

export default Register;
