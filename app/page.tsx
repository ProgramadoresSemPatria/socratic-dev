import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Method } from "@/components/landing/method";
import { Comparison } from "@/components/landing/comparison";
import { Manifesto } from "@/components/landing/manifesto";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="relative flex-1 flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Method />
        <Comparison />
        <Manifesto />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
