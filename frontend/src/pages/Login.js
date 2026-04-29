import { useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/api/auth/login`, form);
      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      <div className="bg-white/30 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Welcome Back
        </h2>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded-lg bg-white/70 border focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg bg-white/70 border focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

        <p className="text-sm text-gray-600 text-center mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
}