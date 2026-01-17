// ===================================
// English Master - Game Logic
// AI-Powered Learning Game for Kids
// ===================================

// ===================================
// Configuration & Constants
// ===================================
const CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // Replace with your actual API key
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    STORAGE_KEY: 'englishMasterData',
    LEADERBOARD_KEY: 'englishMasterLeaderboard'
};

const ACHIEVEMENTS = [
    { id: 'first-steps', name: 'First Steps', icon: '🎯', description: 'Complete your first question', unlocked: false },
    { id: 'speed-demon', name: 'Speed Demon', icon: '⚡', description: 'Answer 5 questions in under 5 seconds each', unlocked: false },
    { id: 'streak-master', name: 'Streak Master', icon: '🔥', description: 'Achieve a 10-question streak', unlocked: false },
    { id: 'perfect-score', name: 'Perfect Score', icon: '💯', description: 'Complete challenge mode with 100%', unlocked: false },
    { id: 'hint-free-hero', name: 'Hint-Free Hero', icon: '🦸', description: 'Complete 10 questions without hints', unlocked: false },
    { id: 'daily-dedication', name: 'Daily Dedication', icon: '📅', description: 'Complete 7 daily challenges', unlocked: false },
    { id: 'english-master', name: 'English Master', icon: '👑', description: 'Reach 1000 total points', unlocked: false }
];

const THEMES = [
    { name: 'Space Adventure', icon: '🚀' },
    { name: 'Animal Kingdom', icon: '🦁' },
    { name: 'Sports Arena', icon: '⚽' },
    { name: 'Underwater World', icon: '🐠' },
    { name: 'Magic Castle', icon: '🏰' },
    { name: 'Jungle Safari', icon: '🌴' }
];

// ===================================
// Game State
// ===================================
const gameState = {
    player: {
        name: '',
        avatar: '🧑‍🎓',
        selectedDifficulty: 'medium',
        selectedMode: 'practice'
    },
    currentGame: {
        score: 0,
        streak: 0,
        questionNumber: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        hintsUsed: 0,
        hintsRemaining: 3,
        startTime: null,
        questionStartTime: null,
        currentQuestion: null,
        speedBonusCount: 0,
        noHintCount: 0,
        timer: null,
        timeRemaining: null
    },
    statistics: {
        totalQuestions: 0,
        correctAnswers: 0,
        totalTime: 0,
        longestStreak: 0,
        totalPoints: 0,
        achievements: [...ACHIEVEMENTS],
        dailyChallengesCompleted: 0,
        questionsWithoutHints: 0
    }
};

// ===================================
// Audio System (Web Audio API)
// ===================================
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled) return;
        this.init();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playCorrect() {
        // Cheerful ascending tone
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.2), 200); // G5
    }

    playWrong() {
        // Gentle descending tone
        this.playTone(392.00, 0.15); // G4
        setTimeout(() => this.playTone(329.63, 0.25), 150); // E4
    }

    playAchievement() {
        // Triumphant fanfare
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.1), 200); // G5
        setTimeout(() => this.playTone(1046.50, 0.3), 300); // C6
    }

    playClick() {
        this.playTone(800, 0.05, 'square');
    }

    playCountdown() {
        this.playTone(440, 0.1); // A4
    }

    playStreak() {
        this.playTone(880, 0.15); // A5
        setTimeout(() => this.playTone(1046.50, 0.15), 100); // C6
    }
}

const audio = new AudioSystem();

