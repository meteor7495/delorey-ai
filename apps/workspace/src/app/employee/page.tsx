'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function EmployeePage() {
  const [name, setName] = useState('');
  const [tone, setTone] = useState('');
  const [status, setStatus] = useState('active');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getEmployee().then((e) => {
      setName(String(e.name ?? ''));
      setTone(String(e.tone ?? ''));
      setStatus(String(e.status ?? 'active'));
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.updateEmployee({ name, tone, status });
    setSaved(true);
  }

  return (
    <AppShell>
      <h1>کارمند فروش</h1>
      <p className="muted">این تنظیمات در Runtime اعمال می‌شوند — تزئینی نیستند.</p>
      <form className="card" onSubmit={onSubmit}>
        <label>نام</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <label>لحن</label>
        <input className="input" value={tone} onChange={(e) => setTone(e.target.value)} />
        <label>وضعیت</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">فعال</option>
          <option value="paused">متوقف</option>
          <option value="inactive">غیرفعال</option>
        </select>
        <button className="btn" type="submit">
          ذخیره
        </button>
        {saved && <p style={{ color: 'var(--success)' }}>ذخیره شد.</p>}
      </form>
    </AppShell>
  );
}
