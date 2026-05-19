import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import About from "./components/About";
import Apps from "./components/Apps";
import BrightSpace from "./components/BrightSpace";
import BrightSpacetime from "./components/BrightSpacetime";
import DatePage from "./components/DatePage";
import Features from "./components/Features";
import FractionTable from "./components/FractionTable";
import Hero from "./components/Hero";
import Install from "./components/Install";
import PrivacyPolicy from "./components/PrivacyPolicy";
import SpacetimePromo from "./components/SpacetimePromo";
import SpacePromo from "./components/SpacePromo";
import Support from "./components/Support";

function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Hero scrollY={scrollY} />
      <Features />
      <Install />
      <Apps />
      <DatePage />
      <SpacePromo />
      <SpacetimePromo />
      <About />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/space" element={<BrightSpace />} />
          <Route path="/spacetime" element={<BrightSpacetime />} />
          <Route path="/localtime" element={<FractionTable />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
