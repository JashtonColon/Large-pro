export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
      <p className="mt-2 text-slate-600">You are logged in as {user?.email}.</p>
    </main>
  );
}