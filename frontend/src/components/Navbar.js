import { useNavigate } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="w-full bg-white text-black px-6 py-4 flex justify-between items-center border-b border-gray-300 sticky top-0 z-50">
      
      <h1 className="text-xl font-semibold">ChatApp</h1>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>

    </div>
  );
}
