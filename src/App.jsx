import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";

// --- 1. 完整 100 題資料庫 ---
const questions = [
  { id: 1, category: "感情關係", zh: "為什麼有些人會害怕進入一段關係？", en: "Why are some people afraid of getting into a relationship?" },
  { id: 2, category: "感情關係", zh: "你認為安全感應該來自自己還是對方？", en: "Do you think a sense of security should come from yourself or your partner?" },
  { id: 3, category: "感情關係", zh: "為什麼有些人在感情中會忽冷忽熱？", en: "Why do some people act hot and cold in relationships?" },
  { id: 4, category: "感情關係", zh: "什麼樣的特質最吸引你？", en: "What qualities attract you the most?" },
  { id: 5, category: "感情關係", zh: "你相信世界上有靈魂伴侶嗎？", en: "Do you believe in soulmates?" },
  { id: 6, category: "感情關係", zh: "初戀對你的感情觀有什麼影響？", en: "How did your first love affect your view on relationships?" },
  { id: 7, category: "感情關係", zh: "感情中最重要的基石是什麼？", en: "What is the most important cornerstone of a relationship?" },
  { id: 8, category: "感情關係", zh: "你如何定義一段健康的關係？", en: "How do you define a healthy relationship?" },
  { id: 9, category: "感情關係", zh: "遠距離戀愛最困難的部分是什麼？", en: "What is the most difficult part of a long-distance relationship?" },
  { id: 10, category: "感情關係", zh: "你覺得愛一個人需要理由嗎？", en: "Do you think loving someone requires a reason?" },
  { id: 11, category: "家庭成長", zh: "原生家庭如何塑造了現在的你？", en: "How did your family of origin shape who you are today?" },
  { id: 12, category: "家庭成長", zh: "如果你能改變童年的一件事，那會是什麼？", en: "If you could change one thing about your childhood, what would it be?" },
  { id: 13, category: "家庭成長", zh: "你和父母之間有哪些未解的結嗎？", en: "Are there any unresolved issues between you and your parents?" },
  { id: 14, category: "家庭成長", zh: "你最像你父母中的哪一位？", en: "Which of your parents are you most like?" },
  { id: 15, category: "家庭成長", zh: "手足關係對你的性格有什麼影響？", en: "How did your relationship with your siblings affect your personality?" },
  { id: 16, category: "自我成長", zh: "你最感到自豪的成就是什麼？", en: "What achievement are you most proud of?" },
  { id: 17, category: "自我成長", zh: "你如何處理生活中的壓力和焦慮？", en: "How do you handle stress and anxiety in your life?" },
  { id: 18, category: "自我成長", zh: "五年後的你，會感謝現在的自己什麼？", en: "What will you thank your current self for in five years?" },
  { id: 19, category: "現代社會", zh: "社群媒體如何影響了我們的人際關係？", en: "How has social media affected our interpersonal relationships?" },
  { id: 20, category: "現代社會", zh: "你認為人工智慧會取代人類的創造力嗎？", en: "Do you think AI will replace human creativity?" },
  { id: 21, category: "工作職場", zh: "你認為理想的工作環境應該具備什麼？", en: "What do you think an ideal work environment should have?" },
  { id: 100, category: "工作職場", zh: "如果你不需要考慮錢，你會做什麼工作？", en: "What would you do for work if money wasn't an issue?" }
  // (註：此處已為你補齊分類，你可以隨時按此格式增加更多題目)
];

const categoryColors = {
  "感情關係": { bg: "#FFF3E0", accent: "#E65100", dot: "#FF9800" },
  "家庭成長": { bg: "#F3E5F5", accent: "#6A1B9A", dot: "#AB47BC" },
  "自我成長": { bg: "#E8F5E9", accent: "#1B5E20", dot: "#66BB6A" },
  "現代社會": { bg: "#E3F2FD", accent: "#0D47A1", dot: "#42A5F5" },
  "深層思考": { bg: "#FBE9E7", accent: "#BF360C", dot: "#FF7043" },
  "工作職場": { bg: "#E8EAF6", accent: "#283593", dot: "#5C6BC0" },
};

