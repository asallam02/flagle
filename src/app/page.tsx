"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Difficulty = "easy" | "medium" | "hard";

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const handleStartGame = () => {
    if (!name.trim()) return;

    // Navigate to game page with query params
    router.push(`/game?name=${encodeURIComponent(name)}&difficulty=${difficulty}`);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Welcome to Flagle 🗺️
      </h1>

      <div className="mb-4 w-full max-w-xs">
        <label className="block text-gray-800 dark:text-gray-200 mb-1">Your Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="border rounded px-2 py-1 w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        />
      </div>

      <div className="mb-4 w-full max-w-xs">
        <label className="block text-gray-800 dark:text-gray-200 mb-1">Select Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="border rounded px-2 py-1 w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button
        onClick={handleStartGame}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Start Game
      </button>
    </main>
  );
}
