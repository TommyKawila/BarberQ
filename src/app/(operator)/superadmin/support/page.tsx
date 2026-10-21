"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SupportInbox } from "@/components/superadmin/SupportInbox";
import {
  readOperatorToken,
  writeOperatorToken,
} from "@/lib/superadmin/operator-session";

export default function SuperadminSupportPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const stored = readOperatorToken();
    if (stored) {
      setToken(stored);
      setOk(true);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!ok) {
    return (
      <section className="mx-auto flex max-w-sm flex-col gap-3 px-4 py-16">
        <h1 className="text-xl font-semibold text-zinc-100">Support inbox</h1>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Super Admin Token"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3"
        />
        <button
          type="button"
          onClick={() => {
            writeOperatorToken(token);
            setOk(true);
          }}
          className="min-h-12 rounded-xl bg-amber-400 font-semibold text-zinc-950"
        >
          Login
        </button>
        <Link href="/superadmin" className="text-center text-sm text-zinc-400">
          Back
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-6">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Support inbox</h1>
          <p className="text-sm text-zinc-400">Reply within 24 hours · ClipperQ OA</p>
        </div>
        <Link href="/superadmin" className="text-sm text-amber-400">
          Shops
        </Link>
      </header>
      <SupportInbox token={token} />
    </div>
  );
}
