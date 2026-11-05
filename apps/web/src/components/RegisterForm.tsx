import { useState, type FormEvent } from "react";

type RegisterFormProps = {
  onRegistrationComplete: (email: string) => void;
};

export default function RegisterForm({onRegistrationComplete,}: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log("Registration button clicked!");
    console.log("Email:", email);

    if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
    }

    onRegistrationComplete(email);
  }

  return (
    <>
      <form onSubmit={handleRegister}>
        {/* Full Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* UCF Email */}
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
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="form-input"
          />
        </div>

        {/* Register Button */}
        <button
          type="submit"
          className="primary-button"
        >
          Create Account
        </button>

        {/* Registration Message */}
        {message && (
          <p className="text-center text-sm text-indigo-600 mt-4">
            {message}
          </p>
        )}
      </form>
    </>
  );
}