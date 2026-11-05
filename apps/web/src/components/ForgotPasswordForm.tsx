import { useState, type FormEvent } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("If an account exists for this email, a reset link will be sent.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-slate-600 mb-6">
        Enter your UCF email address and we'll send you instructions
        to reset your password.
      </p>

      {/* Email */}
      <div className="mb-6">
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

      {/* Submit Button */}
      <button
        type="submit"
        className="primary-button"
      >
        Send Reset Instructions
      </button>

      {/* Message */}
      {message && (
        <p className="text-center text-sm text-indigo-600 mt-4">
          {message}
        </p>
      )}
    </form>
  );
}