import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
        <button onClick={handleLogout}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">
          Log out
        </button>
      </div>
      <p className="mt-2 text-slate-600">You are logged in as {user?.email}.</p>
    </main>
  );
}