import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const quotes = [
  {
    text: "집중은 선택의 결과가 아니라 습관의 결과다.",
    author: "스티븐 코비",
  },
  {
    text: "오늘의 작은 노력이 내일의 큰 성과를 만든다.",
    author: "데일 카네기",
  },
  {
    text: "완벽한 계획보다 실행하는 작은 행동이 중요하다.",
    author: "토니 로빈스",
  },
  { text: "시작이 반이다. 지금 바로 시작하라.", author: "아리스토텔레스" },
  {
    text: "성공은 매일의 작은 승리로 이루어진다.",
    author: "로버트 콜리어",
  },
  { text: "행동은 모든 성공의 기초이다.", author: "파블로 피카소" },
  { text: "할 수 있다고 믿으면 이미 절반은 이룬 것이다.", author: "시어도어 루즈벨트" },
];

export function QuoteSection() {
  const [quote, setQuote] = useState(quotes[0]);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const changeQuote = () => {
    setIsChanging(true);
    setTimeout(() => {
      const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(newQuote);
      setIsChanging(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto px-8 py-12"
    >
      <motion.div
        onClick={changeQuote}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-blue-50/40 backdrop-blur-sm rounded-3xl p-8 border border-purple-100/50 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-200/20 to-cyan-200/20 rounded-full blur-3xl" />

        <motion.div
          animate={{ opacity: isChanging ? 0 : 1, y: isChanging ? -10 : 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10"
        >
          <p className="text-center text-foreground/80 italic leading-relaxed mb-4">
            "{quote.text}"
          </p>
          <p className="text-center text-muted-foreground">
            - {quote.author}
          </p>
        </motion.div>

        {/* Refresh icon hint */}
        <motion.div
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
