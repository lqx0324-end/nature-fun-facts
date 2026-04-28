const AI = {
  _factsCache: null,

  async loadFacts() {
    if (this._factsCache) return this._factsCache;
    try {
      const resp = await fetch('data/facts.json');
      if (resp.ok) {
        this._factsCache = await resp.json();
        return this._factsCache;
      }
    } catch {
      // fetch failed
    }
    this._factsCache = [];
    return this._factsCache;
  },

  async getDailyFact() {
    const facts = await this.loadFacts();
    if (facts.length === 0) return null;
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / 86400000
    );
    return facts[dayOfYear % facts.length];
  },

  async getRandomFact() {
    const facts = await this.loadFacts();
    if (facts.length === 0) return null;
    return facts[Math.floor(Math.random() * facts.length)];
  },

  async getNewFact() {
    const apiKey = Storage.getApiKey();
    const provider = Storage.getApiProvider();

    if (apiKey) {
      try {
        const fact = await this.generateFact(provider, apiKey);
        if (fact) return fact;
      } catch {
        // AI 调用失败，静默降级
      }
    }

    return this.getRandomFact();
  },

  // 图片缓存 { factId: imageUrl }
  _imageCache: {},

  async fetchImage(fact) {
    if (this._imageCache[fact.id]) return this._imageCache[fact.id];

    const prompt = fact.image_prompt || fact.search_term || fact.answer;
    if (!prompt) return null;

    const seed = this._hashSeed(fact.id);
    const imageUrl = `/api/image?prompt=${encodeURIComponent(prompt)}&width=400&height=267&seed=${seed}`;

    this._imageCache[fact.id] = imageUrl;
    return imageUrl;
  },

  _hashSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  },

  async generateFact(provider, apiKey) {
    const prompt = `请生成一条关于动植物的有趣冷知识，以JSON格式返回，严格遵循以下结构，不要添加任何其他文字：
{
  "id": "ai_${Date.now()}",
  "question": "一个悬念式的问题，让人好奇想点开（20字以内）",
  "answer": "答案名称（动物/植物/关系名，10字以内）",
  "explanation": "详细解释，2-3句话，生动有趣（100字以内）",
  "category": "动物|植物|共生关系|极端生存",
  "image_prompt": "English prompt for generating an illustration of this fact"
}

要求：
1. 知识必须真实准确，不要编造
2. question 要有悬念感，不要直接说出答案
3. 每次生成不同的知识，尽量覆盖不同类别
4. category 只能是：动物、植物、共生关系、极端生存`;

    let url, headers, body;

    if (provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      body = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300,
      });
    } else {
      url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
      });
    }

    const resp = await fetch(url, { method: 'POST', headers, body });
    if (!resp.ok) throw new Error(`API error: ${resp.status}`);

    const data = await resp.json();
    let text;

    if (provider === 'openai') {
      text = data.choices[0].message.content;
    } else {
      text = data.candidates[0].content.parts[0].text;
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const fact = JSON.parse(jsonMatch[0]);
    if (!fact.question || !fact.answer || !fact.explanation || !fact.category) {
      throw new Error('Missing required fields');
    }

    return fact;
  },
};