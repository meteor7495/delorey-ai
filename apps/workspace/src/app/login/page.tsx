'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, setToken } from '@/shared/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('demo@delorey.local');
  const [password, setPassword] = useState('demo1234');
  const [workspaceName, setWorkspaceName] = useState('فروشگاه من');
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: '#080B12',
        backgroundImage:
          'radial-gradient(900px 600px at 40% -10%, rgba(15,110,110,0.22) 0%, transparent 60%)',
      }}
    >
      <div className="w-full max-w-[400px] space-y-8 fade-up">
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[14px]"
            style={{
              background: 'linear-gradient(145deg, #2A8A8A, #0f6e6e)',
              boxShadow:
                '0 8px 24px rgba(15,110,110,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <Sparkles size={22} color="#fff" />
          </div>
          <div className="text-center">
            <h1 className="text-[24px] font-extrabold tracking-tight text-white">
              DeloRey
            </h1>
            <p className="mt-1 text-[13px] text-[rgba(148,163,184,0.7)]">
              کارمند فروش هوش مصنوعی برای فروشگاه شما
            </p>
          </div>
        </div>

        <div
          className="p-7 rounded-[var(--r-lg)] backdrop-blur-xl"
          style={{
            background: 'rgba(15,20,30,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-white">
              {mode === 'login' ? 'خوش آمدید' : 'ساخت حساب'}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">
              {mode === 'login'
                ? 'برای ادامه وارد فضای کاری شوید'
                : 'فضای کاری جدید بسازید'}
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-semibold text-[#94A3B8]"
              >
                ایمیل
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 rounded-[var(--r-sm)] border-[rgba(255,255,255,0.1)] text-white"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-[13px] font-semibold text-[#94A3B8]"
              >
                رمز عبور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  className="h-10 rounded-[var(--r-sm)] border-[rgba(255,255,255,0.1)] text-white pe-10"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-1 top-1/2 -translate-y-1/2 text-[#475569] hover:bg-transparent"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="workspace"
                  className="text-[13px] font-semibold text-[#94A3B8]"
                >
                  نام فضای کاری
                </Label>
                <Input
                  id="workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  className="h-10 rounded-[var(--r-sm)] border-[rgba(255,255,255,0.1)] text-white"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            )}

            {error && (
              <p className="text-[12px] text-[var(--danger)]">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-[42px] rounded-[var(--r-sm)] text-sm font-bold mt-1 shadow-[0_4px_14px_rgba(15,110,110,0.4)]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                'ورود'
              ) : (
                'ثبت‌نام'
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#64748B]">
            {mode === 'login' ? 'حساب ندارید؟' : 'حساب دارید؟'}{' '}
            <button
              type="button"
              className="font-semibold text-[var(--brand-400)] bg-transparent border-none cursor-pointer"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'ثبت‌نام' : 'ورود'}
            </button>
          </p>
        </div>

        <p className="text-center text-[12px] text-[#334155]">
          دمو: demo@delorey.local / demo1234
        </p>
      </div>
    </div>
  );
}
