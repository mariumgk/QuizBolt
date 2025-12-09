"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
            {/* Background Gradients */}
            <div className="absolute top-0 center -translate-x-1/2 left-1/2 w-[800px] h-[500px] bg-primary/20 blur-[100px] rounded-full -z-10 opacity-50" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-blue-400/10 blur-[80px] rounded-full -z-10" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-8">
                    {/* Animated Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span>AI-Powered Learning</span>
                    </motion.div>

                    {/* Main Title */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
                        className="max-w-4xl"
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Your Personalized{" "}
                            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                                AI Study Companion
                            </span>
                        </h1>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400"
                    >
                        Study smarter, not harder. Turn your documents into interactive
                        quizzes, flashcards, and notes instantly with the power of advanced AI.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 min-w-[200px]"
                    >
                        <Link href="/login">
                            <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto text-lg h-12 px-8"
                            >
                                Explore Features
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Floating UI Elements (Abstract) */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-1/4 left-10 w-24 h-24 bg-card border rounded-2xl shadow-lg -z-5 hidden lg:block rotate-12 p-4"
            >
                <div className="w-full h-2 bg-muted rounded mb-2" />
                <div className="w-2/3 h-2 bg-muted rounded" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="absolute bottom-1/4 right-10 w-32 h-20 bg-card border rounded-xl shadow-lg -z-5 hidden lg:flex items-center justify-center -rotate-6"
            >
                <span className="text-2xl font-bold text-primary">A+</span>
            </motion.div>
        </section>
    );
}
