import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create account. Username/Email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header-bar">
        <h1>SENTIO</h1>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-inner-box">
            <div className="auth-logo-icon">
              <Brain size={32} />
            </div>
            <h2>Sign up to SENTIO</h2>

            {error && <div className="auth-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter User name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter Full Name (Optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-footer-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
