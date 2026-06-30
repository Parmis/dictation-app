import { useState } from "react";

interface PairingScreenProps {
  onPair: (shortcode: string) => void;
  loading: boolean;
  error: string | null;
}

export function PairingScreen({ onPair, loading, error }: PairingScreenProps) {
  const [shortcode, setShortcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shortcode.trim()) {
      onPair(shortcode.trim());
    }
  };

  return (
    <div className="screen pairing-screen">
      <h1>Dictation</h1>
      <p>Enter your pairing code to get started.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={shortcode}
          onChange={(e) => setShortcode(e.target.value.toUpperCase())}
          placeholder="Enter shortcode"
          maxLength={10}
          disabled={loading}
          autoFocus
        />
        <button type="submit" disabled={loading || !shortcode.trim()}>
          {loading ? "Pairing..." : "Pair"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
