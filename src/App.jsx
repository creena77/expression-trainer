async function callClaude(systemPrompt, userMessage) {
  // 使用 Vite 的環境變數讀取方式
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY; 
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey, // 從環境變數讀取
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620", // 建議檢查模型名稱是否正確
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  // ...其餘邏輯不變
}
