import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Apple,
  ArrowRight,
  BookOpen,
  CarFront,
  Cat,
  Check,
  CircleDot,
  Fish,
  Heart,
  Home,
  House,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Screen = "start" | "playing" | "paused" | "result";
type Feedback = "correct" | "wrong" | null;
type QuestionKind = "letter" | "syllable" | "word" | "sentence";
type PictureName = "ball" | "book" | "fish" | "house" | "sun" | "car" | "apple" | "cat";

interface Question {
  id: string;
  kind: QuestionKind;
  display: string;
  answer: string;
  options: string[];
  speech: string;
  picture?: PictureName;
}

interface HighScore {
  id: string;
  name: string;
  score: number;
  level: number;
  date: string;
}

const LEVELS = [
  { number: 1, label: "Kenal Abjad", short: "Abjad", color: "#ff7a59", description: "Pelajari 26 huruf dari A sampai Z." },
  { number: 2, label: "Suku Kata", short: "Suku Kata", color: "#f4b83f", description: "Gabungkan bunyi menjadi suku kata." },
  { number: 3, label: "Baca Kata", short: "Kata", color: "#3db6a4", description: "Temukan kata dari gambar dan suara." },
  { number: 4, label: "Baca Kalimat", short: "Kalimat", color: "#5c77df", description: "Lengkapi kalimat dengan kata tepat." },
] as const;

const ALPHABET_QUESTIONS: Question[] = Array.from({ length: 26 }, (_, index): Question => {
  const letter = String.fromCharCode(65 + index);
  const nextLetter = String.fromCharCode(65 + ((index + 1) % 26));
  const farLetter = String.fromCharCode(65 + ((index + 5) % 26));
  return {
    id: `huruf-${letter.toLowerCase()}`,
    kind: "letter",
    display: letter.toLowerCase(),
    answer: letter,
    options: [letter, nextLetter, farLetter],
    speech: `Huruf ${letter}`,
  };
});

