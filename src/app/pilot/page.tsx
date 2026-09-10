"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlatformTopBar } from "@/components/layout/PlatformTopBar";
import { useBrowserStorage } from "@/lib/browser-storage";
import {
  PILOT_STEPS,
  PILOT_RESULT_ROWS,
  PILOT_STORAGE_KEY,
  DEFAULT_PILOT_STATE,
  buildResultsMarkdown,
  isItemChecked,
  isStepComplete,
  isStepUnlocked,
  parsePilotState,
  type PilotResultStatus,
  type PilotState,
  type PilotStep,
} from "@/lib/pilot/checklist";

const SA_TOKEN_KEY = "barberq_pilot_sa_token";

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min > 0) return `${min}m ${rem}s`;
  return `${sec}s`;
}

function StepCard({
  step,
  stepIndex,
  state,
  unlocked,
  onToggleItem,
  onStepResult,
}: {
  step: PilotStep;
  stepIndex: number;
  state: PilotState;
  unlocked: boolean;
  onToggleItem: (itemId: string) => void;
  onStepResult: (stepId: string, field: "status" | "time" | "notes", value: string) => void;
}) {
  const complete = isStepComplete(step, state);
  const result = state.stepResults[step.id] ?? { status: "pending", time: "", notes: "" };

  return (
    <section
      className={`rounded-xl border p-4 ${
        unlocked ? "border-zinc-700 bg-zinc-900/50" : "border-zinc-800 bg-zinc-950 opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-amber-400">{step.title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{step.instruction}</p>
        </div>
        {complete ? (
          <span className="shrink-0 rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">
            ครบ
          </span>
        ) : unlocked ? (
          <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            {step.items.filter((i) => isItemChecked(state, i.id)).length}/{step.items.length}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600">
            ล็อก
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {step.items.map((item) => {
          const checked = isItemChecked(state, item.id);
          return (
            <li key={item.id}>
              <label
                className={`flex items-start gap-3 text-sm ${
                  unlocked ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!unlocked}
                  onChange={() => onToggleItem(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
                />
                <span className={checked ? "text-zinc-200" : "text-zinc-400"}>{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {unlocked && step.resultRow ? (
        <div className="mt-4 grid gap-2 border-t border-zinc-800 pt-3 sm:grid-cols-3">
          <select
            value={result.status}
            onChange={(e) =>
              onStepResult(step.id, "status", e.target.value as PilotResultStatus)
            }
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="pending">-</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <input
            type="text"
            placeholder="เวลา"
            value={result.time}
            onChange={(e) => onStepResult(step.id, "time", e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="ปัญหา"
            value={result.notes}
            onChange={(e) => onStepResult(step.id, "notes", e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm sm:col-span-1"
          />
        </div>
      ) : null}

      {step.id === "create-shop" && unlocked ? (
        <p className="mt-2 text-xs text-zinc-500">Step {stepIndex + 1} — เริ่มจับเวลาจากปุ่มด้านบน</p>
      ) : null}
    </section>
  );
}

export default function PilotPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [saToken, setSaToken] = useBrowserStorage(SA_TOKEN_KEY);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [rawState, setRawState] = useBrowserStorage(PILOT_STORAGE_KEY);
  const [state, setState] = useState<PilotState>(DEFAULT_PILOT_STATE);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState("");
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    setState(parsePilotState(rawState));
  }, [rawState]);

  const persist = useCallback(
    (next: PilotState) => {
      setState(next);
      setRawState(JSON.stringify(next));
    },
    [setRawState],
  );

  const verifyToken = useCallback(async (token: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/superadmin/shops", {
        headers: { "x-superadmin-token": token },
      });
      if (!res.ok) throw new Error("Invalid token");
      setSaToken(token);
      setAuthenticated(true);
    } catch {
      setAuthError("Token ไม่ถูกต้อง");
      setAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, [setSaToken]);

  useEffect(() => {
    if (saToken) void verifyToken(saToken);
  }, [saToken, verifyToken]);

  useEffect(() => {
    if (!timerRunning || !timerStart) return;
    const id = window.setInterval(() => {
      setElapsed(formatElapsed(Date.now() - timerStart));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerStart]);

  const toggleItem = useCallback(
    (itemId: string) => {
      const checked = state.checkedIds.includes(itemId);
      const checkedIds = checked
        ? state.checkedIds.filter((id) => id !== itemId)
        : [...state.checkedIds, itemId];
      persist({ ...state, checkedIds });
    },
    [state, persist],
  );

  const setStepResult = useCallback(
    (stepId: string, field: "status" | "time" | "notes", value: string) => {
      const current = state.stepResults[stepId] ?? {
        status: "pending" as PilotResultStatus,
        time: "",
        notes: "",
      };
      persist({
        ...state,
        stepResults: {
          ...state.stepResults,
          [stepId]: { ...current, [field]: value },
        },
      });
    },
    [state, persist],
  );

  const startTimer = useCallback(() => {
    const now = Date.now();
    setTimerStart(now);
    setTimerRunning(true);
    setElapsed("0s");
    persist({
      ...state,
      metrics: { ...state.metrics, shopCreatedAt: new Date(now).toISOString() },
    });
  }, [state, persist]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerStart) {
      const time = formatElapsed(Date.now() - timerStart);
      persist({
        ...state,
        metrics: { ...state.metrics, ownerInviteToReady: time },
      });
    }
  }, [state, persist, timerStart]);

  const setMetric = useCallback(
    (key: "ownerInviteToReady" | "firstBooking" | "returningBooking", value: string) => {
      persist({
        ...state,
        metrics: { ...state.metrics, [key]: value },
      });
    },
    [state, persist],
  );

  const setGoNoGo = useCallback(
    (value: PilotResultStatus) => {
      persist({ ...state, goNoGo: value });
    },
    [state, persist],
  );

  const resetAll = useCallback(() => {
    if (!window.confirm("ล้าง checklist ทั้งหมด?")) return;
    persist(DEFAULT_PILOT_STATE);
    setTimerRunning(false);
    setTimerStart(null);
    setElapsed("");
  }, [persist]);

  const copyResults = useCallback(async () => {
    const md = buildResultsMarkdown(state);
    try {
      await navigator.clipboard.writeText(md);
      setCopyMsg("คัดลอกแล้ว");
      window.setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg("คัดลอกไม่สำเร็จ");
    }
  }, [state]);

  const completedSteps = useMemo(
    () => PILOT_STEPS.filter((s) => isStepComplete(s, state)).length,
    [state],
  );

  if (!authenticated) {
    return (
      <>
        <PlatformTopBar />
        <section className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">Production Pilot Test</h1>
        <p className="max-w-sm text-center text-sm text-zinc-400">
          ใช้ Super Admin token เพื่อเข้าหน้า checklist
        </p>
        <input
          type="password"
          placeholder="Super Admin Token"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none"
        />
        {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
        <button
          type="button"
          onClick={() => void verifyToken(tokenInput)}
          disabled={authLoading || !tokenInput}
          className="min-h-12 w-full max-w-sm rounded-xl bg-amber-500 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {authLoading ? "Loading..." : "เข้าสู่ระบบ"}
        </button>
        <Link href="/superadmin" className="text-sm text-zinc-500 underline">
          กลับ Super Admin
        </Link>
      </section>
      </>
    );
  }

  return (
    <>
      <PlatformTopBar />
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 pb-16">
      <header className="sticky top-0 z-10 -mx-4 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">Production Pilot Test</h1>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {completedSteps}/{PILOT_STEPS.length} steps
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/superadmin"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
          >
            Super Admin
          </Link>
          <button
            type="button"
            onClick={startTimer}
            disabled={timerRunning}
            className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 disabled:opacity-50"
          >
            เริ่มจับเวลา (สร้างร้าน)
          </button>
          {timerRunning ? (
            <button
              type="button"
              onClick={stopTimer}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
            >
              หยุด ({elapsed})
            </button>
          ) : elapsed ? (
            <span className="self-center text-xs text-zinc-500">{elapsed}</span>
          ) : null}
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400"
          >
            เริ่มใหม่
          </button>
        </div>
      </header>

      <p className="text-sm text-zinc-400">
        ติ๊กทีละข้อตามลำดับ — ต้องครบทุกข้อใน step ปัจจุบันก่อนเปิด step ถัดไป
      </p>

      <div className="flex flex-col gap-4">
        {PILOT_STEPS.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            stepIndex={index}
            state={state}
            unlocked={isStepUnlocked(index, state)}
            onToggleItem={toggleItem}
            onStepResult={setStepResult}
          />
        ))}
      </div>

      <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
        <h2 className="text-base font-semibold text-amber-400">19) จับเวลา 3 ตัว</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-zinc-500">Owner → Ready (≤15 นาที)</span>
            <input
              type="text"
              value={state.metrics.ownerInviteToReady}
              onChange={(e) => setMetric("ownerInviteToReady", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-500">First booking (≤60 วินาที)</span>
            <input
              type="text"
              value={state.metrics.firstBooking}
              onChange={(e) => setMetric("firstBooking", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-zinc-500">Returning (≤30 วินาที)</span>
            <input
              type="text"
              value={state.metrics.returningBooking}
              onChange={(e) => setMetric("returningBooking", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-amber-400">สรุปผล</h2>
          <button
            type="button"
            onClick={() => void copyResults()}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950"
          >
            คัดลอกผล
          </button>
        </div>
        {copyMsg ? <p className="mt-1 text-xs text-emerald-400">{copyMsg}</p> : null}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="py-2 pr-2">Step</th>
                <th className="py-2 pr-2">Pass/Fail</th>
                <th className="py-2 pr-2">เวลา</th>
                <th className="py-2">ปัญหา</th>
              </tr>
            </thead>
            <tbody>
              {PILOT_RESULT_ROWS.map((row) => {
                const step = PILOT_STEPS.find((s) => s.resultRow === row);
                const result = step ? state.stepResults[step.id] : undefined;
                const status = result?.status ?? "pending";
                const label =
                  status === "pass" ? "Pass" : status === "fail" ? "Fail" : "-";
                return (
                  <tr key={row} className="border-b border-zinc-800/50">
                    <td className="py-2 pr-2 text-zinc-300">{row}</td>
                    <td
                      className={`py-2 pr-2 ${
                        status === "pass"
                          ? "text-emerald-400"
                          : status === "fail"
                            ? "text-red-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {label}
                    </td>
                    <td className="py-2 pr-2 text-zinc-400">{result?.time ?? ""}</td>
                    <td className="py-2 text-zinc-400">{result?.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-zinc-400">GO / NO-GO:</span>
          <select
            value={state.goNoGo}
            onChange={(e) => setGoNoGo(e.target.value as PilotResultStatus)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          >
            <option value="pending">-</option>
            <option value="pass">GO</option>
            <option value="fail">NO-GO</option>
          </select>
        </div>
      </section>
    </div>
    </>
  );
}