// ===================================
// Question Bank
// ===================================
const questionBank = {
    easy: [
        { question: "Choose the correct verb: She ___ to school every day.", answer: "goes", options: ["go", "goes", "going"], type: "grammar", explanation: "We use 'goes' with 'she' because it's third person singular." },
        { question: "What is a synonym for 'happy'?", answer: "joyful", options: ["joyful", "sad", "angry"], type: "vocabulary", explanation: "Joyful means feeling great happiness, just like happy!" },
        { question: "Which word is spelled correctly?", answer: "beautiful", options: ["beatiful", "beautiful", "beutiful"], type: "spelling", explanation: "Beautiful is spelled B-E-A-U-T-I-F-U-L." },
        { question: "Choose the correct article: I saw ___ elephant.", answer: "an", options: ["a", "an", "the"], type: "grammar", explanation: "We use 'an' before words that start with a vowel sound." },
        { question: "What is the opposite of 'big'?", answer: "small", options: ["small", "large", "huge"], type: "vocabulary", explanation: "Small is the opposite of big!" },
        { question: "Complete: I ___ a student.", answer: "am", options: ["am", "is", "are"], type: "grammar", explanation: "We use 'am' with 'I'." },
        { question: "Which is a noun: run, cat, happy?", answer: "cat", options: ["run", "cat", "happy"], type: "grammar", explanation: "A noun is a person, place, or thing. Cat is a thing!" },
        { question: "What is a synonym for 'big'?", answer: "large", options: ["large", "tiny", "small"], type: "vocabulary", explanation: "Large means the same as big!" }
    ],
    medium: [
        { question: "Choose the correct form: They ___ playing soccer yesterday.", answer: "were", options: ["was", "were", "are"], type: "grammar", explanation: "We use 'were' with 'they' in past tense." },
        { question: "What does 'brave' mean?", answer: "courageous", options: ["scared", "courageous", "weak"], type: "vocabulary", explanation: "Brave means showing courage and not being afraid." },
        { question: "Fix the sentence: She don't like ice cream.", answer: "doesn't", options: ["doesn't", "don't", "didn't"], type: "grammar", explanation: "We use 'doesn't' with 'she', not 'don't'." },
        { question: "What is an antonym for 'difficult'?", answer: "easy", options: ["hard", "easy", "tough"], type: "vocabulary", explanation: "Easy is the opposite of difficult!" },
        { question: "Choose the correct word: Their/There/They're going to the park.", answer: "They're", options: ["Their", "There", "They're"], type: "grammar", explanation: "They're is short for 'they are'." },
        { question: "What type of word is 'quickly'?", answer: "adverb", options: ["noun", "verb", "adverb"], type: "grammar", explanation: "Adverbs describe how something is done." },
        { question: "Complete the idiom: It's raining cats and ___.", answer: "dogs", options: ["dogs", "birds", "fish"], type: "vocabulary", explanation: "This idiom means it's raining very heavily!" }
    ],
    hard: [
        { question: "Identify the subject: Running through the park, the dog chased the ball.", answer: "the dog", options: ["running", "the dog", "the ball"], type: "grammar", explanation: "The subject is who or what performs the action." },
        { question: "What is a synonym for 'meticulous'?", answer: "careful", options: ["careless", "careful", "messy"], type: "vocabulary", explanation: "Meticulous means showing great attention to detail." },
        { question: "Choose the correct: If I ___ you, I would study harder.", answer: "were", options: ["was", "were", "am"], type: "grammar", explanation: "In hypothetical situations, we use 'were' even with 'I'." },
        { question: "What is the past participle of 'swim'?", answer: "swum", options: ["swam", "swum", "swimmed"], type: "grammar", explanation: "The past participle of swim is swum (have/has swum)." },
        { question: "Identify the metaphor: Time is money.", answer: "comparing time to money", options: ["time costs money", "comparing time to money", "time and money are same"], type: "vocabulary", explanation: "A metaphor compares two things without using 'like' or 'as'." },
        { question: "Choose correct: Neither the students nor the teacher ___ ready.", answer: "is", options: ["is", "are", "were"], type: "grammar", explanation: "With 'neither...nor', the verb agrees with the closest subject." }
    ]
};

// ===================================
// AI Integration (Gemini API)
// ===================================
class AIHelper {
    constructor() {
        this.apiKey = CONFIG.GEMINI_API_KEY;
        this.apiUrl = CONFIG.GEMINI_API_URL;
    }