const QUESTION_BANK: Record<number, Question[]> = {
  1: ALPHABET_QUESTIONS,
  2: [
    { id: "ba", kind: "syllable", display: "B + A", answer: "BA", options: ["BI", "BA", "BU"], speech: "B dan A, dibaca ba" },
    { id: "bi", kind: "syllable", display: "B + I", answer: "BI", options: ["BE", "BI", "BO"], speech: "B dan I, dibaca bi" },
    { id: "ma", kind: "syllable", display: "M + A", answer: "MA", options: ["NA", "MU", "MA"], speech: "M dan A, dibaca ma" },
    { id: "ku", kind: "syllable", display: "K + U", answer: "KU", options: ["KU", "KA", "KO"], speech: "K dan U, dibaca ku" },
    { id: "sa", kind: "syllable", display: "S + A", answer: "SA", options: ["CA", "SI", "SA"], speech: "S dan A, dibaca sa" },
    { id: "ro", kind: "syllable", display: "R + O", answer: "RO", options: ["RU", "RO", "LO"], speech: "R dan O, dibaca ro" },
    { id: "pi", kind: "syllable", display: "P + I", answer: "PI", options: ["PI", "BI", "PA"], speech: "P dan I, dibaca pi" },
    { id: "te", kind: "syllable", display: "T + E", answer: "TE", options: ["TA", "DE", "TE"], speech: "T dan E, dibaca te" },
    { id: "la", kind: "syllable", display: "L + A", answer: "LA", options: ["RA", "LI", "LA"], speech: "L dan A, dibaca la" },
  ],
  3: [
    { id: "bola", kind: "word", display: "B _ L A", answer: "BOLA", options: ["BOLA", "BULU", "BOLU"], speech: "Bola", picture: "ball" },
    { id: "buku", kind: "word", display: "B _ K U", answer: "BUKU", options: ["BAKU", "BUKU", "KUKU"], speech: "Buku", picture: "book" },
    { id: "ikan", kind: "word", display: "I _ A N", answer: "IKAN", options: ["IKAN", "AKAN", "INTAN"], speech: "Ikan", picture: "fish" },
    { id: "rumah", kind: "word", display: "R _ M A H", answer: "RUMAH", options: ["RAMAH", "RUMAH", "REMAH"], speech: "Rumah", picture: "house" },
    { id: "matahari", kind: "word", display: "M A T A H A R I", answer: "MATAHARI", options: ["MATAHARI", "MALAM HARI", "MENARI"], speech: "Matahari", picture: "sun" },
    { id: "mobil", kind: "word", display: "M _ B I L", answer: "MOBIL", options: ["MEBEL", "MOBIL", "MOLI"], speech: "Mobil", picture: "car" },
    { id: "apel", kind: "word", display: "A _ E L", answer: "APEL", options: ["ASAP", "APEL", "ATAP"], speech: "Apel", picture: "apple" },
    { id: "kucing", kind: "word", display: "K U _ I N G", answer: "KUCING", options: ["KUNCI", "KANCING", "KUCING"], speech: "Kucing", picture: "cat" },
  ],
  4: [
    { id: "ayah-buku", kind: "sentence", display: "Ayah membaca ___ di teras.", answer: "BUKU", options: ["BUKU", "SEPATU", "SENDOK"], speech: "Ayah membaca buku di teras" },
    { id: "rina-air", kind: "sentence", display: "Rina minum ___ setelah bermain.", answer: "AIR", options: ["TAS", "AIR", "PENSIL"], speech: "Rina minum air setelah bermain" },
    { id: "kucing-kursi", kind: "sentence", display: "Kucing itu tidur di atas ___.", answer: "KURSI", options: ["LANGIT", "KURSI", "SEPEDA"], speech: "Kucing itu tidur di atas kursi" },
    { id: "sekolah-pagi", kind: "sentence", display: "Kami pergi ke sekolah setiap ___.", answer: "PAGI", options: ["PAGI", "PINTU", "HUJAN"], speech: "Kami pergi ke sekolah setiap pagi" },
    { id: "adik-payung", kind: "sentence", display: "Adik memakai ___ saat hujan.", answer: "PAYUNG", options: ["PIRING", "PAYUNG", "BUKU"], speech: "Adik memakai payung saat hujan" },
    { id: "ibu-pasar", kind: "sentence", display: "Ibu membeli sayur di ___.", answer: "PASAR", options: ["KAMAR", "JALAN", "PASAR"], speech: "Ibu membeli sayur di pasar" },
    { id: "burung-langit", kind: "sentence", display: "Burung kecil itu terbang di ___.", answer: "LANGIT", options: ["LANGIT", "LANTAI", "LEMARI"], speech: "Burung kecil itu terbang di langit" },
    { id: "budi-sabun", kind: "sentence", display: "Budi mencuci tangan dengan ___.", answer: "SABUN", options: ["SABUN", "SISIR", "KERTAS"], speech: "Budi mencuci tangan dengan sabun" },
  ],
};

const OPTION_COLORS = ["coral", "sunny", "teal"];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function prepareQuestions(level: number) {
  if (level === 1) {
    return QUESTION_BANK[1].map((question) => ({ ...question, options: shuffle(question.options) }));
  }
  return shuffle(QUESTION_BANK[level])
    .slice(0, 7)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}

function getStoredNumber(key: string, fallback: number) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function getStoredText(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The game remains playable when storage is blocked by a private browser mode.
  }
}

function getStoredScores(): HighScore[] {
  try {
    return JSON.parse(window.localStorage.getItem("dc-baca-scores") || "[]") as HighScore[];
  } catch {
    return [];
  }
}

function Picture({ name }: { name: PictureName }) {
  const props = { size: 72, strokeWidth: 1.8 };
  if (name === "ball") return <CircleDot {...props} />;
  if (name === "book") return <BookOpen {...props} />;
  if (name === "fish") return <Fish {...props} />;
  if (name === "house") return <House {...props} />;
  if (name === "sun") return <Sun {...props} />;
  if (name === "car") return <CarFront {...props} />;
  if (name === "apple") return <Apple {...props} />;
  return <Cat {...props} />;
}

