import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="w-full bg-white shadow px-6 py-3 flex justify-between items-center">

      {/* Left */}
      <h1 className="text-xl font-semibold text-blue-600">
        ChatApp
      </h1>

      {/* Right */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}