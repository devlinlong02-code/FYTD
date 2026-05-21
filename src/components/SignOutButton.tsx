"use client";

import { logout } from "@/app/auth/actions";

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}
