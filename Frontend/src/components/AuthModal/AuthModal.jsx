import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onSuccess, initialTab = 'login' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    remember: false
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialTab]);

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(loginForm.email, loginForm.password);
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!registerForm.acceptTerms) {
      setError('Please accept the Terms and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      });
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close authentication dialog">
          <i className="fa fa-times"></i>
        </button>

        <div className="auth-modal__header">
          <div className="auth-modal__tabs">
            <button type="button" className={`auth-modal__tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setError(''); }}>Login</button>
            <button type="button" className={`auth-modal__tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setError(''); }}>Sign Up</button>
          </div>
        </div>

        <div className="auth-modal__content">
          {error && (
            <div className="auth-modal__error">
              <i className="fa fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-modal__form">
              <div className="auth-modal__form-group">
                <label htmlFor="login-email">Email Address</label>
                <input type="email" id="login-email" name="email" value={loginForm.email} onChange={handleLoginChange} placeholder="Enter your email" required disabled={isLoading} />
              </div>

              <div className="auth-modal__form-group">
                <label htmlFor="login-password">Password</label>
                <input type="password" id="login-password" name="password" value={loginForm.password} onChange={handleLoginChange} placeholder="Enter your password" required disabled={isLoading} />
              </div>

              <div className="auth-modal__form-row">
                <label className="auth-modal__checkbox">
                  <input type="checkbox" name="remember" checked={loginForm.remember} onChange={handleLoginChange} disabled={isLoading} />
                  <span>Remember me</span>
                </label>
              </div>

              <button type="submit" className="auth-modal__submit" disabled={isLoading}>
                {isLoading ? <><span className="auth-modal__spinner"></span>Logging in...</> : 'Login'}
              </button>

              <p className="auth-modal__switch">Don't have an account?{' '}<button type="button" onClick={() => setActiveTab('register')}>Sign Up</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-modal__form">
              <div className="auth-modal__form-group"><label htmlFor="register-name">Full Name</label><input type="text" id="register-name" name="name" value={registerForm.name} onChange={handleRegisterChange} placeholder="Enter your full name" required disabled={isLoading} /></div>
              <div className="auth-modal__form-group"><label htmlFor="register-email">Email Address</label><input type="email" id="register-email" name="email" value={registerForm.email} onChange={handleRegisterChange} placeholder="Enter your email" required disabled={isLoading} /></div>
              <div className="auth-modal__form-group"><label htmlFor="register-password">Password</label><input type="password" id="register-password" name="password" value={registerForm.password} onChange={handleRegisterChange} placeholder="Create a password" required minLength={6} disabled={isLoading} /></div>
              <div className="auth-modal__form-group"><label htmlFor="register-confirm">Confirm Password</label><input type="password" id="register-confirm" name="confirmPassword" value={registerForm.confirmPassword} onChange={handleRegisterChange} placeholder="Confirm your password" required disabled={isLoading} /></div>

              <label className="auth-modal__checkbox">
                <input type="checkbox" name="acceptTerms" checked={registerForm.acceptTerms} onChange={handleRegisterChange} disabled={isLoading} />
                <span>I accept the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a></span>
              </label>

              <button type="submit" className="auth-modal__submit" disabled={isLoading}>
                {isLoading ? <><span className="auth-modal__spinner"></span>Creating account...</> : 'Create Account'}
              </button>

              <p className="auth-modal__switch">Already have an account?{' '}<button type="button" onClick={() => setActiveTab('login')}>Login</button></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
