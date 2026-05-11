import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import About from "./components/About";
import DatePage from "./components/DatePage";
import Features from "./components/Features";
import Hero from "./components/Hero";
import Install from "./components/Install";
import PrivacyPolicy from "./components/PrivacyPolicy";

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
      <DatePage />
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
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
