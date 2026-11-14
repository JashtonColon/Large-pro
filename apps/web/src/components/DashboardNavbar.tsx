import { NavLink, useNavigate } from "react-router-dom";

export default function DashboardNavbar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className="relative overflow-hidden bg-[#55c9e8] px-5 py-4 sm:px-8">
      {/* Decorative clouds */}
      <div className="absolute -top-8 left-[42%] h-20 w-32 rounded-full bg-white/80 blur-sm" />
      <div className="absolute -top-10 right-[15%] h-24 w-36 rounded-full bg-white/80 blur-sm" />

      <div className="relative z-10 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg border-4 border-[#ffc904] bg-[#f5e7c8] px-4 py-2 text-left shadow-md"
        >
          <div className="font-serif text-2xl font-black tracking-wide text-[#292019] sm:text-3xl">
            KNIGHT
          </div>
          <div className="text-center font-serif text-xs tracking-[0.3em] text-[#292019]">
            STUDY BUDDY
          </div>
        </button>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 rounded-full bg-white/70 px-6 py-3 font-semibold text-[#49351f] shadow-sm md:flex">
          <NavLink to="/quests">
            Home
          </NavLink>

          <NavLink to="/appointments">
            My Quests
          </NavLink>

          <NavLink to="/profile">
            My Profile
          </NavLink>

          

        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Log Out"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#ffc904] text-2xl text-black shadow-md transition hover:scale-105 hover:bg-[#e6b500]"
        >
          ⇥
        </button>
      </div>
    </header>
  );
}