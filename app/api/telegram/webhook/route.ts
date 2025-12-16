import { NextResponse } from "next/server";
import crypto from "crypto";

type TgUpdate = {
    message?: {
        message_id: number;
        text?: string;
        chat: { id: number; type: string };
        from?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
        };
    };
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_ID = Number(process.env.TELEGRAM_ADMIN_USER_ID ?? "0");
const CODE_SECRET = process.env.CODE_SECRET ?? "";

/**
 * 15-minute window id
 */
function getWindowId(nowMs: number) {
    return Math.floor(nowMs / (15 * 60 * 1000));
}

function codeForWindow(testId: string, windowId: number) {
    if (!CODE_SECRET) return "000000";

    const hash = crypto
        .createHash("sha256")
        .update(`${CODE_SECRET}::${testId}::${windowId}`)
        .digest("hex");

    const num = parseInt(hash.slice(0, 8), 16) % 1_000_000;
    return String(num).padStart(6, "0");
}

async function sendMessage(chatId: number, text: string) {
    await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
        }
    );
}

export async function POST(req: Request) {
    try {
        if (!TELEGRAM_BOT_TOKEN) {
            return NextResponse.json({ ok: true });
        }

        const update = (await req.json()) as TgUpdate;

        const msg = update.message;
        const text = msg?.text?.trim() ?? "";
        const chatId = msg?.chat?.id;

        if (!chatId || !text) {
            return NextResponse.json({ ok: true });
        }

        const fromId = msg?.from?.id ?? 0;

        // /status
        if (text.startsWith("/status")) {
            await sendMessage(
                chatId,
                "Foydalanish:\n/code test1\n/code test2\n/whoami"
            );
            return NextResponse.json({ ok: true });
        }

        // /whoami
        if (text.startsWith("/whoami")) {
            await sendMessage(chatId, `Your Telegram user id: ${fromId}`);
            return NextResponse.json({ ok: true });
        }

        // /code testId
        if (text.startsWith("/code")) {
            if (ADMIN_ID && fromId !== ADMIN_ID) {
                await sendMessage(
                    chatId,
                    "❌ Ruxsat yo‘q. Admin bilan bog‘laning."
                );
                return NextResponse.json({ ok: true });
            }

            const parts = text.split(/\s+/);
            const testId = (parts[1] ?? "").trim();

            if (!testId) {
                await sendMessage(chatId, "❗ Format: /code test1");
                return NextResponse.json({ ok: true });
            }

            const windowId = getWindowId(Date.now());
            const code = codeForWindow(testId, windowId);

            await sendMessage(
                chatId,
                `✅ Kod tayyor:\nTest: ${testId}\nKod: ${code}\n\n(15 daqiqada yangilanadi)`
            );

            return NextResponse.json({ ok: true });
        }

        // Default help
        await sendMessage(
            chatId,
            "Foydalanish:\n/status\n/code test1\n/whoami"
        );

        return NextResponse.json({ ok: true });
    } catch {
        // Always return 200 so Telegram doesn't retry
        return NextResponse.json({ ok: true });
    }
}
