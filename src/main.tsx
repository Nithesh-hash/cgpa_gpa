import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const cursorDot = document.querySelector(".cursor-dot") as HTMLElement;
    const cursorOutline = document.querySelector(".cursor-outline") as HTMLElement;

    if (!cursorDot || !cursorOutline) return;

    const handleMouseMove = (e: MouseEvent) => {
      const posX = e.clientX;
      const posY = e.clientY;

      cursorDot.style.left = `${posX}px`;
      cursorDot.style.top = `${posY}px`;

      cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
      }, { duration: 400, fill: "forwards" });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    // Your existing VGrade JSX layout goes here...
    <div className="min-h-screen bg-slate-900 text-white">
      {/* ... */}
    </div>
  );
}

export default App;
