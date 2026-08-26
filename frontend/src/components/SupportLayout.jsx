import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import logo from "../assets/logo.png";

const NAV_ITEMS = [{ to: "/tickets", label: "My Tickets", icon: "confirmation_number" }];

export default function SupportLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <nav className="hidden md:flex flex-col w-[240px] h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-surface-variant py-6 z-20">
        <Link to="/tickets" className="px-4 mb-6 flex items-center gap-3">
          <img src={logo} alt="HelpDeskPro" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-base font-bold text-primary leading-tight">HelpDeskPro</h1>
            <p className="text-[11px] text-on-surface-variant">Support</p>
          </div>
        </Link>
        <div className="px-3 mb-6">
          <Link
            to="/tickets/new"
            className="w-full h-11 rounded-lg bg-primary text-on-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Icon name="add" size="18px" />
            Create Ticket
          </Link>
        </div>
        <div className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "text-primary font-semibold bg-primary/10"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <Icon name={item.icon} fill={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="px-3 mt-auto pt-4 border-t border-surface-variant">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-sm font-semibold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{user?.username}</p>
              <p className="text-[11px] text-on-surface-variant">Support</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <Icon name="logout" />
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest border-b border-surface-variant flex items-center justify-between px-4 z-20">
        <Link to="/tickets" className="flex items-center gap-2">
          <img src={logo} alt="HelpDeskPro" className="h-7 w-7 object-contain" />
          <span className="text-sm font-bold text-primary">HelpDeskPro</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/tickets/new" className="text-primary p-1 -mr-1">
            <Icon name="add" />
          </Link>
          <button type="button" onClick={logout} className="text-sm font-medium text-primary">
            Logout
          </button>
        </div>
      </header>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-container-lowest border-t border-surface-variant flex items-center justify-around z-20">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 text-[11px] ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <Icon name={item.icon} fill={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 md:ml-[240px] mt-14 md:mt-0 mb-14 md:mb-0 p-4 md:p-8">
        <div className="max-w-[1440px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