    async generateHint(question, difficulty) {
        if (this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return this.getFallbackHint(question);
        }

        try {
            const prompt = `You are a friendly English teacher helping a child. The student is working on this question: "${question}". 
            Provide a helpful hint in simple, kid-friendly language (2-3 sentences max). Don't give the answer directly, but guide them to think about it. 
            Difficulty level: ${difficulty}. Be encouraging and positive!`;

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('AI hint generation failed:', error);
            return this.getFallbackHint(question);
        }
    }

    getFallbackHint(questionObj) {
        if (questionObj.explanation) {
            return `💡 Think about this: ${questionObj.explanation.split('.')[0]}. You can do it!`;
        }
        return "💡 Take your time and think carefully about the question. You've got this!";
    }

    async generateQuestion(difficulty, theme) {
        if (this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return this.getFallbackQuestion(difficulty, theme);
        }

        try {
            const prompt = `Create a fun English question for kids with a ${theme.name} theme. 
            Difficulty: ${difficulty}. 
            Format: Return ONLY a JSON object with these fields:
            {
                "question": "the question text",
                "answer": "correct answer",
                "options": ["option1", "option2", "option3"],
                "type": "grammar/vocabulary/spelling",
                "explanation": "kid-friendly explanation"
            }
            Make it engaging and related to ${theme.name}!`;

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.getFallbackQuestion(difficulty, theme);
        } catch (error) {
            console.error('AI question generation failed:', error);
            return this.getFallbackQuestion(difficulty, theme);
        }
    }

    getFallbackQuestion(difficulty, theme) {
        const questions = questionBank[difficulty] || questionBank.medium;
        return questions[Math.floor(Math.random() * questions.length)];
    }
}

const aiHelper = new AIHelper();

// ===================================
// Visual Effects
// ===================================
function createParticles(x, y, color, count = 10) {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = color;
        particle.style.animationDelay = (i * 0.05) + 's';
        container.appendChild(particle);

        setTimeout(() => particle.remove(), 2000);
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        confetti.style.animationDuration = (2 + Math.random()) + 's';
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

// ===================================
// Mascot Animations
// ===================================
function animateMascot(emotion, message = '') {
    const mascot = document.getElementById('mascot');
    const mascotBody = mascot.querySelector('.mascot-body');
    const speech = mascot.querySelector('.mascot-speech');

    mascot.classList.remove('hidden');
    mascotBody.className = 'mascot-body ' + emotion;

    if (message) {
        speech.textContent = message;
        speech.classList.remove('hidden');
        setTimeout(() => speech.classList.add('hidden'), 3000);
    }

    setTimeout(() => {
        mascotBody.className = 'mascot-body';
    }, 500);
}

// ===================================
// Storage Management
// ===================================
function saveGameData() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(gameState.statistics));
}

function loadGameData() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        gameState.statistics = { ...gameState.statistics, ...data };
        updateStartScreenStats();
    }
}

function saveToLeaderboard(score, mode) {
    let leaderboard = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
    
    leaderboard.push({
        name: gameState.player.name,
        avatar: gameState.player.avatar,
        score: score,
        mode: mode,
        date: new Date().toISOString()
    });

    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // Keep top 10

    localStorage.setItem(CONFIG.LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

// ===================================
// Screen Navigation
// ===================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    audio.playClick();
}

// ===================================
// Start Screen
// ===================================
function initStartScreen() {
    const nameInput = document.getElementById('player-name');
    const startBtn = document.getElementById('start-btn');
    const avatarBtns = document.querySelectorAll('.avatar-btn');

    nameInput.addEventListener('input', () => {
        gameState.player.name = nameInput.value.trim();
        startBtn.disabled = !gameState.player.name;
    });

    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.player.avatar = btn.dataset.avatar;
            audio.playClick();
        });
    });

    // Select first avatar by default
    avatarBtns[0].classList.add('selected');
    gameState.player.avatar = avatarBtns[0].dataset.avatar;

    startBtn.addEventListener('click', () => {
        showScreen('difficulty-screen');
    });

    loadGameData();
}

