import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IdesLogo } from "./brand/IdesLogo";
import { cn } from "./ui/cn";

const SIDEBAR_WIDTH = "w-60"; // 240px

const navItems = [
  {
    to: "/query",
    label: "Query",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] shrink-0" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/schema",
    label: "Schema Explorer",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] shrink-0" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <ellipse cx="12" cy="5" rx="7" ry="2.5" />
        <path d="M5 5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5" />
        <path d="M5 11v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] shrink-0" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const adminNavItem = {
  to: "/admin",
  label: "Admin",
  icon: (
    <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px] shrink-0" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function SidebarNavItem({ to, label, icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none",
          "border-l-2 -ml-px pl-[calc(0.75rem-1px)]",
          "focus-visible:ring-2 focus-visible:ring-violet-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          isActive
            ? "border-violet-400 bg-indigo-500/20 text-white"
            : "border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
        )
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    logout();
    navigate("/login");
  }

  const closeMobile = () => setMobileOpen(false);
  const displayName = user?.name || user?.email || "Account";
  const isAdmin = user?.role === "admin";
  const initials = (displayName[0] || "?").slice(0, 1).toUpperCase();

  const navLinks = (
    <>
      {navItems.map((item) => (
        <SidebarNavItem key={item.to} {...item} onNavigate={closeMobile} />
      ))}
      {isAdmin ? (
        <SidebarNavItem {...adminNavItem} onNavigate={closeMobile} />
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)]">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full flex-col",
          SIDEBAR_WIDTH,
          "bg-slate-950 border-r border-slate-800/90",
          "transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        id="app-sidebar"
        aria-label="Application"
      >
        <div className="shrink-0 px-4 pt-5 pb-4 border-b border-slate-800/80">
          <Link
            to="/query"
            onClick={closeMobile}
            className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <IdesLogo theme="dark" showWordmark subtitle="Database Explorer" />
          </Link>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main">
          {navLinks}
        </nav>

        <div className="shrink-0 border-t border-slate-800/80 p-3" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                "hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/80",
              )}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/25 text-indigo-100 text-xs font-semibold ring-1 ring-indigo-400/30">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-100 truncate">{displayName}</span>
                {user?.email ? (
                  <span className="block text-[11px] text-slate-500 truncate">{user.email}</span>
                ) : null}
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", menuOpen && "rotate-180")}
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-slate-700/90 bg-slate-900 py-1 shadow-xl shadow-black/40 text-sm z-10"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-medium text-slate-100 truncate">{displayName}</p>
                  {user?.email ? (
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  ) : null}
                </div>
                <Link
                  to="/profile"
                  role="menuitem"
                  className="block px-3 py-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    closeMobile();
                  }}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className={cn("min-h-screen flex flex-col lg:pl-60")}>
        <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/90 bg-white/95 backdrop-blur px-4 shrink-0">
          <button
            type="button"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">IDES</span>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
