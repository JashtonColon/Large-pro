import EmailVerificationForm from "../components/EmailVerificationForm";

type EmailVerificationPageProps = {
  email: string;
  onBackToLogin: () => void;
};

export default function EmailVerificationPage({
  email,
  onBackToLogin,
}: EmailVerificationPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="auth-card">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="brand-title">
            UCF Study Buddy
          </h1>

          <p className="text-slate-500 mt-2">
            Almost there!
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-4">
          Verify Your Email
        </h2>

        <p className="text-sm text-slate-600 mb-6">
          Verification code sent to:
          <br />
          <span className="font-semibold text-indigo-700">
            {email}
          </span>
        </p>

        {/* Verification Form */}
        <EmailVerificationForm />

        {/* Back to Login */}
        <div className="text-center mt-8 text-sm text-slate-600">
          Already verified?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-link"
          >
            Log In
          </button>
        </div>

      </div>
    </main>
  );
}