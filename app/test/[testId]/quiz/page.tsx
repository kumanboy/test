import { loadTest } from "@/lib/tests";
import QuizClient from "./quiz-client";

export default async function QuizPage({
                                           params,
                                       }: {
    params: Promise<{ testId: string }> | { testId: string };
}) {
    const { testId } = await params;

    const test = loadTest(testId);
    return <QuizClient test={test} />;
}
