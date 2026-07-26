'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/shared/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('demo@delorey.local');
  const [password, setPassword] = useState('demo1234');
  const [workspaceName, setWorkspaceName] = useState('فروشگاه من');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.signup({ email, password, workspaceName });
      setToken(res.token);
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '10vh auto', padding: 24 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>DeloRey</h1>
        <p className="muted">ورود به فضای کاری — کارمند فروش هوش مصنوعی</p>
        <form onSubmit={onSubmit}>
          <label>ایمیل</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <label>رمز</label>
          <input
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
          />
          {mode === 'signup' && (
            <>
              <label>نام فضای کاری</label>
              <input
                className="input"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </>
          )}
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
          )}
          <div className="row">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'ورود' : 'ثبت‌نام'}
            </button>
            <button
              className="btn secondary"
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'ساخت حساب' : 'حساب دارم'}
            </button>
          </div>
        </form>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          دمو: demo@delorey.local / demo1234
        </p>
      </div>
    </div>
  );
}
