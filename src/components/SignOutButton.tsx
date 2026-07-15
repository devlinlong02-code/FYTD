"use client";

import { logout } from "@/app/auth/actions";

export default function SignOutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="settings-sign-out-btn">
        Sign Out
      </button>
    </form>
  );
}
