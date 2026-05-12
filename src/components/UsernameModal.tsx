import { useState } from "react";
import { useApp } from "../store";

export default function UsernameModal() {
  const { setUsername } = useApp();
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-backdrop">
      <div className="modal-content w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-3xl">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to Friday Feast!
          </h1>
          <p className="mt-2 text-gray-500">
            Enter your name so your friends know who's adding restaurants and voting.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setUsername(name.trim());
          }}
        >
          <input
            type="text"
            className="input-field mb-4 text-center text-lg"
            placeholder="Your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Let's Eat!
          </button>
        </form>
      </div>
    </div>
  );
}