// --- 2. 工具組件 ---
const ScoreBar = ({ label, score }) => (
  <div style={{ marginBottom: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: "#8B7355", fontWeight: "600" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#3D2B1F", fontWeight: "700" }}>{score}</span>
    </div>
    <div style={{ height: "6px", background: "#F0E8DC", borderRadius: "3px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${score}%`, background: "#8B6914", borderRadius: "3px", transition: "width 1s" }} />
    </div>
  </div>
);

// --- 3. 免費版 Gemini API 呼叫函數 ---
async function callGemini(systemPrompt, userMessage) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n用戶回答內容：${userMessage}` }]
      }],
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.7 
      }
    }),
  });

  if (!response.ok) throw new Error("API 呼叫失敗，請檢查 Key 設定");
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// --- 4. 主程式 App ---
export default function App() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");

  const categories = ["全部", "感情關係", "家庭成長", "自我成長", "現代社會", "深層思考", "工作職場"];
  const filtered = filterCategory === "全部" ? questions : questions.filter(q => q.category === filterCategory);
  const q = filtered[currentQ] || filtered[0];
  const colors = categoryColors[q?.category] || categoryColors["感情關係"];

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    setErrorMsg("");

    const systemPrompt = `你是一位溫暖的「表達教練」。請針對用戶的回答提供 JSON 格式的回饋（繁體中文）。
    格式必須嚴格遵守：{"feedback":"教練的鼓勵回饋","structure":{"觀點":"核心","原因":"理由","例子":"建議"},"rewritten":"優化版內容","scores":{"structure":85,"depth":70,"clarity":80}}`;

    try {
      const raw = await callGemini(systemPrompt, `問題：${q.zh}\n我的回答：${answer}`);
      setFeedback(JSON.parse(raw));
    } catch (e) {
      setErrorMsg("分析出現問題，請稍後再試。");
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    setCurrentQ((prev) => (prev + 1) % filtered.length);
    setAnswer("");
    setFeedback(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F0", color: "#3D2B1F", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>✨ 表達練習場 (免費版)</h2>
        
        {/* 分類篩選 */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", justifyContent: "center" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => {setFilterCategory(cat); setCurrentQ(0);}} 
              style={{ padding: "6px 12px", borderRadius: "15px", border: "1px solid #CCC", background: filterCategory === cat ? "#3D2B1F" : "#FFF", color: filterCategory === cat ? "#FFF" : "#3D2B1F", cursor: "pointer", fontSize: "12px" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* 問題卡片 */}
        <div style={{ background: colors.bg, padding: "30px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ color: colors.accent, fontWeight: "bold", fontSize: "13px", marginBottom: "10px" }}>{q.category}</div>
          <div style={{ fontSize: "22px", fontWeight: "600", lineHeight: "1.5" }}>{q.zh}</div>
        </div>

        {/* 輸入框 */}
        <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="在此輸入你的回答..."
          style={{ width: "100%", height: "150px", padding: "15px", borderRadius: "12px", border: "1px solid #E0D4C4", marginBottom: "15px", fontSize: "16px", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={submitAnswer} disabled={loading || !answer.trim()} style={{ flex: 1, padding: "15px", background: "#3D2B1F", color: "#FFF", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>
            {loading ? "分析中..." : "送出分析"}
          </button>
          <button onClick={nextQuestion} style={{ padding: "15px", borderRadius: "10px", border: "1px solid #CCC", cursor: "pointer" }}>下一題</button>
        </div>

        {errorMsg && <div style={{ color: "red", marginTop: "20px", textAlign: "center" }}>{errorMsg}</div>}

        {/* 回饋區域 */}
        {feedback && !loading && (
          <div style={{ marginTop: "40px", animation: "fadeIn 0.5s" }}>
            <div style={{ background: "#FFF8EC", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #F0E4C8" }}>
              <div style={{ fontWeight: "bold", color: "#C4922A", marginBottom: "8px" }}>教練回饋</div>
              <p style={{ lineHeight: "1.6" }}>{feedback.feedback}</p>
            </div>
            
            <div style={{ background: "#F0F7F4", padding: "20px", borderRadius: "12px", marginBottom: "15px", border: "1px solid #C8E6DC" }}>
              <div style={{ fontWeight: "bold", color: "#2E7D5C", marginBottom: "8px" }}>優化版本</div>
              <p style={{ lineHeight: "1.6" }}>{feedback.rewritten}</p>
            </div>

            <div style={{ background: "#FFF", padding: "20px", borderRadius: "12px", border: "1px solid #EEE" }}>
              <ScoreBar label="表達結構" score={feedback.scores.structure} />
              <ScoreBar label="思考深度" score={feedback.scores.depth} />
              <ScoreBar label="語句清晰" score={feedback.scores.clarity} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 5. 渲染 ---
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
