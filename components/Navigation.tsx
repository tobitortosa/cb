"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      className={[
        // Posicionamiento
        "fixed inset-x-0 top-0 z-50",
        // Transiciones
        "transition-all",
        // Estados y bordes
        scrolled
          ? ["border-b border-gray-200 dark:border-gray-800", "shadow-sm"].join(
              " "
            )
          : ["border-b border-gray-100 dark:border-gray-800/50"].join(" "),
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <MessageSquare className="h-5 w-5 text-white rounded-sm" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Chatbase
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="#enterprise"
              className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Enterprise
            </Link>
            <button
              className="flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              type="button"
            >
              Resources
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2 md:flex py-2">
            {!loading && isAuthenticated && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="my-2 inline-flex items-center justify-center rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-800 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white px-3"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="my-2 inline-flex items-center justify-center rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                >
                  Try for Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
