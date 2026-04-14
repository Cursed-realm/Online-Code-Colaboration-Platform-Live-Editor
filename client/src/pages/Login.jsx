import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  React.useEffect(() => {
    // Handle GitHub OAuth callback - extract token from URL
    const token = searchParams.get('token');
    const authenticated = searchParams.get('authenticated');
    
    if (token && authenticated) {
      // Store token in localStorage for API requests
      localStorage.setItem('token', token);
      // Clear URL params and redirect to dashboard
      window.history.replaceState({}, document.title, '/login');
      // Redirect after token is set
      setTimeout(() => {
        navigate('/dashboard');
      }, 50);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    try {
      const serverUrl = process.env.REACT_APP_API_URL || window.location.origin;
      // Redirect to backend GitHub login endpoint which will handle the OAuth flow
      window.location.href = `${serverUrl.replace('/api', '')}/api/auth/github`;
    } catch (err) {
      setError('Failed to initiate GitHub login');
      console.error('GitHub login error:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Login to your Nexus account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="aditya@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button 
          type="button"
          className="btn btn-outline btn-block"
          onClick={handleGitHubLogin}
        >
          <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" />
          Login with GitHub
        </button>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
