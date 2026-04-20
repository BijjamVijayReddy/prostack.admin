"use client";

export function Footer() {
  return (
    <footer
      className="
        fixed bottom-0 left-20 right-0 z-40
        border-t border-white/10
        bg-[#0B1220]
        px-6 py-3
      "
    >
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        {/* Left */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} ProStack. All rights reserved.
        </p>

        {/* Right */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="cursor-pointer hover:text-white">
            Privacy
          </span>
          <span className="cursor-pointer hover:text-white">
            Terms
          </span>
          <span className="cursor-pointer hover:text-white">
            Support
          </span>
        </div>
      </div>
    </footer>
  );
}
