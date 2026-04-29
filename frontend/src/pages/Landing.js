import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-purple-900 text-white">

      {/* NAVBAR */}
      <div className="flex justify-between p-6 bg-white/10 backdrop-blur-xl border-b border-white/10">
        <h1 className="text-xl font-semibold">ChatApp</h1>

        <div className="flex gap-4">
          <button onClick={() => navigate("/login")}>Login</button>
          <button
            onClick={() => token ? navigate("/chat") : navigate("/login")}
            className="bg-purple-500 px-4 py-1 rounded"
          >
            Chat
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-2xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Real-Time Chat 
          </h2>
          <p className="text-gray-400 mb-6">
            Modern messaging with sockets & real-time updates.
          </p>

          <button
            onClick={() => navigate("/chat")}
            className="bg-purple-500 px-6 py-3 rounded-lg"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}
