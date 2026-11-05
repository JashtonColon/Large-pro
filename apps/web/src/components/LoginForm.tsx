import { useState, type FormEvent } from "react";

type LoginFormProps = {
  onForgotPassword: () => void;
};

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("Login form submitted! Backend authentication coming soon.");
  }

  return (
    <>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Welcome Knights!
      </h2>

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            UCF Email
          </label>

          <input
            type="email"
            placeholder="yourname@ucf.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* Forgot Password */}
        <div className="text-right mb-6">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-link"
          >
            Forgot Password?
          </button>
        </div>

        {/* Login Button */}
        <button
            type="submit"
            className="w-full bg-[var(--ucf-black)] text-[var(--ucf-gold)] font-bold py-3 rounded-lg hover:bg-[var(--ucf-dark-gold)] hover:text-black transition"
            >
            Log In
        </button>

        {/* Login Message */}
        {message && (
          <p className="text-center text-sm text-indigo-600 mt-4">
            {message}
          </p>
        )}
      </form>
    </>
  );
}