import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";

// --- 1. 資料與設定 ---
const questions = [
  { id: 1, category: "感情關係", zh: "為什麼有些人會害怕進入一段關係？", en: "Why are some people afraid of getting into a relationship?" },
  { id: 2, category: "感情關係", zh: "你認為安全感應該來自自己還是對方？", en: "Do you think a sense of security should come from yourself or your partner?" },
  { id: 3, category: "感情關係", zh: "為什麼有些人在感情中會忽冷忽熱？", en: "Why do some people act hot and cold in relationships?" },
  // ... 為了節省空間，這裡縮略，請記得貼上你原本完整的 100 題 ...
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

// --- 2. 小組件 ---
const ScoreBar = ({ label, score }) => (
  <div style={{ marginBottom: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
      <span style={{ fontSize: "12px", color: "#8B7355", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "#3D2B1F", fontWeight: "700" }}>{score}</span>
    </div>
    <div style={{ height: "6px", background: "#F0E8DC", borderRadius: "3px", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${score}%`,
        background: score >= 75 ? "#8B6914" : score >= 50 ? "#C4922A" : "#D4956A",
        borderRadius: "3px", transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)"
      }} />
    </div>
  </div>
);

// --- 3. API 呼叫函數 ---
async function callClaude(systemPrompt, userMessage) {
  // 這裡正確讀取了你在 Vercel 設定的 API Key
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY; 

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620", 
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.content?.find(b => b.type === "text")?.text ?? "";
}

// --- 4. 主程式 App ---
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

  useEffect(() => {
    if ((feedback || errorMsg) && feedbackRef.current) {
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [feedback, errorMsg]);

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setFeedback(null);
    setErrorMsg("");

    const systemPrompt = `你是一位「表達教練」，不是批改作文的老師。你的風格是：
    - 溫暖但直接，像在喝咖啡聊天
    - 先肯定有價值的部分，再指出可以更好的地方
    - 不說「你這樣不對」，而是說「如果這樣說，會讓人更有感」
    - 幫助用戶看見自己思路的模樣，然後協助整理得更清晰

    請針對用戶的回答，用繁體中文輸出一個 JSON 物件，格式如下（只輸出 JSON，不要任何 markdown 包裝）：
    {"feedback":"2-4句教練風格回饋","structure":{"觀點":"核心主張","原因":"理由","例子":"具體例子或建議加例子","轉折":"有無轉折","結論":"結尾落點"},"rewritten":"優化版本100-150字","scores":{"structure":85,"depth":70,"clarity":80}}`;

    try {
      const raw = await callClaude(systemPrompt, `問題：${q.zh}\n\n我的回答：${answer}`);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setFeedback(parsed);
    } catch (e) {
      setErrorMsg(e.message);
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
    <div style={{ minHeight: "100vh", background: "#FBF7F0", fontFamily: "'Georgia', 'Noto Serif TC', serif", color: "#3D2B1F" }}>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} } textarea:focus { outline: none; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #E8DDD0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FBF7F0", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.02em" }}>表達練習場</div>
          <div style={{ fontSize: "11px", color: "#A08878", letterSpacing: "0.1em", marginTop: "1px" }}>EXPRESSION TRAINING</div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => { setFilterCategory(cat); goToQuestion(0); }}
              style={{
                padding: "5px 10px", borderRadius: "20px",
                border: filterCategory === cat ? "1.5px solid #8B6914" : "1.5px solid #E0D4C4",
                background: filterCategory === cat ? "#8B6914" : "transparent",
                color: filterCategory === cat ? "#FBF7F0" : "#8B7355",
                fontSize: "11px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap"
              }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(8px)", transition: "all 0.3s ease" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.dot }} />
            <span style={{ fontSize: "12px", color: colors.accent, fontWeight: "600", letterSpacing: "0.08em" }}>{q?.category}</span>
            <span style={{ fontSize: "12px", color: "#C4B5A5", marginLeft: "auto" }}>{currentQ + 1} / {filtered.length}</span>
          </div>

          <div style={{ background: colors.bg, borderRadius: "16px", padding: "32px", marginBottom: "24px", borderLeft: `4px solid ${colors.dot}` }}>
            <div style={{ fontSize: "22px", lineHeight: "1.6", fontWeight: "600", marginBottom: "16px" }}>{q?.zh}</div>
            <div style={{ fontSize: "14px", color: "#A08878", lineHeight: "1.5", fontStyle: "italic" }}>{q?.en}</div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="用你自己的話回答這個問題，中文英文都可以..."
              style={{
                width: "100%", minHeight: "140px", padding: "20px", borderRadius: "12px",
                border: "1.5px solid #E0D4C4", background: "#FDFAF5", fontSize: "15px",
                lineHeight: "1.7", color: "#3D2B1F", fontFamily: "inherit",
                resize: "vertical", boxSizing: "border-box", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "#8B6914"}
              onBlur={e => e.target.style.borderColor = "#E0D4C4"}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={submitAnswer} disabled={loading || !answer.trim()}
              style={{
                flex: 1, padding: "14px 24px", borderRadius: "10px", border: "none",
                background: !loading && answer.trim() ? "#3D2B1F" : "#C4B5A5",
                color: "#FBF7F0", fontSize: "14px", fontWeight: "600",
                cursor: !loading && answer.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit", letterSpacing: "0.05em",
              }}>
              {loading ? "分析中..." : "✦ 提交分析"}
            </button>
            <button onClick={() => goToQuestion(Math.floor(Math.random() * filtered.length))}
              style={{
                padding: "14px 18px", borderRadius: "10px", border: "1.5px solid #E0D4C4",
                background: "#FDFAF5", color: "#8B7355", fontSize: "14px",
                cursor: "pointer", fontFamily: "inherit",
              }}>↻ 隨機</button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#A08878" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px", display: "inline-block", animation: "spin 1.5s linear infinite" }}>⟳</div>
            <div style={{ fontSize: "14px" }}>教練正在仔細聆聽你的回答...</div>
          </div>
        )}

        {errorMsg && (
          <div ref={feedbackRef} style={{ marginTop: "24px", background: "#FFF0F0", border: "1.5px solid #FFCCCC", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "13px", color: "#CC3333", fontWeight: "600", marginBottom: "6px" }}>⚠ 發生錯誤</div>
            <div style={{ fontSize: "13px", color: "#993333", wordBreak: "break-all" }}>{errorMsg}</div>
          </div>
        )}

        {feedback && !loading && (
          <div ref={feedbackRef} style={{ marginTop: "32px", animation: "fadeUp 0.5s ease forwards" }}>
            <div style={{ background: "#FFF8EC", borderRadius: "14px", padding: "24px", marginBottom: "16px", border: "1.5px solid #F0E4C8" }}>
              <div style={{ fontSize: "11px", color: "#C4922A", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "12px" }}>✦ 教練回饋</div>
              <div style={{ fontSize: "15px", lineHeight: "1.8" }}>{feedback.feedback}</div>
            </div>
            {feedback.structure && Object.keys(feedback.structure).length > 0 && (
              <div style={{ background: "#F7F4EF", borderRadius: "14px", padding: "24px", marginBottom: "16px", border: "1.5px solid #E8DDD0" }}>
                <div style={{ fontSize: "11px", color: "#8B6914", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "16px" }}>◈ 思路結構拆解</div>
                {Object.entries(feedback.structure).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: "14px", marginBottom: "12px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "11px", color: "#FBF7F0", background: "#8B6914", padding: "3px 8px", borderRadius: "4px", fontWeight: "700", whiteSpace: "nowrap", marginTop: "2px" }}>{k}</span>
                    <span style={{ fontSize: "14px", color: "#5C4A3A", lineHeight: "1.6" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {feedback.rewritten && (
              <div style={{ background: "#F0F7F4", borderRadius: "14px", padding: "24px", marginBottom: "16px", border: "1.5px solid #C8E6DC" }}>
                <div style={{ fontSize: "11px", color: "#2E7D5C", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "12px" }}>✎ 優化版本</div>
                <div style={{ fontSize: "15px", lineHeight: "1.85" }}>{feedback.rewritten}</div>
              </div>
            )}
            {feedback.scores && (
              <div style={{ background: "#FDFAF5", borderRadius: "14px", padding: "24px", marginBottom: "24px", border: "1.5px solid #E8DDD0" }}>
                <div style={{ fontSize: "11px", color: "#8B7355", fontWeight: "700", letterSpacing: "0.12em", marginBottom: "16px" }}>◎ 表達評分</div>
                <ScoreBar label="結構 Structure" score={feedback.scores.structure} />
                <ScoreBar label="深度 Depth" score={feedback.scores.depth} />
                <ScoreBar label="清晰 Clarity" score={feedback.scores.clarity} />
              </div>
            )}
            <button onClick={() => goToQuestion((currentQ + 1) % filtered.length)}
              style={{
                width: "100%", padding: "16px", borderRadius: "10px",
                border: "1.5px solid #3D2B1F", background: "transparent", color: "#3D2B1F",
                fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em",
              }}> 下一題 → </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 5. 最後的渲染 (發動鈕) ---
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