function updateStartScreenStats() {
    document.getElementById('top-score-display').textContent = gameState.statistics.totalPoints;
    const accuracy = gameState.statistics.totalQuestions > 0 
        ? Math.round((gameState.statistics.correctAnswers / gameState.statistics.totalQuestions) * 100)
        : 0;
    document.getElementById('accuracy-display').textContent = accuracy + '%';
    
    const unlockedCount = gameState.statistics.achievements.filter(a => a.unlocked).length;
    document.getElementById('badges-display').textContent = `${unlockedCount}/7`;
}

// ===================================
// Difficulty Selection
// ===================================
function initDifficultyScreen() {
    const difficultyBtns = document.querySelectorAll('.select-difficulty-btn');
    
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.difficulty-card');
            gameState.player.selectedDifficulty = card.dataset.difficulty;
            showScreen('mode-screen');
        });
    });
}

// ===================================
// Game Mode Selection
// ===================================
function initModeScreen() {
    const modeBtns = document.querySelectorAll('.select-mode-btn');
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.mode-card');
            gameState.player.selectedMode = card.dataset.mode;
            startGame();
        });
    });

    document.getElementById('view-stats-btn').addEventListener('click', () => {
        showStatistics();
    });

    document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
        showLeaderboard();
    });
}

// ===================================
// Game Logic
// ===================================
async function startGame() {
    // Reset game state
    gameState.currentGame = {
        score: 0,
        streak: 0,
        questionNumber: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        hintsUsed: 0,
        hintsRemaining: getHintsForDifficulty(),
        startTime: Date.now(),
        questionStartTime: null,
        currentQuestion: null,
        speedBonusCount: 0,
        noHintCount: 0,
        timer: null,
        timeRemaining: null
    };

    showScreen('game-screen');
    updateGameHeader();
    
    // Show mascot
    animateMascot('happy', "Let's learn together! 🎓");

    // Start game mode specific logic
    if (gameState.player.selectedMode === 'time-attack') {
        startTimeAttack();
    } else if (gameState.player.selectedMode === 'challenge') {
        // Challenge mode: 10 questions
        nextQuestion();
    } else {
        // Practice or Daily
        nextQuestion();
    }
}

function getHintsForDifficulty() {
    const difficulty = gameState.player.selectedDifficulty;
    if (difficulty === 'easy') return 999; // Unlimited
    if (difficulty === 'medium') return 3;
    if (difficulty === 'hard') return 1;
    return 5; // AI Challenge
}

function startTimeAttack() {
    gameState.currentGame.timeRemaining = 60;
    updateTimer();
    
    gameState.currentGame.timer = setInterval(() => {
        gameState.currentGame.timeRemaining--;
        updateTimer();
        
        if (gameState.currentGame.timeRemaining <= 10) {
            audio.playCountdown();
        }
        
        if (gameState.currentGame.timeRemaining <= 0) {
            endGame();
        }
    }, 1000);
    
    nextQuestion();
}

function updateTimer() {
    const timerEl = document.getElementById('game-timer');
    if (gameState.currentGame.timeRemaining !== null) {
        timerEl.textContent = gameState.currentGame.timeRemaining + 's';
        if (gameState.currentGame.timeRemaining <= 10) {
            timerEl.style.color = '#ef4444';
        }
    } else {
        timerEl.textContent = '--';
    }
}

function updateGameHeader() {
    document.getElementById('game-avatar').textContent = gameState.player.avatar;
    document.getElementById('game-player-name').textContent = gameState.player.name;
    document.getElementById('current-score').textContent = gameState.currentGame.score;
    document.getElementById('current-streak').textContent = gameState.currentGame.streak;
    document.getElementById('hints-remaining').textContent = gameState.currentGame.hintsRemaining;
}

