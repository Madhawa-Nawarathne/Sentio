import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [step, setStep] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameOrEmail || !password) {
      setError('Please enter all fields');
      return;
    }

    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      navigate('/');
    } catch (err) {
      if (err.needsVerification) {
        setPendingEmail(err.email);
        setStep('verify');
        setError('');
      } else {
        setError(err.message || 'Invalid username/email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(pendingEmail, verificationCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resendVerificationCode(pendingEmail);
      setSuccess('A new code was sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
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
            <h2>{step === 'verify' ? 'Verify your email' : 'Sign in to SENTIO'}</h2>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            {step === 'verify' ? (
              <form className="auth-form" onSubmit={handleVerify}>
                <p className="auth-verify-text">
                  Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
                </p>
                <div className="form-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend code
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter User name or Email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
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
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            )}

            <div className="auth-footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
