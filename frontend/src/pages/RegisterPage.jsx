import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  // 1. Local State to track form inputs
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'agent' 
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 2. Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 3. Submit to the backend
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Points to your Live Backend on Port 5000
      const response = await axios.post('http://localhost:5000/api/auth/signup', form);
      
      if (response.status === 201) {
        alert("Account created successfully! Redirecting to login...");
        navigate('/login');
      }
    } catch (err) {
      // 4. Detailed Error Handling
      // This will now show if it's a DB connection error or a real duplicate email
      const errorMessage = err.response?.data?.error || "Server connection failed. Is the backend running?";
      alert("Registration Error: " + errorMessage);
      console.error("Signup Details:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Join ContextAI</h1>
          <p className="text-slate-500 mt-2 text-sm">Create an account to start managing leads.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Full Name</label>
            <input 
              name="name"
              required
              className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-100 outline-none transition-all"
              placeholder="Aleena"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Work Email</label>
            <input 
              name="email"
              type="email"
              required
              className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-100 outline-none transition-all"
              placeholder="aleena@contextai.com"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">Password</label>
            <input 
              name="password"
              type="password"
              required
              className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-100 outline-none transition-all"
              placeholder="••••••••"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider ml-1">System Role</label>
            <select 
              name="role"
              className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-100 outline-none appearance-none cursor-pointer"
              onChange={handleChange}
              value={form.role}
            >
              <option value="agent">Agent (View Dashboard)</option>
              <option value="manager">Manager (View Analytics)</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 bg-black text-white rounded-xl font-bold shadow-sm transition-all mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Already have an account? <span className="text-black font-semibold cursor-pointer underline underline-offset-4" onClick={() => navigate('/login')}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;