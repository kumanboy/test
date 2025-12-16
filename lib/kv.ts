export async function kvSetCode(testId: string, code: string, ttlSeconds = 900) {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    if (!url || !token) throw new Error("Upstash env missing");

    const key = `code:${testId}`;
    const endpoint = `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(
        code
    )}?EX=${ttlSeconds}`;

    const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) throw new Error(`Upstash set failed: ${res.status}`);
}

export async function kvGetCode(testId: string): Promise<string | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    if (!url || !token) throw new Error("Upstash env missing");

    const key = `code:${testId}`;
    const endpoint = `${url}/get/${encodeURIComponent(key)}`;

    const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });

    if (!res.ok) throw new Error(`Upstash get failed: ${res.status}`);

    const data = (await res.json()) as { result: string | null };
    return data.result ?? null;
}
