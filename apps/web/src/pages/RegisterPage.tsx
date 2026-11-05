import RegisterForm from "../components/RegisterForm";

type RegisterPageProps = {
  onLogin: () => void;
  onRegistrationComplete: (email: string) => void;
};

export default function RegisterPage({
  onLogin,
  onRegistrationComplete,
}: RegisterPageProps) {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="auth-card">

        <div className="text-center mb-8">
          <h1 className="brand-title">
            UCF Study Buddy
          </h1>

          <p className="text-slate-500 mt-2">
            Join Study Buddy and find your study partner.
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
          Create Your Account
        </h2>

        <RegisterForm
          onRegistrationComplete={onRegistrationComplete}
        />

        <div className="text-center mt-8 text-sm text-slate-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
            className="text-link"
          >
            Log In
          </button>
        </div>

      </div>
    </main>
  );
}