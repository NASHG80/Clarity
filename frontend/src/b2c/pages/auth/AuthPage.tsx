import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Loader2, ArrowRight, Leaf } from 'lucide-react';

export default function AuthPage() {
  const { t } = useTranslation('b2c');
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'customer' | 'business'>('customer');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Handle location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        // Using coordinates as placeholder, a real app might use reverse-geocoding here
        setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      },
      (error) => {
        setIsLocating(false);
        alert('Unable to retrieve your location. Please enter it manually.');
      }
    );
  };

  // Handle form submission and routing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      
      const payload = {
        email,
        password,
        ...(mode === 'signup' && { role, location })
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.detail || 'Authentication failed'}`);
        return;
      }

      // Success: store identity in sessionStorage for the dashboard
      sessionStorage.setItem('clarity_user_id', data.user_id);
      sessionStorage.setItem('clarity_token', data.token);
      sessionStorage.setItem('clarity_role', data.role);

      // Route based on role
      if (data.role === 'customer') {
        navigate('/customer-dashboard');
      } else {
        if (data.is_first_time) {
          navigate('/onboarding');
        } else {
          navigate('/b2b/opportunity-detector');
        }
      }
    } catch (err) {
      alert('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EDE9] flex flex-col items-center justify-center p-4">
      {/* Optional: Add a simple home link/logo */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-[#26382D] hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-[#26382D] text-[#F8F6F3] flex items-center justify-center">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-serif text-xl tracking-tight font-medium">CLARITY</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-[#F8F6F3] rounded-3xl p-8 border border-[#D8C9BE] shadow-[0_24px_60px_rgba(38,56,45,0.08)]">
        <h2 className="font-serif text-3xl font-medium text-[#26382D] text-center mb-6">
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {/* Mode Toggle (Login / Signup) */}
        <div className="flex bg-[#F1EDE9] rounded-xl p-1 mb-6 border border-[#D8C9BE]/50">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-white text-[#26382D] shadow-sm' : 'text-[#A99587] hover:text-[#26382D]'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              mode === 'signup' ? 'bg-white text-[#26382D] shadow-sm' : 'text-[#A99587] hover:text-[#26382D]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Toggle (Customer / Business) */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-[#D8C9BE] p-1 bg-[#F8F6F3]">
            <button
              onClick={() => setRole('customer')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                role === 'customer' ? 'bg-[#26382D] text-white' : 'text-[#A99587] hover:text-[#26382D]'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setRole('business')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                role === 'business' ? 'bg-[#26382D] text-white' : 'text-[#A99587] hover:text-[#26382D]'
              }`}
            >
              Business
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#26382D] mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-[#D8C9BE] rounded-xl px-4 py-2.5 text-sm text-[#26382D] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26382D] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-[#D8C9BE] rounded-xl px-4 py-2.5 text-sm text-[#26382D] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]"
              placeholder="••••••••"
            />
          </div>

          {/* Customer Location (Only on Signup) */}
          {mode === 'signup' && role === 'customer' && (
            <div>
              <label className="block text-xs font-semibold text-[#26382D] mb-1.5">Current Location</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-[#D8C9BE] rounded-xl pl-4 pr-12 py-2.5 text-sm text-[#26382D] focus:outline-none focus:ring-2 focus:ring-[#7C9278]/50 focus:border-[#7C9278]"
                  placeholder="City or Address"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#7C9278] hover:bg-[#F1EDE9] rounded-lg transition-colors"
                  aria-label="Detect Location"
                >
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end mt-2">
              <a href="#" className="text-xs font-medium text-[#7C9278] hover:underline">
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-[#26382D] text-white py-3 rounded-xl text-sm font-bold tracking-wider hover:bg-[#1A261E] transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#26382D]/60 font-light">
          By continuing, you agree to our{' '}
          <a href="#" className="underline hover:text-[#26382D]">Terms of Service</a> and{' '}
          <a href="#" className="underline hover:text-[#26382D]">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
