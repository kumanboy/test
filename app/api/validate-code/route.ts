import { NextResponse } from "next/server";
import crypto from "crypto";
import { kvGetCode } from "@/lib/kv";

type Body = { testId: string; code: string };

type LockRecord = {
    attempts: number;
    lockedUntil: number;
};

const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? "3");
const LOCK_MINUTES = Number(process.env.LOCK_TIME_MINUTES ?? "15");
const CODE_SECRET = process.env.CODE_SECRET ?? "";

function getLockStore(): Map<string, LockRecord> {
    const g = globalThis as unknown as { __lockStore?: Map<string, LockRecord> };
    if (!g.__lockStore) g.__lockStore = new Map<string, LockRecord>();
    return g.__lockStore;
}

function getWindowId(nowMs: number) {
    return Math.floor(nowMs / (15 * 60 * 1000));
}

function codeForWindow(testId: string, windowId: number) {
    const hash = crypto
        .createHash("sha256")
        .update(`${CODE_SECRET}::${testId}::${windowId}`)
        .digest("hex");

    const num = parseInt(hash.slice(0, 8), 16) % 1_000_000;
    return String(num).padStart(6, "0");
}

export async function POST(req: Request) {
    if (!CODE_SECRET) {
        return NextResponse.json(
            { error: "Server misconfigured: CODE_SECRET missing" },
            { status: 500 }
        );
    }

    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown-ip";

    const body = (await req.json()) as Body;
    const testId = String(body?.testId ?? "").trim();
    const input = String(body?.code ?? "").trim();

    if (!testId || !input) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // ---- LOCK CHECK ----
    const store = getLockStore();
    const key = `${ip}::${testId}`;
    const record = store.get(key) ?? { attempts: 0, lockedUntil: 0 };
    const now = Date.now();

    if (record.lockedUntil > now) {
        const seconds = Math.ceil((record.lockedUntil - now) / 1000);
        return NextResponse.json(
            { error: `Blok: ${seconds}s. 15 daqiqadan keyin urinib ko‘ring.` },
            { status: 429 }
        );
    }

    // ---- 1) BOT CODE (Upstash) ----
    // If bot has generated a code for this testId, it has priority.
    // If Upstash isn't configured yet, we safely ignore errors.
    const botCode = await kvGetCode(testId).catch(() => null);

    if (botCode) {
        if (input === botCode) {
            store.set(key, { attempts: 0, lockedUntil: 0 });
            return NextResponse.json({ ok: true, mode: "bot" });
        }
        // If botCode exists but user typed wrong, continue to "wrong" flow (lock applies).
        // (We do NOT fallback to hash when botCode exists, to prevent bypassing your bot code.)
    } else {
        // ---- 2) FALLBACK ROTATING CODE ----
        const windowId = getWindowId(now);
        const validNow = codeForWindow(testId, windowId);
        const validPrev = codeForWindow(testId, windowId - 1);

        if (input === validNow || input === validPrev) {
            store.set(key, { attempts: 0, lockedUntil: 0 });
            return NextResponse.json({ ok: true, mode: "fallback" });
        }
    }

    // ---- WRONG CODE -> UPDATE ATTEMPTS ----
    const attempts = record.attempts + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCK_MINUTES * 60 * 1000 : 0;

    store.set(key, { attempts, lockedUntil });

    if (lockedUntil) {
        return NextResponse.json(
            { error: `3 marta xato. ${LOCK_MINUTES} daqiqaga bloklandingiz.` },
            { status: 429 }
        );
    }

    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
