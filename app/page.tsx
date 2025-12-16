// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TESTS = [
    { id: "test1", title: "TEST 1 (IMLO)" },
    { id: "test2", title: "TEST 2 (IMLO)" },
];

export default function HomePage() {
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setShowWelcome(false), 3000); //
        return () => clearTimeout(t);
    }, []);

    return (
        <main className="min-h-screen bg-white">
            {/* Welcome modal (5 seconds) */}
            {showWelcome && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* modal */}
                    <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                                <div className="h-3 w-3 rounded-full bg-orange-500" />
                            </div>

                            <div className="text-lg sm:text-xl font-semibold leading-snug text-black">
                                Sardor Toshmuhammadovning
                                <br />
                                Test Ishlash tizimiga xush kelibsiz
                            </div>

                            <p className="mt-3 text-sm sm:text-base text-gray-700">
                                Iltimos, testni tanlang va kod kiriting.
                            </p>

                            <div className="mt-4 text-xs text-gray-500">
                                5 soniyadan so‘ng yopiladi…
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page content */}
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold text-black">
                        Testlar
                    </h1>
                    <p className="text-sm sm:text-base text-gray-700">
                        Testni tanlang, so‘ng kod kiriting.
                    </p>
                </header>

                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                    {TESTS.map((t) => (
                        <Link
                            key={t.id}
                            href={`/test/${t.id}`}
                            className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-sm active:scale-[0.99]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-base sm:text-lg font-medium text-black">
                                        {t.title}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Boshlash uchun bosing
                                    </div>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                                    →
                                </div>
                            </div>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                                Kod har 15 daqiqada yangilanadi
                            </div>
                        </Link>
                    ))}
                </section>
            </div>
        </main>
    );
}
