import { useState } from "react";
import axios from "axios";
import BASE_URL from "../api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const register = async () => {
    await axios.post(`${BASE_URL}/api/auth/register`, form);
    navigate("/verify", { state: { email: form.email } });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-purple-900">

      <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl text-center mb-6">Create Account ✨</h2>

        <div className="space-y-4">
          <input placeholder="Username" className="input" onChange={e => setForm({...form, username: e.target.value})}/>
          <input placeholder="Email" className="input" onChange={e => setForm({...form, email: e.target.value})}/>
          <input type="password" placeholder="Password" className="input" onChange={e => setForm({...form, password: e.target.value})}/>

          <button onClick={register} className="btn">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