async function nextQuestion() {
    // Check if game should end
    if (gameState.player.selectedMode === 'challenge' && gameState.currentGame.questionNumber >= 10) {
        endGame();
        return;
    }

    gameState.currentGame.questionNumber++;
    gameState.currentGame.questionStartTime = Date.now();

    // Hide feedback and hint
    document.getElementById('feedback-display').classList.add('hidden');
    document.getElementById('hint-display').classList.add('hidden');
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();

    // Get question
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    let question;

    if (gameState.player.selectedDifficulty === 'ai-challenge') {
        question = await aiHelper.generateQuestion(gameState.player.selectedDifficulty, theme);
    } else {
        const difficulty = gameState.player.selectedDifficulty;
        const questions = questionBank[difficulty] || questionBank.medium;
        question = questions[Math.floor(Math.random() * questions.length)];
    }

    gameState.currentGame.currentQuestion = question;

    // Update UI
    document.getElementById('question-num').textContent = gameState.currentGame.questionNumber;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('question-difficulty-badge').textContent = 
        gameState.player.selectedDifficulty.charAt(0).toUpperCase() + gameState.player.selectedDifficulty.slice(1);
    
    const themeEl = document.getElementById('question-theme');
    themeEl.querySelector('.theme-icon').textContent = theme.icon;
    themeEl.querySelector('.theme-text').textContent = theme.name;
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim().toLowerCase();
    const correctAnswer = gameState.currentGame.currentQuestion.answer.toLowerCase();
    
    if (!userAnswer) {
        return;
    }

    const isCorrect = userAnswer === correctAnswer;
    const responseTime = (Date.now() - gameState.currentGame.questionStartTime) / 1000;

    gameState.currentGame.totalQuestions++;
    gameState.statistics.totalQuestions++;

    if (isCorrect) {
        handleCorrectAnswer(responseTime);
    } else {
        handleWrongAnswer(correctAnswer);
    }

    // Update statistics
    gameState.statistics.totalTime += responseTime;
    saveGameData();

    // Check achievements
    checkAchievements();

    // Next question after delay
    setTimeout(() => {
        if (gameState.player.selectedMode !== 'time-attack' || gameState.currentGame.timeRemaining > 0) {
            nextQuestion();
        }
    }, 2000);
}

function handleCorrectAnswer(responseTime) {
    gameState.currentGame.correctAnswers++;
    gameState.currentGame.streak++;
    gameState.statistics.correctAnswers++;

    if (gameState.currentGame.streak > gameState.statistics.longestStreak) {
        gameState.statistics.longestStreak = gameState.currentGame.streak;
    }

    let points = 10;
    const bonuses = [];

    // Speed bonus
    if (responseTime < 5) {
        points += 5;
        bonuses.push('speed');
        gameState.currentGame.speedBonusCount++;
    }

    // Streak bonus
    if (gameState.currentGame.streak >= 3) {
        points += 10;
        bonuses.push('streak');
    }

    // No-hint bonus
    if (gameState.currentGame.hintsUsed === 0) {
        points += 15;
        bonuses.push('no-hint');
        gameState.currentGame.noHintCount++;
    }

    gameState.currentGame.score += points;
    gameState.statistics.totalPoints += points;

    // Update UI
    updateGameHeader();
    showFeedback(true, `Correct! +${points} points 🎉`);
    showBonuses(bonuses);

    // Effects
    audio.playCorrect();
    if (gameState.currentGame.streak >= 5) {
        audio.playStreak();
    }
    animateMascot('happy', '🎉 Great job!');
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#10b981', 15);
}

function handleWrongAnswer(correctAnswer) {
    gameState.currentGame.streak = 0;

    // Update UI
    updateGameHeader();
    showFeedback(false, `Not quite! The correct answer is: ${correctAnswer}`);

    // Effects
    audio.playWrong();
    animateMascot('sad', "That's okay, keep trying! 💪");
}

