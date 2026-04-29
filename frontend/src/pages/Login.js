import { useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const login = async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, form);
    localStorage.setItem("token", res.data.token);
    navigate("/chat");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900">

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-semibold text-center text-white mb-6">
          Welcome Back 
        </h2>

        <div className="space-y-4">

          <input
            placeholder="Email"
            className="w-full px-4 py-2 rounded-lg bg-black/30 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={e => setForm({...form, email: e.target.value})}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg bg-black/30 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={e => setForm({...form, password: e.target.value})}
          />

          <button
            onClick={login}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition"
          >
            Login
          </button>

        </div>

        <p className="text-sm text-gray-400 text-center mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-purple-400 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
}