function Mascot({ compact = false }: { compact?: boolean }) {
  return (
    <motion.svg
      className={compact ? "mascot mascot--compact" : "mascot"}
      viewBox="0 0 300 280"
      role="img"
      aria-label="Bibi, burung kecil yang sedang membaca"
      animate={{ y: [0, -8, 0], rotate: [0, 1.2, 0] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <ellipse cx="151" cy="253" rx="85" ry="13" fill="#173354" opacity=".1" />
      <path d="M91 112c0-51 28-81 64-81 46 0 71 40 64 91-4 33-1 65-31 86-24 18-70 8-87-15-15-21-10-52-10-81Z" fill="#5c77df" />
      <path d="M111 49c8-24 24-34 39-39-1 14 4 23 15 30" fill="#f4b83f" />
      <circle cx="130" cy="91" r="22" fill="#fffaf0" />
      <circle cx="184" cy="91" r="22" fill="#fffaf0" />
      <circle cx="135" cy="92" r="8" fill="#183153" />
      <circle cx="179" cy="92" r="8" fill="#183153" />
      <circle cx="138" cy="89" r="2.5" fill="white" />
      <circle cx="182" cy="89" r="2.5" fill="white" />
      <path d="m146 105 12-9 13 9-13 11-12-11Z" fill="#ff7a59" />
      <path d="M85 138c-30-7-47 9-52 34 24-7 42 1 59 20" fill="#3db6a4" />
      <path d="M216 137c30-9 48 5 55 29-24-5-41 4-56 24" fill="#3db6a4" />
      <path d="M69 157c27-1 58 8 88 31v65c-31-22-60-32-88-27v-69Z" fill="#fffaf0" stroke="#183153" strokeWidth="4" strokeLinejoin="round" />
      <path d="M245 157c-27-1-58 8-88 31v65c31-22 60-32 88-27v-69Z" fill="#fffaf0" stroke="#183153" strokeWidth="4" strokeLinejoin="round" />
      <path d="M157 189v62" stroke="#183153" strokeWidth="4" />
      <path d="M87 177c20 0 38 6 54 17M87 192c18 1 35 6 49 14M227 177c-20 0-38 6-54 17M227 192c-18 1-35 6-49 14" stroke="#f4b83f" strokeWidth="4" strokeLinecap="round" />
    </motion.svg>
  );
}

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="DCdhina collection">
      <span className="brand-mark">DC</span>
      <span className="brand-name">dhina<span>collection</span></span>
    </div>
  );
}

