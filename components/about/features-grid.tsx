"use client";

import { motion } from "framer-motion";
import { BrainCircuit, BookOpen, MessageSquare, LineChart, Layers, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const features = [
    {
        icon: BrainCircuit,
        title: "AI Quiz Generator",
        description: "Generate multiple-choice quizzes from any document in seconds with adjustable difficulty.",
    },
    {
        icon: Layers,
        title: "Smart Flashcards",
        description: "Turn key concepts into flashcards automatically. Track mastery with spaced repetition.",
    },
    {
        icon: MessageSquare,
        title: "Chat with PDF",
        description: "Ask questions and get answers cited directly from your source material.",
    },
    {
        icon: BookOpen,
        title: "AI Summaries",
        description: "Get concise summaries and study outlines formatted perfectly for review.",
    },
    {
        icon: LineChart,
        title: "Progress Analytics",
        description: "Visualize your learning journey with detailed charts on scores and accuracy.",
    },
    {
        icon: Download,
        title: "Export & Share",
        description: "Export your notes and quizzes to take them anywhere (Coming Soon).",
    },
];

export function FeaturesGrid() {
    return (
        <section id="features" className="py-24">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                    >
                        Everything You Need to Ace It
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 mt-4 text-lg"
                    >
                        Our core features are designed to handle every aspect of your study routine.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
