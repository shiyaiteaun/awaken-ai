import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa'; // FaCheckCircle မလိုတော့ပါ

function Registration() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  // const [verificationCode, setVerificationCode] = useState(''); // ဖယ်ရှားပါ
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const [verificationSent, setVerificationSent] = useState(false); // ဖယ်ရှားပါ
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Verification code logic ဖယ်ရှားပါ
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  // Email validation ကို ယေဘုယျ ပြောင်းပါ (သို့မဟုတ် ဖယ်ရှားပါ)
  const validateEmail = (email) => {
    // return email.toLowerCase().endsWith('@gmail.com'); // Gmail check ဖယ်ရှားပါ
    return /^\S+@\S+\.\S+$/.test(email); // Basic email format check
  };

  // Function ကို handleRegister လို့ ပြောင်းပြီး Verification logic ဖယ်ရှားပါ
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Frontend Validation
    if (!validateEmail(formData.email)) {
      setError('Please use a valid email address.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // API Call ကို /api/auth/register သို့ ပြောင်းပါ
      const response = await fetch('http://localhost:5000/api/auth/register', { // URL ပြောင်းပါ
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // Check if response is ok (status in the range 200-299)
      if (!response.ok) {
        // If not OK, try to get the response body as text, as it might be HTML
        const errorText = await response.text();
        console.error("Server responded with an error:", response.status, errorText);
        // Try to parse as JSON if possible for a structured error message, otherwise use the text
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = JSON.parse(errorText); // Try to parse if it was intended JSON but failed status
            errorMessage = errorData.message || errorText;
        } catch (e) {
            // If parsing errorText as JSON fails, it's likely HTML or plain text
            errorMessage = errorText.substring(0, 200) + "..."; // Show a snippet
        }
        throw new Error(errorMessage);
      }

      const data = await response.json(); // Now, this should only be called if response.ok is true

      console.log('Registration successful.');
      setSuccessMessage(data.message || 'Registration successful! Redirecting to login...');
      // Verification step မလိုတော့တဲ့အတွက် တန်းပြီး login page ပို့ပါ
      setTimeout(() => navigate('/login'), 2000); // Delay redirect

    } catch (err) {
      console.error("Registration Failed:", err);
      // Display the error message from the Error object
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // handleVerifyCode function တစ်ခုလုံးကို ဖယ်ရှားပါ
  // const handleVerifyCode = async (e) => { ... };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                {/* Title ကို ပြောင်းပါ */}
                <h2 className="fw-bold mb-3">Create Account</h2>
                {/* Description ကို ပြောင်းပါ */}
                <p className="text-muted">
                  Enter your email and password to register.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success">
                  {successMessage}
                </div>
              )}

              {/* Verification form logic ကို ဖယ်ရှားပြီး register form တစ်ခုတည်းထားပါ */}
              <form onSubmit={handleRegister}> {/* onSubmit ကို handleRegister သို့ ပြောင်းပါ */}
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="mb-3 position-relative">
                  <label htmlFor="passwordInput" className="form-label">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="passwordInput"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    disabled={loading}
                    placeholder="******"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ cursor: 'pointer', zIndex: 100 }} // Ensure icon is clickable
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
                <div className="mb-4 position-relative"> {/* Increased bottom margin */}
                  <label htmlFor="confirmPasswordInput" className="form-label">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control"
                    id="confirmPasswordInput"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                    disabled={loading}
                    placeholder="******"
                  />
                   <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ cursor: 'pointer', zIndex: 100 }} // Ensure icon is clickable
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    <><FaUserPlus className="me-2" /> Register</>
                  )}
                </button>
              </form>

              {/* Verification code form ကို ဖယ်ရှားပါ */}

              <div className="text-center mt-4">
                <p className="text-muted">
                  Already have an account? <Link to="/login">Login here</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registration;