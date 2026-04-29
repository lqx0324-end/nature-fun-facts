const Quiz = {
  QUESTIONS_PER_ROUND: 10,

  _questions: [],
  _currentIndex: 0,
  _score: 0,
  _answered: false,

  start(allFacts) {
    this._questions = [];
    this._currentIndex = 0;
    this._score = 0;
    this._answered = false;

    const shuffled = [...allFacts].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(this.QUESTIONS_PER_ROUND, shuffled.length));

    selected.forEach(fact => {
      const options = this._generateOptions(fact, allFacts);
      this._questions.push({ fact, options, correctIndex: options.indexOf(fact.answer) });
    });

    this._renderQuestion();
  },

  _generateOptions(fact, allFacts) {
    const correct = fact.answer;
    const sameCategory = allFacts.filter(f => f.category === fact.category && f.answer !== correct);
    const others = allFacts.filter(f => f.category !== fact.category && f.answer !== correct);

    const shuffledSame = [...sameCategory].sort(() => Math.random() - 0.5);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    let distractors = shuffledSame.slice(0, 3).map(d => d.answer);
    if (distractors.length < 3) {
      distractors = distractors.concat(shuffledOthers.slice(0, 3 - distractors.length).map(d => d.answer));
    }

    const uniqueDistractors = [...new Set(distractors)].slice(0, 3);
    const options = [correct, ...uniqueDistractors];
    return options.sort(() => Math.random() - 0.5);
  },

  _renderQuestion() {
    const q = this._questions[this._currentIndex];
    const container = document.getElementById('page-container');
    const progress = (this._currentIndex / this._questions.length) * 100;
    const catColor = Card.categoryColors[q.fact.category] || 'var(--color-primary)';

    container.innerHTML = `
      <div class="page active" id="page-quiz">
        <div class="page-header">
          <h1>⚡ 知识挑战</h1>
          <p class="subtitle">第 ${this._currentIndex + 1} / ${this._questions.length} 题</p>
        </div>
        <div class="quiz-progress">
          <div class="quiz-progress-bar" style="width: ${progress}%"></div>
        </div>
        <div class="quiz-card">
          <span class="card-category" style="background: ${catColor}">${q.fact.category}</span>
          <p class="quiz-question">${q.fact.question}</p>
        </div>
        <div class="quiz-options" id="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}">${opt}</button>
          `).join('')}
        </div>
      </div>
    `;

    this._bindOptions();
  },

  _bindOptions() {
    const optionsEl = document.getElementById('quiz-options');
    if (!optionsEl) return;

    optionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-option');
      if (!btn || this._answered) return;

      this._answered = true;
      const chosenIndex = parseInt(btn.dataset.index);
      const q = this._questions[this._currentIndex];
      const isCorrect = chosenIndex === q.correctIndex;

      if (isCorrect) {
        this._score++;
        btn.classList.add('quiz-option--correct');
      } else {
        btn.classList.add('quiz-option--wrong');
        optionsEl.querySelectorAll('.quiz-option')[q.correctIndex].classList.add('quiz-option--correct');
      }

      optionsEl.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);

      setTimeout(() => {
        this._answered = false;
        this._currentIndex++;
        if (this._currentIndex < this._questions.length) {
          this._renderQuestion();
        } else {
          this._renderResult();
        }
      }, 1200);
    });
  },

  _renderResult() {
    const total = this._questions.length;
    const score = this._score;
    const percent = Math.round((score / total) * 100);
    const bestScore = Storage.getBestQuizScore();
    const isNewBest = score > bestScore;

    if (isNewBest) {
      Storage.saveBestQuizScore(score);
    }

    const container = document.getElementById('page-container');

    let message, emoji;
    if (percent === 100) { message = '完美！你是自然知识大师！'; emoji = '🏆'; }
    else if (percent >= 70) { message = '太棒了！你的自然知识很丰富！'; emoji = '🌟'; }
    else if (percent >= 40) { message = '不错哦！继续探索自然奥秘吧！'; emoji = '🌱'; }
    else { message = '加油！多看看冷知识再来挑战吧！'; emoji = '💪'; }

    container.innerHTML = `
      <div class="page active" id="page-quiz">
        <div class="page-header">
          <h1>挑战结束</h1>
          <p class="subtitle">${emoji} ${message}</p>
        </div>
        <div class="quiz-result-card">
          <div class="quiz-score-circle">
            <span class="quiz-score-number">${score}</span>
            <span class="quiz-score-total">/${total}</span>
          </div>
          <div class="quiz-progress quiz-progress--result">
            <div class="quiz-progress-bar" style="width: ${percent}%"></div>
          </div>
          ${isNewBest ? '<p class="quiz-best-badge">新纪录！</p>' : ''}
          <p class="quiz-best-score">最佳成绩：${Math.max(score, bestScore)}/${total}</p>
        </div>
        <div class="quiz-result-actions">
          <button class="btn btn-primary" id="quiz-retry">再来一局</button>
          <button class="btn btn-secondary" id="quiz-home">回到首页</button>
        </div>
      </div>
    `;

    document.getElementById('quiz-retry').addEventListener('click', async () => {
      const facts = await AI.loadFacts();
      this.start(facts);
    });

    document.getElementById('quiz-home').addEventListener('click', () => {
      window.location.hash = '/';
    });
  },
};
