import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });

      // Store the real token and user data from the DB
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect based on the role stored in the database
      if (res.data.user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.error || "Invalid credentials"));
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-8 text-slate-900">ContextAI</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Work Email"
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-100"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-100"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
            Sign In
          </button>
          <p className="text-center text-sm text-slate-500">
            Need an account? <span className="underline cursor-pointer" onClick={() => navigate('/signup')}>Sign up</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;