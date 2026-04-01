"use client";

import {
  Film,
  User,
  Ticket,
  Menu,
  X,
  Settings,
  UserCircle,
  Lock,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ButtonGray from "@/components/ui/ButtonGray";
import { ButtonRed } from "@/components/ui/ButtonRed";
import { useAuth } from "@/contexts/AuthContext";
import CustomerMovieSearch from "@/components/layout/CustomerMovieSearch";

interface CustomerHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAdminClick: () => void;
}

export function CustomerHeader({ currentPage, onNavigate, onAdminClick }: CustomerHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'now-showing', label: 'Now Showing' },
    { id: 'coming-soon', label: 'Coming Soon' },
    { id: 'showtimes', label: 'Showtimes' },
    { id: 'about', label: 'About' },
  ];

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleSettingsAction = (action: string) => {
    setIsSettingsOpen(false);

    switch (action) {
      case "account":
        router.push("/customer/profile");
        break;
      case "password":
        router.push("/login?callbackUrl=/customer/profile");
        break;
      case "signout":
        logout();
        break;
      default:
        break;
    }
  };

  const handleAuthRoute = (path: string) => {
    const callbackUrl = encodeURIComponent(pathname || "/");
    router.push(`${path}?callbackUrl=${callbackUrl}`);
  };

  useEffect(() => {
    const currentRef = settingsRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavigate('home')}
            className="flex cursor-pointer items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl">CineMax</h1>
              <p className="text-xs text-zinc-500">Premium Cinema</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  currentPage === item.id
                    ? 'text-red-500'
                    : 'text-white hover:text-red-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <CustomerMovieSearch />
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => router.push("/customer/ticket")}
                  className="hidden cursor-pointer md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </button>

                <div ref={settingsRef} className="relative hidden md:block">
                  <button
                    onClick={handleSettingsClick}
                    className={`p-2 hover:bg-zinc-900 cursor-pointer rounded-lg transition-colors ${
                      isSettingsOpen ? "bg-zinc-900" : ""
                    }`}
                    title={user?.name || "Profile"}
                  >
                    <User className="w-5 h-5 text-zinc-400" />
                  </button>

                  {isSettingsOpen ? (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                        <p className="text-sm font-semibold text-white">
                          {user?.name || "Welcome!"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {user?.email || "Manage your account"}
                        </p>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => handleSettingsAction("account")}
                          className="w-full cursor-pointer flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <UserCircle className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                              My Account
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </button>

                        <button
                          onClick={() => handleSettingsAction("password")}
                          className="w-full cursor-pointer flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                              Change Password
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                        </button>

                        <div className="my-2 border-t border-zinc-800"></div>

                        <button
                          onClick={() => handleSettingsAction("signout")}
                          className="w-full cursor-pointer flex items-center justify-between px-4 py-2.5 hover:bg-red-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                            <span className="text-sm text-red-400 group-hover:text-red-300 transition-colors font-medium">
                              Sign Out
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <ButtonGray onClick={() => handleAuthRoute("/login")}>
                  Login
                </ButtonGray>
                <ButtonRed onClick={() => handleAuthRoute("/register")}>
                  Register
                </ButtonRed>
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-zinc-900 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-zinc-800 space-y-3">
            <CustomerMovieSearch mobile />
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`block w-full text-left text-sm font-medium transition-colors py-2 ${
                  currentPage === item.id
                    ? 'text-red-500'
                    : 'text-white hover:text-red-500'
                }`}
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => router.push("/customer/ticket")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium"
              >
                <Ticket className="w-4 h-4" />
                My Tickets
              </button>
            ) : (
              <div className="space-y-3">
                <ButtonGray
                  className="w-full"
                  onClick={() => handleAuthRoute("/login")}
                >
                  Login
                </ButtonGray>
                <ButtonRed
                  className="w-full"
                  onClick={() => handleAuthRoute("/register")}
                >
                  Register
                </ButtonRed>
              </div>
            )}
            <button 
              onClick={onAdminClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg font-medium"
            >
              <Settings className="w-4 h-4" />
              Admin Portal
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
