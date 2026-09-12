import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import BoardPage from "./pages/BoardPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/p/:projectId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