function DoodleBackground() {
  return (
    <div className="doodles" aria-hidden="true">
      <span className="doodle-letter doodle-a">A</span>
      <span className="doodle-letter doodle-b">b</span>
      <span className="doodle-letter doodle-c">C</span>
      <span className="doodle-star doodle-star-one" />
      <span className="doodle-star doodle-star-two" />
      <span className="doodle-line" />
    </div>
  );
}

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const reduceMotion = useReducedMotion();
  if (!burstKey || reduceMotion) return null;
  const colors = ["#ff7a59", "#f4b83f", "#3db6a4", "#5c77df", "#ef6d9d"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / 18;
        const distance = 120 + (index % 4) * 22;
        return (
          <motion.i
            key={`${burstKey}-${index}`}
            style={{ background: colors[index % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + 55,
              opacity: [1, 1, 0],
              scale: [0.4, 1, 0.8],
              rotate: index % 2 ? 240 : -240,
            }}
            transition={{ duration: 0.82, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

function renderSentence(text: string) {
  const [before, after] = text.split("___");
  return <>{before}<span className="sentence-blank">_____</span>{after}</>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [selectedLevel, setSelectedLevel] = useState(() => Math.min(getStoredNumber("dc-baca-unlocked", 1), 4));
  const [unlockedLevel, setUnlockedLevel] = useState(() => Math.min(getStoredNumber("dc-baca-unlocked", 1), 4));
  const [playerName, setPlayerName] = useState(() => getStoredText("dc-baca-name", "Bintang"));
  const [highScores, setHighScores] = useState<HighScore[]>(getStoredScores);
  const [questions, setQuestions] = useState<Question[]>(() => prepareQuestions(1));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [soundOn, setSoundOn] = useState(true);
  const [shake, setShake] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [won, setWon] = useState(false);
  const [resultScore, setResultScore] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const locked = useRef(false);
  const answerHandler = useRef<(index: number) => void>(() => undefined);
  const currentQuestion = questions[questionIndex];
  const currentLevel = LEVELS[selectedLevel - 1];

  const playSfx = useCallback((kind: "tap" | "correct" | "wrong" | "finish") => {
    if (!soundOn) return;
    const Context = window.AudioContext;
    if (!Context) return;
    const context = audioContext.current || new Context();
    audioContext.current = context;
    void context.resume();
    const patterns = {
      tap: [[330, 0, 0.045]],
      correct: [[523, 0, 0.09], [659, 0.08, 0.1], [784, 0.16, 0.14]],
      wrong: [[220, 0, 0.12], [165, 0.1, 0.16]],
      finish: [[392, 0, 0.12], [523, 0.1, 0.12], [659, 0.2, 0.13], [784, 0.3, 0.25]],
    }[kind] as number[][];

    patterns.forEach(([frequency, delay, duration]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === "wrong" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
      gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.13, context.currentTime + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + duration + 0.02);
    });
  }, [soundOn]);

  const speak = useCallback((text: string) => {
    if (!soundOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("id")) || null;
    utterance.lang = "id-ID";
    utterance.rate = 0.78;
    utterance.pitch = 1.12;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, [soundOn]);

  const saveScore = useCallback((finalScore: number) => {
    const safeName = playerName.trim().slice(0, 14) || "Bintang";
    const entry: HighScore = {
      id: `${Date.now()}-${Math.random()}`,
      name: safeName,
      score: finalScore,
      level: selectedLevel,
      date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date()),
    };
    setHighScores((previous) => {
      const next = [...previous, entry].sort((a, b) => b.score - a.score).slice(0, 6);
      setStoredValue("dc-baca-scores", JSON.stringify(next));
      return next;
    });
  }, [playerName, selectedLevel]);

  const finishGame = useCallback((didWin: boolean, finalScore: number) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    window.speechSynthesis?.cancel();
    locked.current = true;
    setWon(didWin);
    setResultScore(finalScore);
    setScreen("result");
    saveScore(finalScore);
    playSfx(didWin ? "finish" : "wrong");
    if (didWin && selectedLevel < 4) {
      const nextUnlocked = Math.max(unlockedLevel, selectedLevel + 1);
      setUnlockedLevel(nextUnlocked);
      setStoredValue("dc-baca-unlocked", String(nextUnlocked));
    }
  }, [playSfx, saveScore, selectedLevel, unlockedLevel]);

  const startGame = useCallback((level = selectedLevel) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    const safeName = playerName.trim().slice(0, 14) || "Bintang";
    setStoredValue("dc-baca-name", safeName);
    setPlayerName(safeName);
    setSelectedLevel(level);
    setQuestions(prepareQuestions(level));
    setQuestionIndex(0);
    setScore(0);
    setLives(3);
    setCombo(0);
    setBestCombo(0);
    setFeedback(null);
    setChosenIndex(null);
    setTimeLeft(100);
    setWon(false);
    setBurstKey(0);
    locked.current = false;
    setScreen("playing");
    playSfx("tap");
  }, [playSfx, playerName, selectedLevel]);

  const goHome = useCallback(() => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    window.speechSynthesis?.cancel();
    locked.current = false;
    setFeedback(null);
    setScreen("start");
  }, []);

  const handleChoice = useCallback((index: number) => {
    if (screen !== "playing" || locked.current || !currentQuestion) return;
    locked.current = true;
    const isCorrect = index >= 0 && currentQuestion.options[index] === currentQuestion.answer;
    setChosenIndex(index);

    if (isCorrect) {
      const nextCombo = combo + 1;
      const points = 100 + combo * 25 + Math.round(timeLeft * 0.5);
      const nextScore = score + points;
      setScore(nextScore);
      setCombo(nextCombo);
      setBestCombo((value) => Math.max(value, nextCombo));
      setFeedback("correct");
      setBurstKey((value) => value + 1);
      playSfx("correct");
      if (navigator.vibrate) navigator.vibrate(28);

      advanceTimer.current = window.setTimeout(() => {
        if (questionIndex >= questions.length - 1) {
          finishGame(true, nextScore);
          return;
        }
        setQuestionIndex((value) => value + 1);
        setFeedback(null);
        setChosenIndex(null);
        setTimeLeft(100);
        locked.current = false;
      }, 760);
      return;
    }

    const nextLives = lives - 1;
    setLives(nextLives);
    setCombo(0);
    setFeedback("wrong");
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
    playSfx("wrong");
    if (navigator.vibrate) navigator.vibrate([45, 35, 45]);

    advanceTimer.current = window.setTimeout(() => {
      if (nextLives <= 0) {
        finishGame(false, score);
        return;
      }
      if (questionIndex >= questions.length - 1) {
        finishGame(true, score);
        return;
      }
      setQuestionIndex((value) => value + 1);
      setFeedback(null);
      setChosenIndex(null);
      setTimeLeft(100);
      locked.current = false;
    }, 850);
  }, [combo, currentQuestion, finishGame, lives, playSfx, questionIndex, questions.length, score, screen, timeLeft]);

  answerHandler.current = handleChoice;

  useEffect(() => {
    if (screen !== "playing" || feedback) return;
    const interval = window.setInterval(() => {
      setTimeLeft((value) => {
        const next = value - 0.72;
        if (next <= 0) {
          window.queueMicrotask(() => answerHandler.current(-1));
          return 0;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [feedback, questionIndex, screen]);

  useEffect(() => {
    if (screen !== "playing" || feedback || !currentQuestion) return;
    const voiceTimer = window.setTimeout(() => speak(currentQuestion.speech), 420);
    return () => window.clearTimeout(voiceTimer);
  }, [currentQuestion, feedback, questionIndex, screen, speak]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT") {
        if (event.key === "Enter") startGame();
        return;
      }
      if (screen === "start" && event.key === "Enter") startGame();
      if (screen === "playing") {
        if (["1", "2", "3"].includes(event.key)) handleChoice(Number(event.key) - 1);
        if (event.key === " " && currentQuestion) {
          event.preventDefault();
          speak(currentQuestion.speech);
        }
        if (event.key.toLowerCase() === "p" || event.key === "Escape") setScreen("paused");
      } else if (screen === "paused" && (event.key.toLowerCase() === "p" || event.key === "Escape")) {
        locked.current = false;
        setScreen("playing");
      } else if (screen === "result" && (event.key.toLowerCase() === "r" || event.key === "Enter")) {
        startGame();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentQuestion, handleChoice, screen, speak, startGame]);

  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    window.speechSynthesis?.cancel();
    void audioContext.current?.close();
  }, []);

  const toggleSound = () => {
    setSoundOn((value) => !value);
    if (soundOn) window.speechSynthesis?.cancel();
  };

  if (screen === "start") {
    return (
      <main className="start-screen">
        <DoodleBackground />
        <header className="start-nav">
          <BrandMark />
          <button className="icon-button icon-button--cream" onClick={toggleSound} aria-label={soundOn ? "Matikan suara" : "Nyalakan suara"}>
            {soundOn ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
        </header>

        <section className="start-hero">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="eyebrow"><Sparkles size={17} /> Petualangan membaca</p>
            <h1><span>DC</span>dhina<br />collection</h1>
            <h2>Baca, pilih, dan kumpulkan bintang.</h2>
            <p className="hero-description">Mulai dari abjad sampai lancar membaca kalimat. Dengarkan suaranya, lalu pilih jawaban yang tepat.</p>

            <div className="start-actions">
              <label className="name-field">
                <span>Nama pemain</span>
                <input value={playerName} maxLength={14} onChange={(event) => setPlayerName(event.target.value)} aria-label="Nama pemain" />
              </label>
              <button className="primary-button" onClick={() => startGame()}>
                Mulai level {selectedLevel}<ArrowRight size={21} />
              </button>
            </div>
            <p className="keyboard-hint"><kbd>Enter</kbd> mulai <span /> <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> menjawab</p>
          </motion.div>

          <motion.div className="adventure-map" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.55 }}>
            <div className="mascot-wrap">
              <Mascot />
              <div className="speech-bubble">Ayo baca!</div>
            </div>
            <div className="level-picker" aria-label="Pilih level">
              <div className="level-heading"><span>Jalur belajar</span><strong>{unlockedLevel}/4 terbuka</strong></div>
              {LEVELS.map((level) => {
                const lockedLevel = level.number > unlockedLevel;
                const selected = selectedLevel === level.number;
                return (
                  <button
                    key={level.number}
                    className={`level-row ${selected ? "is-selected" : ""}`}
                    disabled={lockedLevel}
                    onClick={() => { setSelectedLevel(level.number); playSfx("tap"); }}
                    style={{ "--level-color": level.color } as CSSProperties}
                  >
                    <span className="level-number">{lockedLevel ? <LockKeyhole size={17} /> : level.number}</span>
                    <span className="level-info"><strong>{level.label}</strong><small>{level.description}</small></span>
                    {selected && <Check size={20} className="level-check" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </section>

        <section className="leaderboard" aria-labelledby="leaderboard-title">
          <div className="leaderboard-title">
            <div><Trophy size={24} /><h2 id="leaderboard-title">Papan Bintang</h2></div>
            <p>Skor terbaik tersimpan di perangkat ini.</p>
          </div>
          {highScores.length ? (
            <div className="score-table" role="table" aria-label="Daftar skor tertinggi">
              <div className="score-row score-row--head" role="row"><span>Peringkat</span><span>Pemain</span><span>Level</span><span>Skor</span></div>
              {highScores.map((entry, index) => (
                <div className="score-row" role="row" key={entry.id}>
                  <span className="rank">{index + 1}</span>
                  <span><strong>{entry.name}</strong><small>{entry.date}</small></span>
                  <span>Level {entry.level}</span>
                  <span className="table-score">{entry.score.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-score"><Star size={23} /> Jadilah bintang pertama di papan ini.</div>}
        </section>
        <footer className="start-footer">Belajar sambil bermain bersama DCdhina collection.</footer>
      </main>
    );
  }

  return (
    <main className={`game-screen level-theme-${selectedLevel} ${shake ? "screen-shake" : ""}`}>
      <DoodleBackground />
      <ConfettiBurst burstKey={burstKey} />
      <header className="game-header">
        <button className="game-brand" onClick={goHome} aria-label="Kembali ke beranda"><span>DC</span>dhina</button>
        <div className="game-stats">
          <div className="score-display"><Star size={19} fill="currentColor" /><span>{score.toLocaleString("id-ID")}</span></div>
          <div className="lives" aria-label={`${lives} nyawa tersisa`}>
            {[0, 1, 2].map((heart) => <Heart key={heart} size={21} fill={heart < lives ? "currentColor" : "none"} className={heart < lives ? "alive" : "lost"} />)}
          </div>
        </div>
        <div className="game-controls">
          <button className="icon-button" onClick={toggleSound} aria-label={soundOn ? "Matikan suara" : "Nyalakan suara"}>{soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
          <button className="icon-button" onClick={() => setScreen("paused")} aria-label="Jeda permainan"><Pause size={20} /></button>
        </div>
      </header>

      <div className="round-progress" aria-label={`Soal ${questionIndex + 1} dari ${questions.length}`}>
        {questions.map((question, index) => <span key={question.id} className={index < questionIndex ? "done" : index === questionIndex ? "current" : ""} />)}
      </div>

      <section className="game-content">
        <div className="round-label">
          <span style={{ background: currentLevel.color }}>Level {selectedLevel}</span>
          <strong>{currentLevel.label}</strong>
          {combo >= 2 && <motion.em initial={{ scale: 0 }} animate={{ scale: 1 }}>Combo x{combo}</motion.em>}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            className="question-stage"
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -28, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <div className="question-copy">
              <p>{currentQuestion?.kind === "sentence" ? "Lengkapi kalimat ini" : currentQuestion?.kind === "word" ? "Pilih kata yang tepat" : "Dengar dan pasangkan"}</p>
              {currentQuestion?.kind === "letter" && <div className="letter-display">{currentQuestion.display}</div>}
              {currentQuestion?.kind === "syllable" && <div className="syllable-display">{currentQuestion.display}</div>}
              {currentQuestion?.kind === "word" && (
                <div className="picture-question">
                  <span className="picture-icon"><Picture name={currentQuestion.picture!} /></span>
                  <strong>{currentQuestion.display}</strong>
                </div>
              )}
              {currentQuestion?.kind === "sentence" && <div className="sentence-display">{renderSentence(currentQuestion.display)}</div>}
              <button className="listen-button" onClick={() => { playSfx("tap"); speak(currentQuestion.speech); }}>
                <Volume2 size={21} /> Dengarkan <span>Spasi</span>
              </button>
            </div>

            <div className="answers" aria-label="Pilihan jawaban">
              {currentQuestion?.options.map((option, index) => {
                const correctOption = feedback && option === currentQuestion.answer;
                const wrongChoice = feedback === "wrong" && chosenIndex === index;
                return (
                  <motion.button
                    key={option}
                    className={`answer-button ${OPTION_COLORS[index]} ${correctOption ? "is-correct" : ""} ${wrongChoice ? "is-wrong" : ""} ${feedback && !correctOption && !wrongChoice ? "is-muted" : ""}`}
                    onClick={() => handleChoice(index)}
                    whileTap={{ scale: 0.96 }}
                    disabled={Boolean(feedback)}
                  >
                    <span className="key-number">{index + 1}</span>
                    <strong>{option}</strong>
                    {correctOption && <Check size={24} />}
                    {wrongChoice && <X size={24} />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="timer-track" aria-label="Waktu menjawab"><motion.span animate={{ width: `${timeLeft}%` }} transition={{ duration: 0.1, ease: "linear" }} /></div>
      </section>

      <AnimatePresence>
        {feedback && (
          <motion.div className={`feedback-toast ${feedback}`} initial={{ opacity: 0, y: 30, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {feedback === "correct" ? <><Star fill="currentColor" /> Hebat!</> : <><RotateCcw /> Hampir tepat!</>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === "paused" && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title" initial={{ y: 24, scale: 0.94 }} animate={{ y: 0, scale: 1 }}>
              <span className="modal-icon"><Pause size={34} /></span>
              <p>Tarik napas dulu</p>
              <h2 id="pause-title">Permainan dijeda</h2>
              <p className="modal-description">Skor dan jawabanmu aman. Tekan P untuk lanjut.</p>
              <button className="primary-button" onClick={() => { locked.current = false; setScreen("playing"); playSfx("tap"); }}><Play size={20} fill="currentColor" /> Lanjut bermain</button>
              <button className="text-button" onClick={goHome}><Home size={18} /> Kembali ke beranda</button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {screen === "result" && (
          <motion.div className="modal-backdrop result-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.section className="game-modal result-modal" role="dialog" aria-modal="true" aria-labelledby="result-title" initial={{ y: 30, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", damping: 18 }}>
              <Mascot compact />
              <p>{won ? "Bintang baru didapat" : "Jangan menyerah"}</p>
              <h2 id="result-title">{won ? (selectedLevel === 4 ? "Lulus jadi Bintang Baca!" : "Level ditaklukkan!") : "Permainan selesai"}</h2>
              <p className="modal-description">{won ? "Bacaanmu makin hebat. Teruskan petualanganmu." : "Telinga dan mata kita sedang berlatih. Ayo coba sekali lagi."}</p>
              <div className="result-stats">
                <span><small>Skor</small><strong>{resultScore.toLocaleString("id-ID")}</strong></span>
                <span><small>Combo terbaik</small><strong>x{bestCombo}</strong></span>
              </div>
              {won && selectedLevel < 4 ? (
                <button className="primary-button" onClick={() => startGame(selectedLevel + 1)}>Lanjut level {selectedLevel + 1}<ArrowRight size={20} /></button>
              ) : <button className="primary-button" onClick={() => startGame()}><RotateCcw size={20} /> Main lagi</button>}
              <button className="text-button" onClick={goHome}><Home size={18} /> Lihat papan bintang</button>
              <small className="restart-hint">Tekan R untuk ulangi seketika</small>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}