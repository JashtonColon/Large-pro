import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Create Account</h1>

        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 underline">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}