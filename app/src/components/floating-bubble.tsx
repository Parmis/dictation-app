import { useState, useEffect } from "react";

interface FloatingBubbleProps {
  recording: boolean;
  onToggle: () => void;
}

export function FloatingBubble({ recording, onToggle }: FloatingBubbleProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  return (
    <div
      className={`floating-bubble ${recording ? "recording" : ""}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <button className="bubble-btn" onClick={onToggle}>
        {recording ? "⏹" : "🎤"}
      </button>
    </div>
  );
}
