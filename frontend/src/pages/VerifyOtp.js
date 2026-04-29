import { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);

  const { state } = useLocation();
  const navigate = useNavigate();

  // ⏳ countdown timer
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ✅ verify OTP
  const verify = async () => {
    try {
      setLoading(true);

      await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
        email: state?.email,
        otp,
      });

      alert("✅ Verified! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 resend OTP
  const resendOtp = async () => {
    try {
      setResending(true);

      await axios.post(`${BASE_URL}/api/auth/resend-otp`, {
        email: state?.email,
      });

      alert(" OTP resent!");

      setTimer(30); // 30 sec cooldown
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200">

      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-semibold text-center mb-2">
          Verify OTP 🔐
        </h2>

        <p className="text-sm text-gray-500 text-center mb-6">
          Enter the code sent to your email
        </p>

        <div className="space-y-4">

          {/* OTP Input */}
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full text-center tracking-widest text-lg px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Verify Button */}
          <button
            onClick={verify}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>

          {/* 🔁 Resend */}
          <div className="text-center text-sm text-gray-500">
            {timer > 0 ? (
              <span>Resend OTP in {timer}s</span>
            ) : (
              <button
                onClick={resendOtp}
                disabled={resending}
                className="text-blue-500 hover:underline"
              >
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>

        </div>

        {/* Back */}
        <p className="text-sm text-gray-500 text-center mt-4">
          Wrong email?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/")}
          >
            Register again
          </span>
        </p>

      </div>
    </div>
  );
}