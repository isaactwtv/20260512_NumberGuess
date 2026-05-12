/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, RotateCcw, Info, Trophy, Timer, History as HistoryIcon, Trash2 } from 'lucide-react';

// --- Types ---

interface GameState {
  target: number;
  attempts: number;
  minRange: number;
  maxRange: number;
  message: string;
  isWon: boolean;
  lastGuess: number | null;
  startTime: number | null;
}

interface HistoryRecord {
  id: string;
  date: string;
  attempts: number;
  duration: number; // in seconds
}

// --- Constants ---

const INITIAL_MIN = 1;
const INITIAL_MAX = 100;

export default function App() {
  // --- States ---
  
  const [gameState, setGameState] = useState<GameState>({
    target: Math.floor(Math.random() * INITIAL_MAX) + INITIAL_MIN,
    attempts: 0,
    minRange: INITIAL_MIN,
    maxRange: INITIAL_MAX,
    message: '在下方輸入你的幸運數字吧！',
    isWon: false,
    lastGuess: null,
    startTime: null,
  });

  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    const saved = localStorage.getItem('guess_game_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const startNewGame = () => {
    setGameState({
      target: Math.floor(Math.random() * INITIAL_MAX) + INITIAL_MIN,
      attempts: 0,
      minRange: INITIAL_MIN,
      maxRange: INITIAL_MAX,
      message: '遊戲已重置，請開始猜測！',
      isWon: false,
      lastGuess: null,
      startTime: null,
    });
    setInputValue('');
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    if (confirm('確定要清除所有紀錄嗎？')) {
      setHistory([]);
      localStorage.removeItem('guess_game_history');
    }
  };

  const handleGuess = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (gameState.isWon || !inputValue) return;

    const numGuess = parseInt(inputValue);
    const currentTime = Date.now();
    const isFirstGuess = gameState.attempts === 0;
    const gameStartTime = isFirstGuess ? currentTime : gameState.startTime;

    // Basic Validation
    if (isNaN(numGuess)) {
      setGameState(prev => ({ ...prev, message: '請輸入有效的數字！' }));
      return;
    }

    if (numGuess < INITIAL_MIN || numGuess > INITIAL_MAX) {
      setGameState(prev => ({ ...prev, message: `請輸入 ${INITIAL_MIN}~${INITIAL_MAX} 之間的數字` }));
      return;
    }

    if (numGuess < gameState.minRange || numGuess > gameState.maxRange) {
      setGameState(prev => ({ ...prev, message: `輸入錯誤！請輸入 ${gameState.minRange}~${gameState.maxRange} 之間的數字` }));
      setInputValue('');
      inputRef.current?.focus();
      return;
    }

    const newAttempts = gameState.attempts + 1;
    let newMessage = '';
    let newMin = gameState.minRange;
    let newMax = gameState.maxRange;
    let won = false;

    if (numGuess === gameState.target) {
      newMessage = `恭喜！猜對了！你一共猜了 ${newAttempts} 次。`;
      won = true;

      // Update History
      const durationSeconds = Math.floor((currentTime - (gameStartTime || currentTime)) / 1000);
      const newRecord: HistoryRecord = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        attempts: newAttempts,
        duration: Math.max(1, durationSeconds),
      };

      const updatedHistory = [newRecord, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('guess_game_history', JSON.stringify(updatedHistory));
    } else if (numGuess > gameState.target) {
      newMessage = '太大了！';
      newMax = Math.min(newMax, Math.max(gameState.minRange, numGuess - 1));
    } else {
      newMessage = '太小了！';
      newMin = Math.max(newMin, Math.min(gameState.maxRange, numGuess + 1));
    }

    setGameState(prev => ({
      ...prev,
      attempts: newAttempts,
      minRange: newMin,
      maxRange: newMax,
      message: newMessage,
      isWon: won,
      lastGuess: numGuess,
      startTime: gameStartTime,
    }));

    setInputValue('');
    inputRef.current?.focus();
  };

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getStatusEmoji = () => {
    if (gameState.isWon) return '🎉';
    if (gameState.lastGuess === null) return '🤔';
    if (gameState.message.includes('太大了')) return '📉';
    if (gameState.message.includes('太小了')) return '📈';
    return '🧐';
  };

  return (
    <div className="w-full h-screen bg-[#F0FDF4] flex flex-col font-sans text-slate-800 overflow-y-auto">
      {/* Header Section */}
      <header className="w-full pt-12 flex flex-col items-center flex-shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-400 text-white px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-4 shadow-lg"
        >
          經典益智遊戲
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight text-center px-4"
        >
          猜數字 <span className="text-emerald-500">1-100</span>
        </motion.h1>
      </header>

      {/* Main Game Dashboard */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-8 space-y-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white w-full max-w-4xl min-h-[450px] rounded-[40px] lush-shadow border-8 border-emerald-500/10 flex flex-col md:flex-row overflow-hidden flex-shrink-0"
        >
          
          {/* Left Side: Status and Stats */}
          <div className="w-full md:w-1/2 bg-emerald-50 p-8 md:p-12 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-emerald-100">
            <div>
              <p className="text-emerald-600 font-bold text-xl mb-4">目前的數字範圍</p>
              <div className="flex items-center gap-4">
                <div className="bg-white border-4 border-emerald-500 rounded-3xl h-24 flex-1 flex items-center justify-center lush-shadow">
                  <span className="text-4xl font-black text-slate-900">{gameState.minRange}</span>
                </div>
                <span className="text-3xl font-bold text-emerald-400">~</span>
                <div className="bg-white border-4 border-emerald-500 rounded-3xl h-24 flex-1 flex items-center justify-center lush-shadow">
                  <span className="text-4xl font-black text-slate-900">{gameState.maxRange}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-8 md:mt-0">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <Trophy className="w-5 h-5 text-emerald-500" />
                  <span>猜測次數</span>
                </div>
                <span className="text-2xl font-black text-emerald-600">
                  {gameState.attempts.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span className="text-xl font-bold text-orange-500">#</span>
                  <span>上次猜測</span>
                </div>
                <span className="text-2xl font-black text-orange-500">
                  {gameState.lastGuess !== null ? gameState.lastGuess : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Interaction Area */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-white relative">
            <div className="mb-8 text-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={getStatusEmoji()}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl mb-4"
                >
                  {getStatusEmoji()}
                </motion.div>
              </AnimatePresence>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <h2 className={`text-3xl font-black ${gameState.isWon ? 'text-emerald-500' : 'text-slate-800'}`}>
                    {gameState.isWon ? '恭喜！' : gameState.message.split('！')[0] + (gameState.message.includes('！') ? '！' : '')}
                  </h2>
                  <p className="text-slate-400 text-lg">
                    {gameState.isWon ? '你贏得了這場挑戰！' : '再試一個數字...'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="w-full flex flex-col gap-4">
              {!gameState.isWon ? (
                <form onSubmit={handleGuess} className="w-full flex flex-col gap-4">
                  <input 
                    ref={inputRef}
                    type="number" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="輸入 1-100"
                    disabled={gameState.isWon}
                    className="w-full bg-slate-100 border-none rounded-3xl p-6 text-3xl font-bold text-center focus:ring-4 focus:ring-emerald-500/20 outline-none placeholder:text-slate-300 transition-all"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-2xl py-6 rounded-3xl button-push-emerald"
                  >
                    提交猜測
                  </button>
                </form>
              ) : (
                <button 
                  onClick={startNewGame}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black text-2xl py-6 rounded-3xl button-push-slate flex items-center justify-center gap-3"
                >
                  <RotateCcw className="w-6 h-6" />
                  重新開始
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* History Section */}
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-white/60 backdrop-blur-md rounded-[32px] p-8 lush-shadow border border-white/40"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <HistoryIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800">最近 10 次挑戰紀錄</h3>
              </div>
              <button 
                onClick={clearHistory}
                className="text-slate-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                title="清除紀錄"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-sm font-bold uppercase tracking-wider">
                    <th className="pb-4 px-2">日期時間</th>
                    <th className="pb-4 px-2">猜測次數</th>
                    <th className="pb-4 px-2">耗費時間</th>
                    <th className="pb-4 px-2 text-right">評分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((record) => (
                    <motion.tr 
                      layout
                      key={record.id} 
                      className="group hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="py-4 px-2 font-medium text-slate-600">{record.date}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2 font-black text-slate-800">
                          <Trophy className="w-4 h-4 text-emerald-500" />
                          <span>{record.attempts} 次</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2 font-black text-slate-800">
                          <Timer className="w-4 h-4 text-orange-400" />
                          <span>{record.duration} 秒</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                          record.attempts <= 5 ? 'bg-emerald-100 text-emerald-600' :
                          record.attempts <= 10 ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {record.attempts <= 5 ? '大師' : record.attempts <= 10 ? '精英' : '一般'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer / Bottom Navigation */}
      <footer className="w-full pb-12 flex justify-center gap-4 md:gap-6 flex-shrink-0">
        <button 
          onClick={startNewGame}
          className="flex items-center gap-3 bg-white px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-slate-600 shadow-md hover:bg-slate-50 transition-all active:scale-95"
        >
          <RefreshCcw className="w-5 h-5" />
          重置遊戲
        </button>
        <button className="flex items-center gap-3 bg-slate-800 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-white shadow-md hover:bg-slate-900 transition-all active:scale-95">
          <Info className="w-5 h-5" />
          遊戲說明
        </button>
      </footer>
    </div>
  );
}

