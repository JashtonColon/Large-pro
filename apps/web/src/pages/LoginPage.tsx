import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, ApiError } from '../lib/authApi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');

    setLoading(true);
    try {
      const result = await login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);              // e.g. "Invalid email or password"
      } else {
        setError('Could not reach the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Log in</h1>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <input className={inputClass} type="email" placeholder="UCF email"
            value={email} onChange={(e) => setEmail(e.target.value)} />

          <input className={inputClass} type="password" placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white disabled:opacity-60">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="text-blue-600 underline">Register</Link>
        </p>
      </div>
    </main>
  );
}