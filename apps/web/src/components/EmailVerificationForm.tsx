import { useState, type FormEvent } from "react";

export default function EmailVerificationForm() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("Verification submitted! Backend verification coming soon.");
  }

  return (
    <form onSubmit={handleVerification}>
      <p className="text-sm text-slate-600 mb-6">
        We've sent a verification code to your email.
        Enter the code below to verify your account.
      </p>

      {/* Verification Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Verification Code
        </label>

        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter your code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          maxLength={6}
          pattern="[0-9]{6}"
          title="Please enter a 6-digit verification code."
          className="form-input"
        />
      </div>

      {/* Verify Button */}
      <button
        type="submit"
        className="primary-button"
      >
        Verify Email
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