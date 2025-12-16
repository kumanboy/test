import fs from "fs";
import path from "path";

/**
 * Option keys for MCQ
 */
export type MCQOptionKey = "A" | "B" | "C" | "D";

/**
 * One question
 */
export type TestQuestion = {
    id: number;
    prompt: string;
    options: Record<MCQOptionKey, string>;
};

/**
 * Full test structure
 */
export type TestData = {
    id: string;
    title: string;
    durationMinutes: number;
    questions: TestQuestion[];
    answerKey?: Record<string, MCQOptionKey>;
};

/**
 * Load test JSON by testId
 * Example: testId = "test1" → data/tests/test1.json
 */
export function loadTest(testId: string): TestData {
    const filePath = path.join(
        process.cwd(),
        "data",
        "tests",
        `${testId}.json`
    );

    if (!fs.existsSync(filePath)) {
        throw new Error(`Test not found: ${testId}`);
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as TestData;
}
