import { About } from "../components/About";
import { CareerTimeline } from "../components/CareerTimeline";
import { Contact } from "../components/Contact";
import { Expertise } from "../components/Expertise";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { Navigation } from "../components/Navigation";
import { Projects } from "../components/Projects";
import { useThemeMode } from "../theme/theme";

export function HomePage() {
  const { mode } = useThemeMode();

  return (
    <div className={`main-container ${mode}-mode`}>
      <Navigation />
      <main>
        <Hero />
        <div className="fade-in">
          <About />
          <Expertise />
          <CareerTimeline />
          <Projects />
          <Contact />
        </div>
      </main>
      <Footer />
    </div>
  );
}
