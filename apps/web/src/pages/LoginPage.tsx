import LoginForm from "../components/LoginForm";

type LoginPageProps = {
  onCreateAccount: () => void;
  onForgotPassword: () => void;
};

export default function LoginPage({
  onCreateAccount,
  onForgotPassword,
}: LoginPageProps) {
  return (
    <main className="page-container">
      <div className="auth-card">

        <div className="text-center mb-8">
          <h1 className="brand-title">
            UCF Study Buddy
          </h1>

          <p className="text-slate-500 mt-2">
            Find your perfect study partner.
          </p>
        </div>

        <LoginForm onForgotPassword={onForgotPassword} />

        <div className="text-center mt-8 text-sm text-slate-600">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onCreateAccount}
            className="text-link"
          >
            Create Account
          </button>
        </div>

      </div>
    </main>
  );
}