'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CONFIG } from '@/config/constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Block if admin is disabled
  useEffect(() => {
    if (CONFIG.DISABLE_ADMIN) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Admin code is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/admin/login', { code });
      
      if (response.data.success) {
        // Set localStorage flag (TEMPORARY MVP solution)
        localStorage.setItem('admin_authenticated', 'true');
        console.log('✅ Admin session started (localStorage)');
        
        // Redirect to dashboard
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid admin code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Admin Login
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Enter your admin code to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Admin Code
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter admin code"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            🔒 Admin access only. Unauthorized access is logged.
          </p>
        </form>
      </div>
    </div>
  );
}

