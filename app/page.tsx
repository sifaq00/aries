import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import { SourcesMarquee, WalletsMarquee } from "@/components/landing/TechMarquee";
import LatestVerdicts from "@/components/landing/LatestVerdicts";
import HowItWorks from "@/components/landing/HowItWorks";
import HonestLimits from "@/components/landing/HonestLimits";
import Faq from "@/components/landing/Faq";
import CtaBand from "@/components/landing/CtaBand";
import Footer from "@/components/landing/Footer";
import styles from "@/components/landing/landing.module.css";

// Latest verdicts / hero example query real rows at build time otherwise;
// revalidate periodically so new reports show up without a redeploy.
export const revalidate = 300;

export default function Landing() {
  return (
    <div id="top" className={styles.page}>
      <Navbar />
      <main>
        <Hero />
        <SourcesMarquee />
        <LatestVerdicts />
        <HowItWorks />
        <HonestLimits />
        <Faq />
        <WalletsMarquee />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
