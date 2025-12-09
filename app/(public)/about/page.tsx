import { HeroSection } from "@/components/about/hero";
import { ProblemSolution } from "@/components/about/problem-solution";
import { FeaturesGrid } from "@/components/about/features-grid";
import { Audience } from "@/components/about/audience";
import { Security } from "@/components/about/security";
import { AboutCTA } from "@/components/about/cta";

export default function AboutPage() {
    return (
        <>
            <HeroSection />
            <ProblemSolution />
            <FeaturesGrid />
            <Audience />
            <Security />
            <AboutCTA />

            <footer className="py-6 md:px-8 md:py-0 border-t">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by QuizBolt. The new standard for AI learning.
                    </p>
                </div>
            </footer>
        </>
    );
}
