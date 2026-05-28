import { Routes, Route } from "react-router-dom";
import QuizApp from "./page/QuizApp"; // 🔁 ton code actuel du quiz
import UniversitiesMapPage from "./page/UniversitiesMapPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QuizApp />} />
      <Route path="/universities" element={<UniversitiesMapPage />} />
    </Routes>
  );
}