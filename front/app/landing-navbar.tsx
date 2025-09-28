"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NavItem {
  title: string;
  href: string;
  blank?: boolean;
}

interface LandingNavbarProps {
  className?: string;
}

const navItems = [
  { title: "Upload", href: "/", blank: false },
  { title: "Feed", href: "/feed", blank: false },
];

export default function LandingNavbar({ className }: LandingNavbarProps) {
  const pathname = usePathname();

  return (
    <header className={cn("bg-white px-4 py-4", className)}>
      <div className="max-w-7xl mx-auto flex items-center">
        {/* left empty third */}
        <div className="w-1/3 flex justify-start">
          <Link href="/" className="no-underline text-inherit">
            <div className="text-right">
              <h1 className="text-3xl">VentanaSocial</h1>
              <p>By: Jose Rendon</p>
            </div>
          </Link>
        </div>

        {/* middle nav */}
        <div className="w-1/3 flex justify-center">
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "no-underline text-gray-700 hover:text-gray-900 transition-colors",
                    isActive ? "font-bold text-gray-900" : "font-medium"
                  )}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* right logo */}
                <div className="w-1/3"></div>

      </div>
    </header>
  );
}
