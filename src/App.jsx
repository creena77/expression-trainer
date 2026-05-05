import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";

// --- 1. 資料與設定 ---
const questions = [
  { id: 1, category: "感情關係", zh: "為什麼有些人會害怕進入一段關係？", en: "Why are some people afraid of getting into a relationship?" },
  { id: 2, category: "感情關係", zh: "你認為安全感應該來自自己還是對方？", en: "Do you think a sense of security should come from yourself or your partner?" },
  { id: 3, category: "感情關係", zh: "為什麼有些人在感情中會忽冷忽熱？", en: "Why do some people act hot and cold in relationships?" },
  { id: 100, category: "工作職場", zh: "五年後，你希望自己在工作上處於什麼位置？", en: "Where do you hope to be professionally in five years?" }
];

const categoryColors = {
  "感情關係": { bg: "#FFF3E0", accent: "#E65100", dot: "#FF9800" },
  "家庭成長": { bg: "#F3E5F5", accent: "#6A1B9A", dot: "#AB47BC" },
  "自我成長": { bg: "#E8F5E9", accent: "#1B5E20", dot: "#66BB6A" },
  "現代社會": { bg: "#E3F2FD", accent: "#0D47A1", dot: "#42A5F5" },
  "深層思考": { bg: "#FBE9E7", accent: "#BF360C", dot: "#FF7043" },
  "工作職場": { bg: "#E8EAF6", accent: "#283593", dot: "#5C6BC0" },
};

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

// --- 2. 免費版 Gemini API 呼叫函數 ---
async function callGemini(systemPrompt, userMessage) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
  // 使用 Google Gemini 1.5 Flash 模型 (目前免費額度最高)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${systemPrompt}\n\n用戶回答內容：${userMessage}` }]
      }],
      generationConfig: { responseMimeType: "application/json" }
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API 發生錯誤，請檢查 Key 是否正確。`);
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// --- 3. 主程式 App ---
export default function App() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [animateIn, setAnimateIn] = useState(true);
  const [filterCategory, setFilterCategory] = useState("全部");
  const feedbackRef = useRef(null);

  const categories = ["全部", "感情關係", "家庭成長", "自我成長", "現代社會", "深層思考", "工作職場"];
  const filtered = filterCategory === "全部" ? questions : questions.filter(q => q.category === filterCategory);
  const q = filtered[currentQ] || filtered[0];
  const colors = categoryColors[q?.category] || categoryColors["感情關係"];

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    setErrorMsg("");

    const systemPrompt = `你是一位「表達教練」。請針對用戶的回答提供 JSON 格式的回饋。
    格式：{"feedback":"溫暖的回饋","structure":{"觀點":"核心","原因":"理由","例子":"建議"},"rewritten":"優化版","scores":{"structure":85,"depth":70,"clarity":80}}`;

    try {
      const raw = await callGemini(systemPrompt, `問題：${q.zh}\n我的回答：${answer}`);
      setFeedback(JSON.parse(raw));
    } catch (e) {
      setErrorMsg("分析失敗，請確認 API Key 設定正確。");
    }
    setLoading(false);
  };

  const goToQuestion = (idx) => {
    setAnimateIn(false);
    setTimeout(() => {
      setCurrentQ(idx);
      setAnswer("");
      setFeedback(null);
      setErrorMsg("");
      setAnimateIn(true);
    }, 200);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F0", fontFamily: "sans-serif", color: "#3D2B1F" }}>
      {/* 介面部分與之前相同 */}
      <div style={{ borderBottom: "1px solid #E8DDD0", padding: "16px 24px", display: "flex", justifyContent: "space-between", background: "#FBF7F0", sticky: "top" }}>
        <div style={{ fontWeight: "700" }}>免費版表達練習場</div>
        <div style={{ display: "flex", gap: "5px" }}>
          {categories.slice(0, 4).map(cat => (
            <button key={cat} onClick={() => { setFilterCategory(cat); goToQuestion(0); }} style={{ fontSize: "10px", cursor: "pointer" }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ opacity: animateIn ? 1 : 0, transition: "0.3s" }}>
          <div style={{ background: colors.bg, padding: "24px", borderRadius: "12px", marginBottom: "20px" }}>
            <div style={{ fontSize: "20px", fontWeight: "600" }}>{q?.zh}</div>
          </div>

          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="在此輸入你的回答..."
            style={{ width: "100%", height: "120px", padding: "15px", borderRadius: "8px", border: "1px solid #E0D4C4", marginBottom: "15px", boxSizing: "border-box" }} />

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={submitAnswer} disabled={loading || !answer.trim()} style={{ flex: 1, padding: "12px", background: "#3D2B1F", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              {loading ? "分析中..." : "提交分析"}
            </button>
            <button onClick={() => goToQuestion(Math.floor(Math.random() * filtered.length))} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #CCC", cursor: "pointer" }}>隨機</button>
          </div>
        </div>

        {errorMsg && <div style={{ color: "red", marginTop: "20px" }}>{errorMsg}</div>}

        {feedback && !loading && (
          <div style={{ marginTop: "30px", borderTop: "1px solid #EEE", paddingTop: "20px" }}>
            <div style={{ background: "#FFF8EC", padding: "20px", borderRadius: "10px", marginBottom: "15px" }}>
              <strong>教練建議：</strong><p>{feedback.feedback}</p>
            </div>
            <div style={{ background: "#F0F7F4", padding: "20px", borderRadius: "10px" }}>
              <strong>優化版本：</strong><p>{feedback.rewritten}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
