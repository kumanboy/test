export async function tgSendMessage(chatId: number | string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }),
    });

    if (!res.ok) throw new Error(`Telegram sendMessage failed: ${res.status}`);
}