function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('feedback-display');
    feedbackEl.className = 'feedback-box ' + (isCorrect ? 'correct' : 'incorrect');
    feedbackEl.querySelector('.feedback-content').textContent = message;
    feedbackEl.classList.remove('hidden');
}

function showBonuses(bonuses) {
    bonuses.forEach(bonus => {
        const bonusEl = document.getElementById(bonus + '-bonus');
        bonusEl.classList.remove('hidden');
        setTimeout(() => bonusEl.classList.add('hidden'), 2000);
    });
}

async function showHint() {
    if (gameState.currentGame.hintsRemaining <= 0) {
        animateMascot('sad', 'No hints left! 😅');
        return;
    }

    gameState.currentGame.hintsUsed++;
    gameState.currentGame.hintsRemaining--;
    updateGameHeader();

    const hintBox = document.getElementById('hint-display');
    const hintContent = hintBox.querySelector('.hint-content');
    
    hintContent.textContent = 'Thinking... 🤔';
    hintBox.classList.remove('hidden');

    const hint = await aiHelper.generateHint(
        gameState.currentGame.currentQuestion,
        gameState.player.selectedDifficulty
    );

    hintContent.textContent = hint;
    audio.playClick();
}

function endGame() {
    if (gameState.currentGame.timer) {
        clearInterval(gameState.currentGame.timer);
    }

    // Calculate final stats
    const accuracy = gameState.currentGame.totalQuestions > 0
        ? Math.round((gameState.currentGame.correctAnswers / gameState.currentGame.totalQuestions) * 100)
        : 0;

    // Save to leaderboard
    saveToLeaderboard(gameState.currentGame.score, gameState.player.selectedMode);

    // Show game over modal
    document.getElementById('final-score').textContent = gameState.currentGame.score;
    document.getElementById('final-correct').textContent = 
        `${gameState.currentGame.correctAnswers}/${gameState.currentGame.totalQuestions}`;
    document.getElementById('final-accuracy').textContent = accuracy + '%';
    document.getElementById('final-streak').textContent = gameState.currentGame.streak;

    const title = accuracy === 100 ? 'Perfect Score! 🏆' : 
                  accuracy >= 80 ? 'Excellent Work! 🌟' :
                  accuracy >= 60 ? 'Good Job! 👍' : 'Keep Practicing! 💪';
    document.getElementById('game-over-title').textContent = title;

    document.getElementById('game-over-modal').classList.remove('hidden');

    // Check for perfect score achievement
    if (gameState.player.selectedMode === 'challenge' && accuracy === 100) {
        unlockAchievement('perfect-score');
    }

    saveGameData();
}

// ===================================
// Achievements
// ===================================
function checkAchievements() {
    // First Steps
    if (gameState.statistics.totalQuestions >= 1) {
        unlockAchievement('first-steps');
    }

    // Speed Demon
    if (gameState.currentGame.speedBonusCount >= 5) {
        unlockAchievement('speed-demon');
    }

    // Streak Master
    if (gameState.currentGame.streak >= 10) {
        unlockAchievement('streak-master');
    }

    // Hint-Free Hero
    if (gameState.currentGame.noHintCount >= 10) {
        unlockAchievement('hint-free-hero');
    }

    // English Master
    if (gameState.statistics.totalPoints >= 1000) {
        unlockAchievement('english-master');
    }
}

function unlockAchievement(achievementId) {
    const achievement = gameState.statistics.achievements.find(a => a.id === achievementId);
    
    if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        showAchievementModal(achievement);
        audio.playAchievement();
        createConfetti();
        saveGameData();
    }
}

function showAchievementModal(achievement) {
    document.getElementById('unlocked-badge-icon').textContent = achievement.icon;
    document.getElementById('achievement-name').textContent = achievement.name;
    document.getElementById('achievement-description').textContent = achievement.description;
    document.getElementById('achievement-modal').classList.remove('hidden');
}

