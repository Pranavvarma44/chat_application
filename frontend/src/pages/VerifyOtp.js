import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0); // ⏱ countdown
  const { state } = useLocation();
  const navigate = useNavigate();

  // ⏳ countdown logic
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const verify = async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        email: state.email,
        otp,
      });
      navigate("/login");
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  const resend = async () => {
    try {
      await axios.post(`${BASE_URL}/api/auth/resend-otp`, {
        email: state.email,
      });

      setTimer(30); // 🔥 start 30 sec timer
    } catch (err) {
      alert("Failed to resend OTP");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white">

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 w-full max-w-md text-center">

        <h2 className="text-2xl mb-4">Verify OTP 🔐</h2>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={verify}
          className="w-full bg-purple-500 hover:bg-purple-600 py-2 rounded-lg mb-3"
        >
          Verify
        </button>

        {/* ⏱ RESEND BUTTON */}
        <button
          onClick={resend}
          disabled={timer > 0}
          className={`text-sm ${
            timer > 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-purple-400 hover:underline"
          }`}
        >
          {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
        </button>

      </div>
    </div>
  );
}