"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { shuffleArray } from "@/lib/seededShuffle";

type Difficulty = "easy" | "medium" | "hard";
type MaskRect = { top: number; left: number; width: number; height: number };

type GameComponentProps = {
  playerName: string;
  initialDifficulty: Difficulty;
  onPlayAgain: () => void;
};

export default function GamePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "Player";
  const difficulty = (searchParams.get("difficulty") || "medium") as Difficulty;

  return (
    <GameComponent
      playerName={name}
      initialDifficulty={difficulty}
      onPlayAgain={() => router.push("/")}
    />
  );
}

function getDailyCountry() {
  const startDate = new Date(2025, 0, 1);
  const today = new Date();
  const dayOffset = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const shuffled = shuffleArray(countries, 12345);
  return { country: shuffled[dayOffset % shuffled.length], date: today };
}

function GameComponent({ playerName, initialDifficulty, onPlayAgain }: GameComponentProps) {
  const { country: dailyCountry, date } = getDailyCountry();
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const maxAttempts = 5;
  const gridRows = 2;
  const gridCols = maxAttempts;
  const maskWidth = 100 / gridCols;
  const maskHeight = 100 / gridRows;

  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState("");

  const [allMasks, setAllMasks] = useState<MaskRect[]>([]);
  const [hiddenMasks, setHiddenMasks] = useState<MaskRect[]>([]);

  // Initialize masks when difficulty changes
  useEffect(() => {
    if (difficulty === "hard") {
      const masks: MaskRect[] = [];
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          masks.push({
            top: r * maskHeight,
            left: c * maskWidth,
            width: maskWidth,
            height: maskHeight,
          });
        }
      }
      setAllMasks(masks);
      const initialRevealIndex = Math.floor(Math.random() * masks.length);
      const initialHidden = masks.filter((_, idx) => idx !== initialRevealIndex);
      setHiddenMasks(initialHidden);
    } else {
      setAllMasks([]);
      setHiddenMasks([]);
    }
    resetGame(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const resetGame = (currentDifficulty: Difficulty = difficulty) => {
    setGuesses([]);
    setCurrentGuess("");
    setIsCorrect(false);
    setError("");

    if (currentDifficulty === "hard" && allMasks.length > 0) {
      const initialRevealIndex = Math.floor(Math.random() * allMasks.length);
      const initialHidden = allMasks.filter((_, idx) => idx !== initialRevealIndex);
      setHiddenMasks(initialHidden);
    }
  };

  const suggestions = countries
    .filter((c) => c.name.toLowerCase().startsWith(currentGuess.toLowerCase()))
    .slice(0, 5);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGuess || guesses.length >= maxAttempts || isCorrect) return;

    const normalizedGuess = currentGuess.trim().toLowerCase();
    const normalizedAnswer = dailyCountry.name.toLowerCase();

    if (!countries.some((c) => c.name.toLowerCase() === normalizedGuess)) {
      setError("Please select a valid country from the list");
      return;
    }

    setError("");
    const newGuesses = [...guesses, normalizedGuess];
    setGuesses(newGuesses);

    if (normalizedGuess === normalizedAnswer) {
      setIsCorrect(true);
    }

    // Hard mode: remove one random mask
    if (difficulty === "hard" && hiddenMasks.length > 0) {
      const randomIndex = Math.floor(Math.random() * hiddenMasks.length);
      const newHidden = [...hiddenMasks];
      newHidden.splice(randomIndex, 1);
      setHiddenMasks(newHidden);
    }

    setCurrentGuess("");
  };

  const attemptsUsed = guesses.length;
  const attemptsLeft = maxAttempts - attemptsUsed;
  const hasUsedAllAttempts = attemptsUsed >= maxAttempts && !isCorrect;

  const getMediumMaskWidth = () => {
    const reveal = ((guesses.length + 1) / maxAttempts) * 100;
    return `${100 - reveal}%`;
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        {playerName}'s Flagle Game
      </h1>
      <p className="text-gray-700 dark:text-gray-300 mb-1">
        Daily Flag for {formattedDate}
      </p>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Attempts Used: {attemptsUsed}/{maxAttempts} | Attempts Left: {attemptsLeft}
      </p>

      {/* Flag */}
      <div className="relative w-80 h-40 mb-4 overflow-hidden rounded-md shadow-md">
        <img
          src={`https://flagcdn.com/w320/${dailyCountry.code}.png`}
          alt={`${dailyCountry.name} flag`}
          className="w-full h-full object-cover"
        />

        {/* Medium mask */}
        {difficulty === "medium" && (
          <div
            className="absolute top-0 right-0 bottom-0 bg-gray-800 dark:bg-gray-900 transition-all"
            style={{ width: getMediumMaskWidth() }}
          />
        )}

        {/* Hard mode overlay */}
        {difficulty === "hard" &&
          hiddenMasks.map((mask, idx) => (
            <div
              key={idx}
              className="absolute bg-gray-800 dark:bg-gray-900 transition-all"
              style={{
                top: `${mask.top}%`,
                left: `${mask.left}%`,
                width: `${mask.width}%`,
                height: `${mask.height}%`,
              }}
            />
          ))}
      </div>

      {/* Guess Input */}
      <form onSubmit={handleGuess} className="mb-4 w-full max-w-xs">
        <input
          type="text"
          value={currentGuess}
          onChange={(e) => setCurrentGuess(e.target.value)}
          placeholder="Enter your guess"
          className="border rounded px-2 py-1 w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          disabled={isCorrect || hasUsedAllAttempts}
        />

        {currentGuess && suggestions.length > 0 && (
          <ul className="border rounded mt-1 bg-white dark:bg-gray-700 max-h-32 overflow-y-auto shadow-md">
            {suggestions.map((s) => (
              <li
                key={s.code}
                className="px-2 py-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => setCurrentGuess(s.name)}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-red-600 mt-1">{error}</p>}

        <button
          type="submit"
          className="mt-2 w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
          disabled={isCorrect || hasUsedAllAttempts}
        >
          Guess
        </button>
      </form>

      {/* Previous guesses */}
      <div className="flex flex-col items-start mb-4">
        {guesses.map((g, idx) => {
          const isRight = g.toLowerCase() === dailyCountry.name.toLowerCase();
          return (
            <div
              key={idx}
              className={`text-lg ${
                isRight
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {g} {isRight ? "✅" : "❌"}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {hasUsedAllAttempts && !isCorrect && (
        <div className="text-red-600 dark:text-red-400 font-bold mb-4">
          You've used all {maxAttempts} attempts! The correct answer was {dailyCountry.name}.
        </div>
      )}

      {isCorrect && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center text-gray-900 dark:text-gray-100">
            <h2 className="text-xl font-bold mb-2">Correct!</h2>
            <p>
              You guessed it in {attemptsUsed} {attemptsUsed === 1 ? "try" : "tries"}!
            </p>
            <button
              onClick={onPlayAgain}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
