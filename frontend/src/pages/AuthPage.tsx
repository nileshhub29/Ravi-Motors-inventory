import { useState } from 'react';
import { useAuth } from '../auth';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

export function AuthPage() {
  const { user, login, signup, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Logged in successfully');
      } else {
        await signup(email, password, name);
        toast.success('Account created successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Maruti<span className="accent">Parts</span> Hub</h1>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          Dealer Inventory Management System
        </div>

        {!isLogin && (
          <div className="auth-note">
            <strong>Note:</strong> The first user to register becomes the <strong>Owner</strong>. All subsequent users will be registered as <strong>Staff</strong>.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. rahul@marutidealer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn primary" style={{ width: '100%', padding: '14px', fontSize: 14, marginTop: 12 }} disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>New to the system? <button onClick={() => setIsLogin(false)}>Create an account</button></>
          ) : (
            <>Already have an account? <button onClick={() => setIsLogin(true)}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  );
}
