"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getQuiz, type QuizQuestion } from "@/app/actions/generate-quiz";
import { submitQuiz, type QuizResult } from "@/app/actions/submit-quiz";
import { ExamModeWrapper } from "@/components/quiz/exam-mode-wrapper";
import { SidePanel } from "@/components/ui/side-panel";
import { ShieldAlert, Settings, Download } from "lucide-react";
import { exportToPdf, exportToDocx } from "@/lib/export-utils";

interface AnswerState {
  [questionId: string]: number;
}

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params?.id;

  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    docId: string;
    questions: QuizQuestion[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  // Exam Mode State
  const [examMode, setExamMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // Fetch quiz data
  useEffect(() => {
    async function loadQuiz() {
      if (!quizId) return;

      try {
        const data = await getQuiz(quizId);
        if (data) {
          setQuiz(data);
        } else {
          setError("Quiz not found");
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError("Failed to load quiz");
      } finally {
        setIsLoading(false);
      }
    }

    loadQuiz();
  }, [quizId]);

  const handleSubmit = async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const submitResult = await submitQuiz({
        quizId: quiz.id,
        answers,
      });
      setResult(submitResult);
      setStarted(false); // Reset view state
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViolation = () => {
    if (violationCount >= 1) {
      // Second violation: Auto-submit
      alert("Exam Mode Violation: You switched tabs or lost focus multiple times. Your quiz is being submitted automatically.");
      handleSubmit();
    } else {
      // First warning
      setViolationCount(prev => prev + 1);
      alert("WARNING: Exam Mode Active! Do not leave this window or switch tabs. Next violation will auto-submit your quiz.");
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-8">Loading quiz...</p>;
  }

  if (error && !quiz) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" onClick={() => router.push("/quizzes")}>
          Back to Quizzes
        </Button>
      </div>
    );
  }

  if (!quiz) {
    return <p className="text-sm text-muted-foreground p-8">Quiz not found.</p>;
  }

  // Show results
  if (result) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto p-6">
        <div>
          <h1 className="text-xl font-semibold">Quiz Results</h1>
          <p className="text-sm text-muted-foreground">{quiz.title}</p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 text-center">
            <p className="text-4xl font-bold text-primary">{result.score}%</p>
            <p className="text-sm text-muted-foreground">
              {result.totalCorrect} of {result.totalQuestions} correct
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review Answers</h2>
          {quiz.questions.map((question, idx) => {
            const answer = result.answers.find((a) => a.questionId === question.id);
            const isCorrect = answer?.isCorrect;
            const selectedOption = answer?.selectedOption;

            return (
              <div
                key={question.id}
                className={`rounded-xl border p-4 ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"
                  }`}
              >
                <p className="mb-3 font-medium">
                  {idx + 1}. {question.questionText}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {question.options.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrectOption = question.correctOption === optIdx;

                    return (
                      <div
                        key={optIdx}
                        className={`rounded-md border px-3 py-2 text-sm ${isCorrectOption
                          ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                          : isSelected
                            ? "border-red-500 bg-red-100 dark:bg-red-900/30"
                            : "border-muted"
                          }`}
                      >
                        {String.fromCharCode(65 + optIdx)}. {option}
                        {isCorrectOption && (
                          <span className="ml-2 text-xs text-green-600">(Correct)</span>
                        )}
                        {isSelected && !isCorrectOption && (
                          <span className="ml-2 text-xs text-red-600">(Your answer)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/quizzes")}>
            Back to Quizzes
          </Button>
          <Button onClick={() => {
            setResult(null);
            setAnswers({});
            setStarted(false);
            setExamMode(false);
            setViolationCount(0);
          }}>
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <ExamModeWrapper
      isActive={started && examMode}
      onViolation={handleViolation}
      onWarning={(msg) => alert(msg)}
    >
      <div className="space-y-6 max-w-3xl mx-auto p-6 relative">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              {quiz.title}
              {examMode && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Exam Mode</span>}
            </h1>
            <p className="text-sm text-muted-foreground">
              {quiz.questions.length} questions
            </p>
          </div>
          {!started && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                title="Export as PDF"
              >
                <a href={`/api/quizzes/${quizId}/export/pdf`} download>
                  <Download className="w-4 h-4 mr-2" /> PDF
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                title="Export as PDF with Answer Key"
              >
                <a href={`/api/quizzes/${quizId}/export/pdf?includeAnswers=true`} download>
                  <Download className="w-4 h-4 mr-2" /> PDF + Answers
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                title="Export as DOCX"
              >
                <a href={`/api/quizzes/${quizId}/export/docx`} download>
                  <Download className="w-4 h-4 mr-2" /> DOCX
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Button>
            </div>
          )}
        </div>

        {!started ? (
          <div className="rounded-xl border bg-card p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              This quiz contains {quiz.questions.length} multiple choice questions.
            </p>
            {examMode && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm text-left mx-auto max-w-md">
                <p className="font-semibold flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Exam Mode Enabled</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Full screen recommended</li>
                  <li>Do not switch tabs</li>
                  <li>Copy/Paste disabled</li>
                  <li>Right-click disabled</li>
                  <li>Leaving the window will auto-submit</li>
                </ul>
              </div>
            )}
            <Button onClick={() => setStarted(true)} size="lg" className="w-full md:w-auto">Start Quiz</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((question, idx) => (
              <div
                key={question.id}
                className="rounded-xl border bg-card p-6 space-y-4"
              >
                <p className="font-medium text-lg">
                  {idx + 1}. {question.questionText}
                </p>
                <div className="grid gap-3 pt-2">
                  {question.options.map((option, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all hover:bg-muted/50 ${answers[question.id] === optIdx ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optIdx}
                        checked={answers[question.id] === optIdx}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: optIdx,
                          }))
                        }
                        className="sr-only"
                      />
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors ${answers[question.id] === optIdx ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground"}`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel? Progress will be lost.")) {
                    setStarted(false);
                    setAnswers({});
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (Object.keys(answers).length < quiz.questions.length) {
                    if (!confirm("You haven't answered all questions. Submit anyway?")) return;
                  }
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="ml-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            </div>
          </div>
        )}

        <SidePanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Quiz Settings"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Exam Mode</label>
                <p className="text-xs text-muted-foreground">Enable strict anti-cheating measures</p>
              </div>
              <Button
                variant={examMode ? "default" : "outline"}
                size="sm"
                className={examMode ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                onClick={() => setExamMode(!examMode)}
              >
                {examMode ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>When Exam Mode is active:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Tab switching is monitored</li>
                <li>Copy/Paste is disabled</li>
                <li>Context menu is disabled</li>
              </ul>
            </div>
          </div>
        </SidePanel>
      </div>
    </ExamModeWrapper>
  );
}

