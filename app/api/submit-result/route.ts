import { NextResponse } from "next/server";

type Body = {
    testId: string;
    testTitle: string;
    firstName: string;
    lastName: string;
    correct: number;
    total: number;
    percent: number;
};

export async function POST(req: Request) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_RESULTS_CHAT_ID = process.env.TELEGRAM_RESULTS_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_RESULTS_CHAT_ID) {
        return NextResponse.json(
            { error: "Server misconfigured: Telegram env missing" },
            { status: 500 }
        );
    }

    const body = (await req.json()) as Body;

    const testId = String(body?.testId ?? "").trim();
    const testTitle = String(body?.testTitle ?? "").trim();
    const firstName = String(body?.firstName ?? "").trim();
    const lastName = String(body?.lastName ?? "").trim();

    const correct = Number(body?.correct ?? 0);
    const total = Number(body?.total ?? 0);
    const percent = Number(body?.percent ?? 0);

    if (!testId || !firstName || !lastName || total <= 0) {
        return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const now = new Date();
    const time = now.toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });

    // ✅ PLAIN TEXT MESSAGE (no Markdown)
    const text =
        `✅ Yangi test natijasi\n\n` +
        `🧪 Test: ${testTitle || testId}\n` +
        `🆔 ID: ${testId}\n\n` +
        `👤 Ism: ${firstName}\n` +
        `👤 Familiya: ${lastName}\n\n` +
        `🎯 Natija: ${correct} / ${total} (${percent}%)\n` +
        `🕒 Vaqt: ${time}`;

    const tgRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_RESULTS_CHAT_ID,
                text, // ✅ NO parse_mode
            }),
        }
    );

    if (!tgRes.ok) {
        const errText = await tgRes.text().catch(() => "");
        return NextResponse.json(
            { error: "Telegram send failed", details: errText },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
