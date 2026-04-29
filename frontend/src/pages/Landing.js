import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const goToChat = () => {
    if (token) navigate("/chat");
    else navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

      {/* 🔝 NAVBAR */}
      <div className="flex justify-between items-center px-8 py-4 bg-white/30 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          ChatApp 💬
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-700 hover:text-blue-600 transition"
          >
            Login
          </button>

          <button
            onClick={goToChat}
            className="bg-blue-500 text-white px-5 py-2 rounded-full hover:bg-blue-600 transition shadow-md"
          >
            Open Chat
          </button>
        </div>
      </div>

      {/* 💡 HERO SECTION */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="bg-white/30 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-10 max-w-2xl text-center">

          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Real-Time Chat, Reinvented 🚀
          </h2>

          <p className="text-gray-600 mb-6">
            Connect instantly with friends, create groups, and enjoy seamless
            messaging with modern UI and real-time updates.
          </p>

          <div className="flex justify-center gap-4">

            <button
              onClick={goToChat}
              className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition shadow-md"
            >
              Start Chatting
            </button>

            <button
              onClick={() => navigate("/register")}
              className="bg-white/60 px-6 py-3 rounded-full hover:bg-white transition shadow"
            >
              Create Account
            </button>

          </div>

        </div>
      </div>

      {/* 🔽 FOOTER */}
      <div className="text-center text-gray-500 text-sm pb-4">
        © {new Date().getFullYear()} ChatApp • Built with ❤️
      </div>
    </div>
  );
}