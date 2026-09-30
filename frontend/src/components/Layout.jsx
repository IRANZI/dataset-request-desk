import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
    roles: ["client", "operator", "admin"],
  },
  {
    name: "Requests",
    path: "/requests",
    roles: ["client", "operator", "admin"],
  },
  {
    name: "Episodes",
    path: "/episodes",
    roles: ["operator", "admin"],
  },
  {
    name: "Analytics",
    path: "/analytics",
    roles: ["operator", "admin"],
  },
  {
    name: "Users",
    path: "/users",
    roles: ["admin"],
  },
];

function NavIcon({ name }) {
  const icons = {
    Dashboard: "⌂",
    Requests: "▣",
    Episodes: "◈",
    Analytics: "▥",
    Users: "♙",
  };

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm">
      {icons[name]}
    </span>
  );
}

export default function Layout({ user, children, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  onLogout?.();

  navigate("/");
};

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b border-slate-100 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                DR
              </div>

              <div>
                <h1 className="font-bold text-slate-900">
                  Dataset Desk
                </h1>
                <p className="text-xs text-slate-400">
                  Request management
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            {visibleNavigation.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <NavIcon name={item.name} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="mb-3 rounded-xl bg-slate-50 p-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.name}
              </p>
              <p className="mt-1 text-xs capitalize text-slate-500">
                {user?.role}
              </p>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 lg:hidden"
          >
            Menu
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">
              Dataset Request Desk
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {user?.role}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}