import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const goToChat = () => {
    if (token) {
      navigate("/chat");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex flex-col">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="text-xl font-bold text-blue-600">ChatApp</h1>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline"
          >
            Login
          </button>

          <button
            onClick={goToChat}
            className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600"
          >
            Chat
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="flex flex-1 items-center justify-center text-center px-4">
        <div>
          <h2 className="text-4xl font-bold mb-4">
            Real-time Chat Application 💬
          </h2>

          <p className="text-gray-600 mb-6">
            Chat with friends, create groups, and enjoy real-time messaging.
          </p>

          <button
            onClick={goToChat}
            className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600"
          >
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  );
}