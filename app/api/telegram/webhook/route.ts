import { NextResponse } from "next/server";
import crypto from "crypto";
import { kvSetCode } from "@/lib/kv";
import { tgSendMessage } from "@/lib/telegram";

type TgUpdate = {
    message?: {
        text?: string;
        chat: { id: number };
        from?: { id: number };
    };
};

const ADMIN_ID = Number(process.env.TELEGRAM_ADMIN_USER_ID ?? "0");

function make6DigitCode() {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(req: Request) {
    const update = (await req.json()) as TgUpdate;
    const msg = update.message;
    if (!msg?.text) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const fromId = msg.from?.id;

    // Reminder: only YOU can generate codes
    if (!fromId || fromId !== ADMIN_ID) {
        await tgSendMessage(chatId, "⛔️ Sizda ruxsat yo‘q.");
        return NextResponse.json({ ok: true });
    }

    const [cmd, testId] = msg.text.trim().split(/\s+/);

    if (cmd !== "/code" || !testId) {
        await tgSendMessage(
            chatId,
            "Foydalanish:\n/code test1\n/code test2"
        );
        return NextResponse.json({ ok: true });
    }

    const code = make6DigitCode();
    await kvSetCode(testId, code, 15 * 60);

    await tgSendMessage(
        chatId,
        `✅ <b>${testId}</b> uchun yangi kod: <b>${code}</b>\n⏱️ 15 daqiqa amal qiladi`
    );

    return NextResponse.json({ ok: true });
}
