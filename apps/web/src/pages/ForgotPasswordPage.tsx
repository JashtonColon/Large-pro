import ForgotPasswordForm from "../components/ForgotPasswordForm";

type ForgotPasswordPageProps = {
  onBackToLogin: () => void;
};

export default function ForgotPasswordPage({
  onBackToLogin,
}: ForgotPasswordPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="auth-card">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="brand-title">
            UCF Study Buddy
          </h1>

          <p className="text-slate-500 mt-2">
            Find your perfect study partner.
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Forgot Password?
        </h2>

        {/* Forgot Password Form */}
        <ForgotPasswordForm />

        {/* Back to Login */}
        <div className="text-center mt-8 text-sm text-slate-600">
          Remember your password?{" "}
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