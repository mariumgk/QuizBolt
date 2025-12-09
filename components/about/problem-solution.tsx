"use client";

import { motion } from "framer-motion";
import { XCircle, CheckCircle, Upload, Wand2, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProblemSolution() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <section className="py-20 bg-muted/30">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Problem Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6">
                            The Struggle with Traditional Studying
                        </h2>
                        <p className="text-gray-500 mb-8 max-w-lg">
                            We know the feeling. You're drowning in PDFs, textbooks, and messy notes.
                            Creating study materials takes hours before you even start learning.
                            It's inefficient, overwhelming, and exhausting.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Hours spent manually creating flashcards",
                                "Difficulty reviewing long documents",
                                "Unorganized notes scattered everywhere",
                                "Lack of objective self-assessment",
                            ].map((painPoint, index) => (
                                <div key={index} className="flex items-center gap-3 text-red-500/80">
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-foreground">{painPoint}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Solution Flow */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-6 lg:mb-10 lg:pl-4">
                            The QuizBolt Way
                        </h2>

                        <div className="space-y-6">
                            {/* Step 1 */}
                            <motion.div variants={item}>
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="bg-primary/10 p-3 rounded-xl">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">1. Upload Content</h3>
                                            <p className="text-sm text-muted-foreground">Drop your PDFs or paste URLs.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div variants={item} className="ml-8">
                                <Card className="hover:shadow-md transition-shadow border-primary/50">
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="bg-primary/10 p-3 rounded-xl">
                                            <Wand2 className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">2. AI Magic</h3>
                                            <p className="text-sm text-muted-foreground">We instantly generate quizzes & notes.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div variants={item} className="ml-16">
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="flex items-center gap-4 p-6">
                                        <div className="bg-primary/10 p-3 rounded-xl">
                                            <GraduationCap className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">3. Master It</h3>
                                            <p className="text-sm text-muted-foreground">Study effectively and track progress.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
