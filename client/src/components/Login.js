import React, { useState } from 'react';
import { useAuth } from '../App';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate ကို import လုပ်ပါ
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiLogIn } from 'react-icons/fi';

function Login() {
  const [formData, setFormData] = useState({
    email: '', // username ကို email လို့ ပြောင်းပါ
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // useNavigate hook ကို သုံးပါ

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError(''); // Error ရှိနေရင် input ပြောင်းတာနဲ့ ဖျောက်ပါ
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- Placeholder Logic ကို ဖယ်ရှားပြီး API Call ထည့်ပါ ---
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email, // email ကို ပို့ပါ
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend က ပြန်ပို့တဲ့ error message ကို သုံးပါ
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // Login အောင်မြင်ပါက
      console.log('Login successful:', data.message); // Backend message ကို log ထုတ်ပါ

      // --- localStorage မှာ login အခြေအနေကို မှတ်သားပါ ---
      localStorage.setItem('isAuthenticated', 'true');
      // Optional: Backend က token ပြန်ပို့ရင် token ကိုလည်း သိမ်းနိုင်ပါတယ်
      // if (data.token) {
      //   localStorage.setItem('authToken', data.token);
      // }
      // --- End localStorage ---

      login(); // Auth context ထဲက login function ကို ခေါ်ပါ (App state ပြောင်းရန်)
      // navigate('/'); // Login အောင်မြင်ရင် Home page (သို့) Dashboard ကို ပို့ပါ (လိုအပ်သလို ပြင်ပါ)

    } catch (err) {
      console.error("Login Failed:", err);
      // Error message ကို state ထဲ ထည့်ပါ
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-3">Welcome Back</h2>
                <p className="text-muted">Please enter your credentials to login</p>
              </div>
              
              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError('')}
                  ></button>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  {/* Label နှင့် Input field ကို email အတွက် ပြင်ပါ */}
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email" // type ကို email ပြောင်းပါ
                    className="form-control py-2"
                    id="email"
                    name="email" // name ကို email ပြောင်းပါ
                    value={formData.email} // formData.email ကို သုံးပါ
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control py-2"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div className="d-flex justify-content-end mt-2">
                    <Link to="/forgot-password" className="text-decoration-none small">Forgot password?</Link>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <FiLogIn className="me-2" />
                  )}
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                
                <div className="text-center text-muted mb-4 position-relative">
                  <span className="px-2 bg-white position-relative">or continue with</span>
                  <hr className="position-absolute w-100 top-50" style={{ zIndex: -1 }} />
                </div>
                
                <div className="d-flex justify-content-center gap-3 mb-4">
                  <button type="button" className="btn btn-outline-primary rounded-circle p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </button>
                  <button type="button" className="btn btn-outline-danger rounded-circle p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/></svg>
                  </button>
                  <button type="button" className="btn btn-outline-dark rounded-circle p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/></svg>
                  </button>
                </div>
                
                <div className="text-center">
                  <small>Don't have an account? <Link to="/register" className="text-decoration-none">Register here</Link></small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;