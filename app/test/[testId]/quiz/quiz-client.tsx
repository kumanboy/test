"use client";

import { useEffect, useMemo, useState } from "react";
import type { TestData } from "@/lib/tests";

type Props = { test: TestData };

type Result = {
    correct: number;
    total: number;
    percent: number;
};

export default function QuizClient({ test }: Props) {
    const total = test.questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [secondsLeft, setSecondsLeft] = useState(test.durationMinutes * 60);
    const [error, setError] = useState("");
    const [result, setResult] = useState<Result | null>(null);

    // ✅ prevent duplicate clicks/submits
    const [isSubmitting, setIsSubmitting] = useState(false); // Jo‘natish lock
    const [isFinalizing, setIsFinalizing] = useState(false); // Davom etish lock (telegram)

    // ✅ User info modal
    const [showUserModal, setShowUserModal] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userError, setUserError] = useState("");

    const question = test.questions[currentIndex];

    // Normalize answerKey once
    const answerKey = useMemo(() => test.answerKey ?? {}, [test.answerKey]);

    // ⏱ TIMER
    useEffect(() => {
        if (secondsLeft <= 0) return;
        const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearInterval(interval);
    }, [secondsLeft]);

    function formatTime(sec: number) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function selectOption(option: string) {
        if (secondsLeft <= 0) return;
        setError("");
        setAnswers((prev) => ({ ...prev, [question.id]: option }));
    }

    // ✅ On Jo‘natish (last question) → open modal (LOCKED to prevent multi-click)
    function handleSubmit() {
        if (isSubmitting) return;

        if (Object.keys(answers).length < total) {
            setError("❗ Iltimos, barcha savollarga javob bering.");
            return;
        }

        setIsSubmitting(true); // 🔒 lock immediately
        setError("");
        setUserError("");
        setShowUserModal(true);
    }

    // ✅ Finalize after user enters Ism/Familiya (LOCKED to prevent duplicate Telegram)
    async function finalizeResult() {
        if (isFinalizing) return;

        if (!firstName.trim() || !lastName.trim()) {
            setUserError("❗ Iltimos, ism va familiyani to‘liq kiriting.");
            return;
        }

        setIsFinalizing(true); // 🔒 lock telegram send
        setUserError("");

        let correct = 0;
        for (const q of test.questions) {
            const user = answers[q.id];
            const correctAns = answerKey[String(q.id)];
            if (user && correctAns && user === correctAns) correct++;
        }

        const percent = Math.round((correct / total) * 100);

        // ✅ send to Telegram (server API)
        try {
            await fetch("/api/submit-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    testId: test.id,
                    testTitle: test.title,
                    firstName,
                    lastName,
                    correct,
                    total,
                    percent,
                }),
            });
        } catch {
            // ignore (we still show result)
        }

        setShowUserModal(false);
        setResult({ correct, total, percent });
    }

    // RESULT SCREEN
    if (result) {
        return (
            <main className="min-h-screen bg-white">
                <div className="mx-auto max-w-3xl px-4 py-10">
                    <div className="rounded-2xl border p-6">
                        <h1 className="text-xl sm:text-2xl font-semibold text-black">
                            ✅ Natija
                        </h1>

                        <div className="mt-2 text-sm text-gray-700">
                            Ism: <span className="font-semibold text-black">{firstName}</span>{" "}
                            | Familiya:{" "}
                            <span className="font-semibold text-black">{lastName}</span>
                        </div>

                        <div className="mt-4 space-y-2 text-black">
                            <div>
                                To‘g‘ri:{" "}
                                <span className="font-semibold">{result.correct}</span> /{" "}
                                {result.total}
                            </div>
                            <div>
                                Foiz: <span className="font-semibold">{result.percent}%</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    // reset all quiz state
                                    setResult(null);
                                    setCurrentIndex(0);
                                    setAnswers({});
                                    setError("");
                                    setUserError("");
                                    setShowUserModal(false);
                                    setSecondsLeft(test.durationMinutes * 60);

                                    // reset user info (optional)
                                    setFirstName("");
                                    setLastName("");

                                    // reset locks
                                    setIsSubmitting(false);
                                    setIsFinalizing(false);

                                    // go home
                                    window.location.href = "/";
                                }}
                                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Bosh sahifa
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Timer */}
            <div className="sticky top-0 z-50 border-b bg-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                    <div className="text-sm font-medium text-black">{test.title}</div>

                    <div
                        className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                            secondsLeft <= 60
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-700"
                        }`}
                    >
                        ⏱ {formatTime(secondsLeft)}
                    </div>
                </div>
            </div>

            {/* ✅ User Info Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        // prevent closing while sending (optional safety)
                        onClick={() => {
                            if (!isFinalizing) setShowUserModal(false);
                        }}
                    />
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-black">Ma’lumot kiriting</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Natijani ko‘rsatish uchun ism va familiya kerak.
                        </p>

                        <div className="mt-4 space-y-3">
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ism"
                                className="w-full rounded-xl border px-4 py-3 text-black outline-none"
                            />
                            <input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Familiya"
                                className="w-full rounded-xl border px-4 py-3 text-black outline-none"
                            />

                            {userError && (
                                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-600">
                                    {userError}
                                </div>
                            )}

                            <div className="mt-2 flex gap-2">
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    disabled={isFinalizing}
                                    className={`w-1/2 rounded-xl border px-4 py-3 text-sm text-black ${
                                        isFinalizing ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                >
                                    Bekor qilish
                                </button>

                                <button
                                    onClick={finalizeResult}
                                    disabled={isFinalizing}
                                    className={`w-1/2 rounded-xl px-4 py-3 text-sm font-medium text-white ${
                                        isFinalizing
                                            ? "bg-blue-300 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    {isFinalizing ? "Yuborilmoqda..." : "Davom etish"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="mx-auto max-w-3xl px-4 py-6">
                <p className="text-sm text-gray-600">
                    Savol {currentIndex + 1} / {total}
                </p>

                <div className="mt-4 rounded-2xl border p-5">
                    <div className="text-base font-medium text-black">{question.prompt}</div>

                    <div className="mt-4 space-y-3">
                        {(["A", "B", "C", "D"] as const).map((key) => {
                            const selected = answers[question.id] === key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => selectOption(key)}
                                    disabled={secondsLeft <= 0}
                                    className={`w-full rounded-xl border px-4 py-3 text-left transition
                    ${
                                        selected
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-300 hover:bg-gray-50"
                                    }
                    ${secondsLeft <= 0 ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                                >
                                    <span className="mr-2 font-semibold">{key})</span>
                                    {question.options[key]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Navigation + Submit (exam style) */}
                <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => i - 1)}
                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                    >
                        ← Oldingi
                    </button>

                    {currentIndex === total - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`rounded-lg px-5 py-2 text-sm font-medium text-white active:scale-[0.98]
                ${
                                isSubmitting
                                    ? "bg-blue-300 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSubmitting ? "Yuborilmoqda..." : "Jo‘natish"}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIndex((i) => i + 1)}
                            className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white"
                        >
                            Keyingi →
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
