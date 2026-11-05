import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2';

  // Returns an error message, or '' if everything is valid
  function validate(): string {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      return 'Please fill in all fields.';
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();               // stop the page from reloading

    const message = validate();
    setError(message);
    if (message) return;              // invalid: stop here, error is shown

    // Valid! In the next step we'll send this to the (mock) API.
    console.log('Ready to register:', { firstName, lastName, email });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Create account</h1>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <input className={inputClass} placeholder="First name"
            value={firstName} onChange={(e) => setFirstName(e.target.value)} />

          <input className={inputClass} placeholder="Last name"
            value={lastName} onChange={(e) => setLastName(e.target.value)} />

          <input className={inputClass} type="email" placeholder="UCF email"
            value={email} onChange={(e) => setEmail(e.target.value)} />

          <input className={inputClass} type="password" placeholder="Password (min 8 characters)"
            value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit"
            className="w-full rounded-md bg-blue-600 py-2 font-semibold text-white">
            Create account
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}