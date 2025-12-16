// app/test/[testId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function TestGatePage() {
    const router = useRouter();
    const params = useParams<{ testId: string }>();

    const testId = useMemo(() => {
        const v = params?.testId;
        return Array.isArray(v) ? v[0] : v ?? "";
    }, [params]);

    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "ok" | "bad">("idle");
    const [message, setMessage] = useState("");

    async function validate() {
        if (!testId) return;

        setStatus("loading");
        setMessage("");

        const res = await fetch("/api/validate-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testId, code }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            setStatus("ok");
            setMessage("Kod to‘g‘ri. Testga o‘tyapsiz...");
            setTimeout(() => router.push(`/test/${testId}/quiz`), 500);
        } else {
            setStatus("bad");
            setMessage(data?.error ?? "Noto‘g‘ri kod");
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/"
                        className="text-sm font-medium text-blue-600 hover:underline"
                    >
                        ← Orqaga
                    </Link>

                    <div className="text-xs sm:text-sm text-gray-700">
                        Test ID: <span className="font-mono text-black">{testId || "..."}</span>
                    </div>
                </div>

                {/* Card */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 shadow-sm">
                    <h1 className="text-xl sm:text-2xl font-semibold text-black">
                        Kod kiriting
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-700">
                        Testni boshlash uchun maxsus kodni kiriting.
                    </p>

                    <div className="mt-6 space-y-4">
                        <label className="block text-sm font-medium text-black">
                            Kod
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Masalan: 123456"
                                inputMode="numeric"
                                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <button
                            onClick={validate}
                            disabled={!testId || status === "loading" || !code.trim()}
                            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-base font-medium text-white transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
                        >
                            {status === "loading" ? "Tekshirilmoqda..." : "Tekshirish"}
                        </button>

                        {/* Message */}
                        {message && (
                            <div
                                className={`rounded-xl border p-4 text-sm sm:text-base ${
                                    status === "bad"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-green-200 bg-green-50 text-green-700"
                                }`}
                            >
                                {message}

                                {status === "bad" && (
                                    <div className="mt-3">
                                        <a
                                            href="https://t.me/husan_davronov"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                                        >
                                            Admin bilan bog‘lanish →
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-6 text-xs sm:text-sm text-gray-600">
                    ⏱️ Kod har <span className="font-medium text-black">15 daqiqada</span>{" "}
                    yangilanadi.
                </div>
            </div>
        </main>
    );
}