// ===================================
// Statistics Screen
// ===================================
function showStatistics() {
    showScreen('stats-screen');

    const stats = gameState.statistics;
    document.getElementById('total-questions').textContent = stats.totalQuestions;
    
    const accuracy = stats.totalQuestions > 0
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;
    document.getElementById('accuracy-stat').textContent = accuracy + '%';

    const avgTime = stats.totalQuestions > 0
        ? Math.round(stats.totalTime / stats.totalQuestions)
        : 0;
    document.getElementById('avg-time-stat').textContent = avgTime + 's';

    document.getElementById('longest-streak-stat').textContent = stats.longestStreak;
    document.getElementById('total-points-stat').textContent = stats.totalPoints;

    const unlockedCount = stats.achievements.filter(a => a.unlocked).length;
    document.getElementById('badges-unlocked-stat').textContent = `${unlockedCount}/7`;

    // Render achievements
    const achievementsGrid = document.getElementById('achievements-grid');
    achievementsGrid.innerHTML = '';

    stats.achievements.forEach(achievement => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge' + (achievement.unlocked ? '' : ' locked');
        badge.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
        `;
        achievementsGrid.appendChild(badge);
    });
}

// ===================================
// Leaderboard
// ===================================
function showLeaderboard() {
    showScreen('leaderboard-screen');

    const leaderboard = JSON.parse(localStorage.getItem(CONFIG.LEADERBOARD_KEY) || '[]');
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '';

    if (leaderboard.length === 0) {
        listEl.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">No scores yet. Be the first!</p>';
        return;
    }

    leaderboard.forEach((entry, index) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'leaderboard-entry' + 
            (entry.name === gameState.player.name ? ' current-player' : '');
        
        const rank = index + 1;
        entryEl.innerHTML = `
            <span class="rank ${rank <= 3 ? 'top-3' : ''}">#${rank}</span>
            <span>${entry.avatar} ${entry.name}</span>
            <span>${entry.score}</span>
            <span>${entry.mode}</span>
        `;
        listEl.appendChild(entryEl);
    });
}

// ===================================
// Dark Mode
// ===================================
function initDarkMode() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    const sunIcon = toggleBtn.querySelector('.sun-icon');
    const moonIcon = toggleBtn.querySelector('.moon-icon');

    // Check saved preference
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkNow = document.body.classList.contains('dark-mode');
        
        sunIcon.classList.toggle('hidden');
        moonIcon.classList.toggle('hidden');
        
        localStorage.setItem('darkMode', isDarkNow);
        audio.playClick();
    });
}

// ===================================
// Event Listeners
// ===================================
function initEventListeners() {
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.closest('#difficulty-screen')) {
                showScreen('start-screen');
            } else if (btn.closest('#mode-screen')) {
                showScreen('difficulty-screen');
            } else {
                showScreen('mode-screen');
            }
        });
    });

    // Game controls
    document.getElementById('submit-answer-btn').addEventListener('click', checkAnswer);
    document.getElementById('answer-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    document.getElementById('hint-btn').addEventListener('click', showHint);
    document.querySelector('.hint-close').addEventListener('click', () => {
        document.getElementById('hint-display').classList.add('hidden');
    });

    document.getElementById('quit-game-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
            if (gameState.currentGame.timer) {
                clearInterval(gameState.currentGame.timer);
            }
            showScreen('mode-screen');
        }
    });

    // Modals
    document.getElementById('close-achievement-modal').addEventListener('click', () => {
        document.getElementById('achievement-modal').classList.add('hidden');
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.add('hidden');
        startGame();
    });

    document.getElementById('main-menu-btn').addEventListener('click', () => {
        document.getElementById('game-over-modal').classList.add('hidden');
        showScreen('mode-screen');
    });
}

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initStartScreen();
    initDifficultyScreen();
    initModeScreen();
    initDarkMode();
    initEventListeners();
    
    console.log('🎮 English Master Game Loaded!');
    console.log('💡 To enable AI features, add your Gemini API key in script.js');
});
