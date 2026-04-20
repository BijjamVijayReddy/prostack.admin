"use client";

import Image from "next/image";
import { useState } from "react";
import { SIDEBAR_ITEMS } from "./sidebar.config";
import { useLayout } from "./LayoutContext";

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { active, setActive } = useLayout();

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        fixed left-0 top-0 z-50 h-screen
        border-r border-white/10 bg-[#0B1220]
        transition-all duration-300 ease-in-out
        ${expanded ? "w-60" : "w-20"}
      `}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <Image
          src="/proStacklogo.png"
          alt="Prostack logo"
          width={250}
          height={250}
        />

        {/* <span
          className={`
            whitespace-nowrap text-lg font-semibold text-white
            transition-all duration-300
            ${expanded ? "opacity-100" : "opacity-0"}
          `}
        >
          Prostack
        </span> */}
      </div>

      {/* Menu */}
      <nav className="mt-6 flex flex-col gap-2 px-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <div
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`
                group relative flex cursor-pointer items-center gap-4
                rounded-xl px-3 py-3 transition
                ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {/* Icon */}
              <Icon className="h-6 w-6 shrink-0" />

              {/* Label (expanded only) */}
              <span
                className={`
                  whitespace-nowrap text-sm font-medium
                  transition-all duration-300
                  ${expanded ? "opacity-100" : "opacity-0"}
                `}
              >
                {item.label}
              </span>

              {/* Tooltip (collapsed only) */}
              {!expanded && (
                <span
                  className="
                    pointer-events-none absolute left-14 z-50
                    whitespace-nowrap rounded-md bg-black
                    px-2 py-1 text-xs text-white shadow
                    opacity-0 transition-opacity duration-200
                    group-hover:opacity-100
                  "
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
