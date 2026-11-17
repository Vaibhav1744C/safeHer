import { useState } from 'react';
import { Shield, Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import api from '../api';

export default function Auth({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const payload = tab === 'login' ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to server.'
          : 'Invalid credentials. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      background: '#fff',
    }}>

      {/* Brand mark */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        background: 'var(--rose-600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        boxShadow: '0 4px 16px rgba(216,27,96,.25)',
      }}>
        <Shield size={26} color="#fff" strokeWidth={2.5} />
      </div>

      {/* Title only — no subtitle */}
      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        marginBottom: 28,
      }}>
        SafeHer
      </h1>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#fff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 20,
        padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(50,21,37,.08)',
      }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--neutral-50)',
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
          gap: 2,
        }}>
          {['login', 'register'].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t ? '0 1px 4px rgba(50,21,37,.08)' : 'none',
              }}
            >
              {t === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate>
          {tab === 'register' && (
            <div className="input-group">
              <label className="input-label" htmlFor="auth-name">Full name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input id="auth-name" className="input" style={{ paddingLeft: 38 }} type="text" placeholder="Jane Sharma" value={form.name} onChange={(e) => set('name', e.target.value)} required autoComplete="name" />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="auth-email">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input id="auth-email" className="input" style={{ paddingLeft: 38 }} type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} required autoComplete={tab === 'login' ? 'username' : 'email'} />
            </div>
          </div>

          {tab === 'register' && (
            <div className="input-group">
              <label className="input-label" htmlFor="auth-phone">Phone number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input id="auth-phone" className="input" style={{ paddingLeft: 38 }} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} required autoComplete="tel" />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} strokeWidth={2} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input id="auth-password" className="input" style={{ paddingLeft: 38 }} type="password" placeholder="••••••••" value={form.password} onChange={(e) => set('password', e.target.value)} required autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            </div>
          </div>

          {error && (
            <div className="msg msg-error" style={{ marginBottom: 8 }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Please wait…</>
              : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
