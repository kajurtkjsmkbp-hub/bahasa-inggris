// LMS Bahasa Inggris Kelas IV SD - App Controller Logic
// Mengatur UI interaktif, Flashcards, Game Ejaan (Spelling Bee), Tebak Suara (Listen & Match), dan Kuis Bintang

class EnglishLMSApp {
  constructor() {
    this.currentUnitId = lmsData.units[0].id;
    this.stars = parseInt(localStorage.getItem('sd4_english_stars') || '0', 10);
    this.audio = audioCtrl;
    this.spellingGameState = null;
    this.listenGameState = null;
    this.quizGameState = null;
    this.alertConfirmCallback = null;

    // Data Profil Siswa
    this.studentName = localStorage.getItem('sd4_student_name') || 'Siswa Juara';
    this.studentClass = localStorage.getItem('sd4_student_class') || 'Kelas IV-A';
    this.studentAvatar = localStorage.getItem('sd4_student_avatar') || '🦁';
    this.isLoggedIn = !!localStorage.getItem('sd4_student_name');
    this.tempSelectedAvatar = this.studentAvatar;
    this.tempSelectedClass = this.studentClass;

    // Override browser native alert agar selalu menggunakan Popup Besar Ramah Anak
    window.alert = (msg) => {
      this.showKidAlert({
        title: "Perhatian Sahabat Juara! 📢",
        message: msg,
        hint: "Ayo tetap semangat belajar!",
        icon: "🦉",
        type: "info",
        badge: "Pesan Guru",
        buttonText: "Siap, Mengerti! ✨"
      });
    };

    this.init();
  }

  init() {
    this.updateStudentHeader();
    this.updateStarDisplay();
    this.renderUnitTabs();
    this.renderVocabCards();
    this.setupEventListeners();

    // Buka popup sambutan / login jika pertama kali membuka
    if (!this.isLoggedIn) {
      setTimeout(() => {
        this.openLoginModal(false);
      }, 400);
    }
  }

  updateStudentHeader() {
    const avatarEl = document.getElementById('header-avatar');
    const nameEl = document.getElementById('header-student-name');
    const classEl = document.getElementById('header-student-class');
    const mobAvatarEl = document.getElementById('mob-nav-avatar');

    if (avatarEl) avatarEl.textContent = this.studentAvatar;
    if (nameEl) nameEl.textContent = this.studentName;
    if (classEl) classEl.textContent = this.studentClass;
    if (mobAvatarEl) mobAvatarEl.textContent = this.studentAvatar;
  }

  // ================= SISTEM NOTIFIKASI BESAR & RAMAH ANAK =================
  showKidAlert({
    title = "Yuk Coba Lagi! 💪",
    message = "Masih ada sedikit yang kurang pas nih.",
    hint = "Dengarkan petunjuk suaranya ya!",
    icon = "🐰",
    type = "warning", // 'warning' | 'info' | 'success'
    badge = "Ayo Belajar!",
    buttonText = "Ayo Coba Lagi! 🚀",
    onConfirm = null
  } = {}) {
    this.audio.playTone('pop');
    this.alertConfirmCallback = onConfirm;

    const modal = document.getElementById('modal-kid-alert');
    const card = document.getElementById('kid-alert-card');
    const iconEl = document.getElementById('kid-alert-icon');
    const badgeEl = document.getElementById('kid-alert-badge');
    const titleEl = document.getElementById('kid-alert-title');
    const msgEl = document.getElementById('kid-alert-msg');
    const hintEl = document.getElementById('kid-alert-hint');
    const hintTextEl = document.getElementById('kid-alert-hint-text');
    const btnTextEl = document.getElementById('kid-alert-btn-text');

    if (!modal || !card) return;

    // Set styling class type
    card.className = `kid-alert-card type-${type}`;

    if (iconEl) iconEl.textContent = icon;
    if (badgeEl) badgeEl.textContent = badge;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (hint) {
      if (hintEl) hintEl.style.display = 'flex';
      if (hintTextEl) hintTextEl.textContent = hint;
    } else if (hintEl) {
      hintEl.style.display = 'none';
    }

    if (btnTextEl) btnTextEl.textContent = buttonText;

    modal.classList.add('active');
  }

  closeKidAlert() {
    this.audio.playTone('pop');
    const modal = document.getElementById('modal-kid-alert');
    if (modal) modal.classList.remove('active');

    if (typeof this.alertConfirmCallback === 'function') {
      const cb = this.alertConfirmCallback;
      this.alertConfirmCallback = null;
      cb();
    }
  }

  // Toast Floating Notification (Melayang Ceria di Pojok)
  showToast({ icon = '⭐', message = '', duration = 2800 } = {}) {
    const container = document.getElementById('kid-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'kid-toast';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    // Animasi masuk
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Otomatis hilang
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // Menambah Bintang & Simpan
  addStars(count = 1) {
    this.stars += count;
    localStorage.setItem('sd4_english_stars', this.stars);
    this.updateStarDisplay();
    this.audio.playTone('star');
    this.triggerMiniConfetti();
    this.showToast({
      icon: '⭐',
      message: `Hebat! +${count} Bintang Emas Berhasil Diraih!`
    });
  }

  updateStarDisplay() {
    const starCountEl = document.getElementById('star-count');
    if (starCountEl) {
      starCountEl.textContent = this.stars;
    }
  }

  // Render Tabs Unit Materi
  renderUnitTabs() {
    const navContainer = document.getElementById('unit-nav-tabs');
    if (!navContainer) return;

    navContainer.innerHTML = '';
    lmsData.units.forEach(unit => {
      const btn = document.createElement('button');
      btn.className = `unit-tab-btn ${unit.id === this.currentUnitId ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="tab-icon">${unit.icon}</span>
        <span>${unit.number}: ${unit.title}</span>
      `;
      btn.onclick = () => {
        this.audio.playTone('pop');
        this.selectUnit(unit.id);
      };
      navContainer.appendChild(btn);
    });
  }

  // Ganti Unit
  selectUnit(unitId) {
    this.currentUnitId = unitId;
    this.renderUnitTabs();
    this.renderVocabCards();
  }

  getCurrentUnit() {
    return lmsData.units.find(u => u.id === this.currentUnitId) || lmsData.units[0];
  }

  // Render Kartu Kosakata (Flashcards)
  renderVocabCards() {
    const currentUnit = this.getCurrentUnit();
    const titleEl = document.getElementById('unit-title-display');
    const descEl = document.getElementById('unit-desc-display');
    const gridEl = document.getElementById('vocab-card-grid');

    if (titleEl) titleEl.textContent = `${currentUnit.number}: ${currentUnit.title} (${currentUnit.subtitle})`;
    if (descEl) descEl.textContent = currentUnit.description;
    if (!gridEl) return;

    gridEl.innerHTML = '';

    currentUnit.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'vocab-card';
      card.id = `card-${item.id}`;

      card.innerHTML = `
        <div class="card-media-wrapper">
          <span class="card-badge">${currentUnit.subtitle}</span>
          <img src="${item.image}" alt="${item.english}" class="card-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <span class="fallback-emoji" style="display: none;">${item.emoji}</span>
        </div>
        
        <div class="card-body">
          <div class="card-word-en">
            <span>${item.english}</span>
            <span style="font-size: 1.5rem;">${item.emoji}</span>
          </div>

          <div class="card-word-id">
            <span>🇮🇩 ${item.indonesian}</span>
          </div>

          <!-- Kotak Pelafalan / Cara Baca Bunyi Santai -->
          <div class="pronounce-box">
            <div class="pronounce-label">
              <span>🗣️ Cara Baca:</span>
            </div>
            <div class="easy-pronounce">"${item.easyPronounce}"</div>
            <div class="phonetic-ipa">${item.phonetic}</div>
          </div>

          <!-- Kotak Ejaan Huruf (Spelling) -->
          <div class="spelling-box">
            <div class="pronounce-label">
              <span>🔤 Ejaan Huruf (Spelling):</span>
            </div>
            <div class="spelling-letters" id="spelling-text-${item.id}">${item.spelling}</div>
          </div>

          <!-- Contoh Kalimat Sederhana -->
          <div class="example-box">
            <div class="example-en">💬 "${item.exampleEn}"</div>
            <div class="example-id">Artinya: "${item.exampleId}"</div>
          </div>

          <!-- Tombol Interaksi Suara Ramah Anak -->
          <div class="card-actions">
            <button class="btn-audio-main" onclick="app.speakWord('${item.english}', this)" title="Dengarkan pengucapan normal">
              <span>🔊</span> Suara
            </button>
            <button class="btn-audio-sub" onclick="app.speakSlow('${item.english}', this)" title="Dengarkan pelan-pelan (mode kura-kura)">
              <span>🐢</span> Pelan
            </button>
            <button class="btn-audio-sub" onclick="app.spellWord('${item.english}', '${item.id}', this)" title="Eja huruf satu demi satu">
              <span>🔤</span> Eja
            </button>
          </div>
        </div>
      `;

      gridEl.appendChild(card);
    });
  }

  // Audio Actions
  speakWord(text, btnEl = null) {
    this.audio.playTone('pop');
    this.showToast({ icon: '🔊', message: `Memutar suara: "${text}"`, duration: 2000 });
    if (btnEl) btnEl.classList.add('speaking');
    this.audio.speak(text, () => {
      if (btnEl) btnEl.classList.remove('speaking');
    });
  }

  speakSlow(text, btnEl = null) {
    this.audio.playTone('pop');
    this.showToast({ icon: '🐢', message: `Mode Pelan: "${text}"`, duration: 2500 });
    if (btnEl) btnEl.classList.add('speaking');
    this.audio.speakSlow(text, () => {
      if (btnEl) btnEl.classList.remove('speaking');
    });
  }

  spellWord(text, itemId, btnEl = null) {
    this.audio.playTone('pop');
    this.showToast({ icon: '🔤', message: `Mengeja kata: "${text}"`, duration: 3000 });
    if (btnEl) btnEl.classList.add('speaking');
    const spellingDisplay = document.getElementById(`spelling-text-${itemId}`);

    this.audio.spellOutLoud(text, 
      (letter, index) => {
        // Efek visual saat huruf sedang dieja
        if (spellingDisplay) {
          spellingDisplay.style.transform = 'scale(1.05)';
          spellingDisplay.style.color = '#EA580C';
        }
      },
      () => {
        if (btnEl) btnEl.classList.remove('speaking');
        if (spellingDisplay) {
          spellingDisplay.style.transform = 'none';
          spellingDisplay.style.color = '#15803D';
        }
      }
    );
  }

  // ================= GAME 1: SPELLING BEE (SUSUN HURUF) =================
  openSpellingGame() {
    this.audio.playTone('pop');
    const currentUnit = this.getCurrentUnit();
    // Ambil kata acak dari unit saat ini (prioritaskan 1 kata per item)
    const items = currentUnit.items;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    // Target kata (bersihkan karakter non-huruf untuk dieja)
    const cleanWord = randomItem.english.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const targetLetters = cleanWord.split('');

    // Acak huruf-hurufnya untuk pilihan
    const shuffledLetters = [...targetLetters].sort(() => Math.random() - 0.5);

    this.spellingGameState = {
      item: randomItem,
      cleanWord: cleanWord,
      targetLetters: targetLetters,
      enteredLetters: [],
      availableButtons: shuffledLetters.map((char, index) => ({ id: index, char: char, used: false }))
    };

    const modal = document.getElementById('modal-game');
    const modalContent = document.getElementById('game-modal-body');
    if (!modal || !modalContent) return;

    this.renderSpellingGameUI(modalContent);
    modal.classList.add('active');

    // Suarakan kata di awal
    setTimeout(() => {
      this.audio.speak(randomItem.english);
    }, 400);
  }

  renderSpellingGameUI(container) {
    const state = this.spellingGameState;
    if (!state) return;

    container.innerHTML = `
      <div class="modal-title-area">
        <span class="modal-badge">🎮 Mini Game 1</span>
        <h3 class="modal-title">Susun Ejaan Huruf (Spelling Bee)</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Dengarkan dan susun huruf-huruf menjadi kata bahasa Inggris yang tepat!</p>
      </div>

      <div class="spelling-game-area">
        <img src="${state.item.image}" alt="${state.item.english}" class="spelling-prompt-img" onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400';">
        <div class="spelling-clue-id">🇮🇩 Artinya: "${state.item.indonesian}"</div>
        
        <button class="btn-audio-main" style="margin: 0 auto 18px; width: fit-content;" onclick="app.audio.speak('${state.item.english}')">
          <span>🔊</span> Dengarkan Kata
        </button>

        <!-- Kotak Huruf Hasil Susunan -->
        <div class="spelling-slots">
          ${state.targetLetters.map((_, i) => {
            const letter = state.enteredLetters[i] || '';
            return `<div class="letter-slot ${letter ? 'filled' : ''}">${letter}</div>`;
          }).join('')}
        </div>

        <!-- Kolom Huruf Acak Pilihan Anak -->
        <div class="scrambled-pool">
          ${state.availableButtons.map(btn => `
            <button class="btn-letter-choice" id="letter-btn-${btn.id}" ${btn.used ? 'disabled' : ''} onclick="app.pickLetter(${btn.id})">
              ${btn.char}
            </button>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 20px;">
          <button class="btn-game" onclick="app.resetSpellingCurrentWord()">
            <span>🔄</span> Ulangi Susunan
          </button>
          <button class="btn-game btn-game-spelling" onclick="app.openSpellingGame()">
            <span>➡️</span> Kata Lainnya
          </button>
        </div>
      </div>
    `;
  }

  pickLetter(buttonId) {
    const state = this.spellingGameState;
    if (!state) return;

    const btnObj = state.availableButtons.find(b => b.id === buttonId);
    if (!btnObj || btnObj.used) return;

    this.audio.playTone('click');
    // Ucapkan huruf yang diklik
    this.audio.speak(btnObj.char);

    btnObj.used = true;
    state.enteredLetters.push(btnObj.char);

    const container = document.getElementById('game-modal-body');
    this.renderSpellingGameUI(container);

    // Cek apakah sudah terisi semua
    if (state.enteredLetters.length === state.targetLetters.length) {
      const spelledWord = state.enteredLetters.join('');
      if (spelledWord === state.cleanWord) {
        // Jawaban Benar!
        setTimeout(() => {
          this.audio.playTone('correct');
          this.addStars(2);
          this.showCelebration(container, "Hebat Sekali! Ejaanmu Tepat!", state.item.english, 2, () => this.openSpellingGame());
        }, 300);
      } else {
        // Jawaban Salah
        setTimeout(() => {
          this.audio.playTone('wrong');
          this.showKidAlert({
            title: "Ups, Sedikit Lagi! 🌟",
            message: `Susunan huruf untuk kata "${state.item.english}" belum pas nih.`,
            hint: `Artinya: "${state.item.indonesian}". Ayo perhatikan bunyi hurufnya ya!`,
            icon: "🐱",
            type: "warning",
            badge: "Semangat Belajar! 💪",
            buttonText: "Ayo Coba Susun Lagi! 🚀",
            onConfirm: () => {
              this.resetSpellingCurrentWord();
              this.audio.speak(state.item.english);
            }
          });
        }, 300);
      }
    }
  }

  resetSpellingCurrentWord() {
    if (!this.spellingGameState) return;
    this.spellingGameState.enteredLetters = [];
    this.spellingGameState.availableButtons.forEach(b => b.used = false);
    const container = document.getElementById('game-modal-body');
    this.renderSpellingGameUI(container);
  }

  // ================= GAME 2: LISTEN & GUESS (TEBAK GAMBAR) =================
  openListenGame() {
    this.audio.playTone('pop');
    const currentUnit = this.getCurrentUnit();
    const items = currentUnit.items;
    
    // Pilih 1 target
    const targetItem = items[Math.floor(Math.random() * items.length)];

    // Pilih 3 pengalih (distractors)
    const others = items.filter(i => i.id !== targetItem.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [targetItem, ...shuffledOthers].sort(() => Math.random() - 0.5);

    this.listenGameState = {
      target: targetItem,
      options: options
    };

    const modal = document.getElementById('modal-game');
    const modalContent = document.getElementById('game-modal-body');
    if (!modal || !modalContent) return;

    this.renderListenGameUI(modalContent);
    modal.classList.add('active');

    // Bunyikan kata soal secara otomatis
    setTimeout(() => {
      this.audio.speak(targetItem.english);
    }, 450);
  }

  renderListenGameUI(container) {
    const state = this.listenGameState;
    if (!state) return;

    container.innerHTML = `
      <div class="modal-title-area">
        <span class="modal-badge" style="background: #FDF4FF; color: #A21CAF;">🎧 Mini Game 2</span>
        <h3 class="modal-title">Dengar & Tebak Gambar (Listen & Choose)</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Tekan tombol speaker, lalu pilih gambar yang tepat!</p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <button class="btn-audio-main" style="margin: 0 auto; padding: 14px 28px; font-size: 1.15rem;" onclick="app.audio.speak('${state.target.english}')">
          <span>🔊</span> Putar Suara Lagi
        </button>
      </div>

      <div class="listen-grid">
        ${state.options.map(opt => `
          <div class="listen-card-option" onclick="app.checkListenAnswer('${opt.id}')">
            <img src="${opt.image}" alt="${opt.english}" onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400';">
            <div class="option-text">${opt.english}</div>
            <div style="font-size: 0.85rem; color: #059669; font-weight: 600;">🇮🇩 ${opt.indonesian}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  checkListenAnswer(selectedId) {
    const state = this.listenGameState;
    if (!state) return;

    const container = document.getElementById('game-modal-body');

    if (selectedId === state.target.id) {
      this.audio.playTone('correct');
      this.addStars(2);
      this.showCelebration(container, "Pintar! Tebakan Gambarmu Tepat!", `${state.target.english} (${state.target.indonesian})`, 2, () => this.openListenGame());
    } else {
      this.audio.playTone('wrong');
      this.showKidAlert({
        title: "Belum Tepat, Sahabat Juara! 🎧",
        message: "Gambar yang kamu pilih belum cocok dengan suara kata tadi.",
        hint: `Kata yang sedang dicari adalah: "${state.target.english}" (${state.target.indonesian}).`,
        icon: "🐰",
        type: "warning",
        badge: "Dengarkan Baik-Baik! 👂",
        buttonText: "Dengarkan & Coba Lagi! 🔊",
        onConfirm: () => {
          this.audio.speak(state.target.english);
        }
      });
    }
  }

  // ================= GAME 3: KUIS PINTAR MULTI-VARIASI =================
  openQuizGame(count = null, mode = 'unit') {
    this.audio.playTone('pop');
    const modal = document.getElementById('modal-game');
    const modalContent = document.getElementById('game-modal-body');
    if (!modal || !modalContent) return;

    if (!count) {
      // Tampilkan Pemilih Mode & Jumlah Soal
      this.renderQuizModeSelector(modalContent);
      modal.classList.add('active');
      return;
    }

    this.startQuizWithCount(count, mode, modalContent);
    modal.classList.add('active');
  }

  renderQuizModeSelector(container) {
    const currentUnit = this.getCurrentUnit();
    container.innerHTML = `
      <div class="modal-title-area">
        <span class="modal-badge" style="background: #FEF3C7; color: #B45309;">📝 Bank Soal: 100 Soal Per Unit (Total 1.000 Soal)</span>
        <h3 class="modal-title">Pilih Tantangan Kuis Kamu!</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Tersedia 100 soal bervariasi per unit: Arti Kata, Terjemahan, Kalimat Rumpang, Ejaan, Visual, Percakapan, Benar/Salah, Pasangan Kata, Grammar, & Kasus Nyata!</p>
      </div>

      <div class="quiz-mode-grid">
        <div class="quiz-mode-card" onclick="app.openQuizGame(10, 'unit')">
          <div class="mode-icon">⚡</div>
          <div class="mode-title">Kuis Kilat</div>
          <div class="mode-desc">10 Soal Acak (${currentUnit.number})</div>
        </div>
        <div class="quiz-mode-card" onclick="app.openQuizGame(25, 'unit')">
          <div class="mode-icon">🌟</div>
          <div class="mode-title">Tantangan 25</div>
          <div class="mode-desc">25 Soal Modul (${currentUnit.number})</div>
        </div>
        <div class="quiz-mode-card" onclick="app.openQuizGame(50, 'unit')">
          <div class="mode-icon">🏅</div>
          <div class="mode-title">Latihan Ujian</div>
          <div class="mode-desc">50 Soal Intensif (${currentUnit.number})</div>
        </div>
        <div class="quiz-mode-card" onclick="app.openQuizGame(100, 'unit')" style="border-color: #6366F1; background: #EEF2FF;">
          <div class="mode-icon">💯</div>
          <div class="mode-title">Maraton 100 Soal</div>
          <div class="mode-desc">Semua 100 Soal Lengkap Unit!</div>
        </div>
        <div class="quiz-mode-card" onclick="app.openQuizGame(25, 'all')" style="border-color: #F59E0B; background: #FEF3C7;">
          <div class="mode-icon">🏆</div>
          <div class="mode-title">Grand Challenge</div>
          <div class="mode-desc">25 Soal Campuran 10 Unit</div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 10px;">
        <p style="font-size: 0.85rem; color: #059669; font-weight: 700;">
          💡 Setiap soal yang benar akan mendapatkan 2 Bintang Emas ⭐! Total 100 Soal Tersedia di Unit Ini.
        </p>
      </div>
    `;
  }

  startQuizWithCount(count, mode, container) {
    let pool = [];
    const currentUnitId = this.getCurrentUnit().id;

    if (mode === 'all') {
      if (typeof lmsQuestionBank !== 'undefined') {
        Object.values(lmsQuestionBank).forEach(qList => pool.push(...qList));
      }
    } else {
      if (typeof lmsQuestionBank !== 'undefined' && lmsQuestionBank[currentUnitId]) {
        pool = [...lmsQuestionBank[currentUnitId]];
      }
    }

    // Jika question bank belum termuat, fallback ke generator lama
    if (pool.length === 0) {
      const unitItems = (mode === 'all') ? 
        lmsData.units.flatMap(u => u.items) : 
        [...this.getCurrentUnit().items];
      
      pool = unitItems.map(item => ({
        item: item,
        category: "Arti Kosakata",
        categoryIcon: "📖",
        titleText: `Apa arti bahasa Indonesia dari:`,
        highlightText: item.english,
        subText: null,
        image: item.image,
        hasAudio: true,
        audioText: item.english,
        choices: [
          { text: item.indonesian, emoji: item.emoji, isCorrect: true },
          ...unitItems.filter(x => x.id !== item.id).slice(0, 3).map(w => ({ text: w.indonesian, emoji: w.emoji, isCorrect: false }))
        ].sort(() => Math.random() - 0.5),
        explanation: `"${item.english}" artinya "${item.indonesian}".`
      }));
    }

    // Acak pool soal
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledPool.slice(0, Math.min(count, shuffledPool.length));

    // Siapkan soal dan acak pilihan jawaban (choices)
    const questions = selectedQuestions.map(q => {
      const choices = q.choices ? [...q.choices].sort(() => Math.random() - 0.5) : [];
      return {
        ...q,
        choices: choices
      };
    });

    this.quizGameState = {
      questions: questions,
      currentIndex: 0,
      score: 0,
      answered: false
    };

    this.renderQuizQuestion(container);
  }

  renderQuizQuestion(container) {
    const state = this.quizGameState;
    if (!state) return;

    const q = state.questions[state.currentIndex];
    const progressPercent = ((state.currentIndex) / state.questions.length) * 100;
    const categoryBadge = q.category ? `<span class="quiz-category-tag">${q.categoryIcon || '🎯'} ${q.category}</span>` : '';
    const imgUrl = (q.item && q.item.image) ? q.item.image : (q.image || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400');
    const audioText = q.audioText || (q.item ? q.item.english : null);

    container.innerHTML = `
      <div class="modal-title-area">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
          <span class="modal-badge" style="background: #FEF3C7; color: #B45309;">📝 Soal ${state.currentIndex + 1} dari ${state.questions.length}</span>
          ${categoryBadge}
        </div>
        <div class="quiz-progress-wrapper">
          <div class="quiz-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 18px;">
        <img src="${imgUrl}" alt="Soal" style="width: 140px; height: 110px; object-fit: cover; border-radius: 14px; border: 3px solid #E0E7FF; margin-bottom: 10px;" onerror="this.src='https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400';">
        <p style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">${q.titleText}</p>
        <div style="font-size: 1.35rem; font-weight: 800; color: #4F46E5; margin: 4px 0;">
          ${q.highlightText}
        </div>
        ${q.subText ? `<p style="font-size: 0.9rem; color: #059669; font-style: italic; margin-bottom: 8px;">${q.subText}</p>` : ''}
        
        ${(q.hasAudio && audioText) ? `
          <button class="btn-audio-main" style="margin: 8px auto; padding: 6px 16px; font-size: 0.85rem;" onclick="app.audio.speak('${audioText.replace(/'/g, "\\'")}')">
            <span>🔊</span> Dengarkan Suara
          </button>
        ` : ''}
      </div>

      <div class="quiz-options" id="quiz-options-group">
        ${q.choices.map((choice, idx) => `
          <button class="quiz-option-btn" id="quiz-opt-${idx}" onclick="app.answerQuiz(${idx})">
            <span>${['A', 'B', 'C', 'D'][idx]}. ${choice.text}</span>
            <span style="font-size: 1.2rem;">${choice.emoji || ''}</span>
          </button>
        `).join('')}
      </div>

      <div id="quiz-feedback-area" style="display: none;"></div>
    `;

    state.answered = false;
  }

  answerQuiz(selectedIdx) {
    const state = this.quizGameState;
    if (!state || state.answered) return;
    state.answered = true;

    const q = state.questions[state.currentIndex];
    const selectedChoice = q.choices[selectedIdx];
    const isCorrect = selectedChoice.isCorrect;

    const btns = document.querySelectorAll('.quiz-option-btn');
    btns.forEach(b => b.disabled = true);

    const selectedBtn = document.getElementById(`quiz-opt-${selectedIdx}`);

    if (isCorrect) {
      state.score += 1;
      this.audio.playTone('correct');
      if (selectedBtn) selectedBtn.classList.add('correct');
    } else {
      this.audio.playTone('wrong');
      if (selectedBtn) selectedBtn.classList.add('wrong');
      // Highlight the correct one
      q.choices.forEach((c, i) => {
        if (c.isCorrect) {
          const btn = document.getElementById(`quiz-opt-${i}`);
          if (btn) btn.classList.add('correct');
        }
      });
    }

    // Tampilkan Kotak Penjelasan Edukatif agar siswa cepat memahami
    const feedbackArea = document.getElementById('quiz-feedback-area');
    if (feedbackArea) {
      feedbackArea.style.display = 'block';
      feedbackArea.innerHTML = `
        <div class="quiz-explanation-box">
          <div class="quiz-explanation-header ${isCorrect ? 'success' : 'wrong'}">
            <span>${isCorrect ? '🎉 Jawabanmu Benar!' : '💡 Yuk Pelajari Penjelasannya:'}</span>
          </div>
          <div class="quiz-explanation-text">
            ${q.explanation}
          </div>
          <button class="btn-next-question" onclick="app.nextQuizQuestion()">
            <span>➡️</span> ${state.currentIndex + 1 < state.questions.length ? 'Lanjut ke Soal Berikutnya' : 'Lihat Hasil Kuis'}
          </button>
        </div>
      `;
    }
  }

  nextQuizQuestion() {
    const state = this.quizGameState;
    if (!state) return;

    state.currentIndex++;
    const container = document.getElementById('game-modal-body');

    if (state.currentIndex < state.questions.length) {
      this.renderQuizQuestion(container);
    } else {
      // Selesai Kuis
      const starsEarned = state.score * 2;
      this.addStars(starsEarned);
      this.showCelebration(
        container, 
        `Kuis Selesai! Skor Kamu: ${state.score} / ${state.questions.length}`,
        `Hebat sekali! Kamu berhasil mengumpulkan +${starsEarned} Bintang Emas! ⭐`,
        starsEarned,
        () => this.openQuizGame()
      );
    }
  }

  // Tampilan Selebrasi Menang / Selesai
  showCelebration(container, title, subtitle, starsCount, retryCallback) {
    this.audio.playTone('fanfare');
    container.innerHTML = `
      <div class="result-celebration">
        <div class="result-emoji">🎉🏆🥳</div>
        <h3 class="modal-title" style="margin-bottom: 8px;">${title}</h3>
        <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 14px;">${subtitle}</p>
        <div class="stars-awarded">
          ${'⭐'.repeat(Math.max(1, starsCount))}
        </div>
        <div style="display: flex; justify-content: center; gap: 14px; margin-top: 20px;">
          <button class="btn-audio-main" onclick="app.closeModal()">
            <span>✅</span> Selesai & Kembali Belajar
          </button>
          <button class="btn-game btn-game-quiz" onclick="(${retryCallback})()">
            <span>🔄</span> Main Lagi
          </button>
        </div>
      </div>
    `;
  }

  closeModal() {
    this.audio.playTone('pop');
    const modal = document.getElementById('modal-game');
    if (modal) modal.classList.remove('active');
  }

  // ================= SISTEM LOGIN & PROFIL SISWA (ADAPTIVE PC & HP) =================
  openLoginModal(showProfileIfLoggedIn = true) {
    this.audio.playTone('pop');
    const modal = document.getElementById('modal-login');
    const container = document.getElementById('login-form-area');
    if (!modal || !container) return;

    if (this.isLoggedIn && showProfileIfLoggedIn) {
      // Tampilkan Kartu Profil Siswa (Jika sudah login)
      container.innerHTML = `
        <div class="profile-card-display">
          <div class="profile-avatar-big">${this.studentAvatar}</div>
          <h3 style="font-size: 1.6rem; font-weight: 800; color: #1E1B4B; margin-bottom: 4px;">${this.studentName}</h3>
          <div style="font-size: 1rem; font-weight: 700; color: #6366F1; margin-bottom: 12px;">🎒 ${this.studentClass} • Siswa Berprestasi</div>
          
          <div class="profile-stats-grid">
            <div class="profile-stat-box">
              <div class="profile-stat-value">⭐ ${this.stars}</div>
              <div class="profile-stat-lbl">Total Bintang</div>
            </div>
            <div class="profile-stat-box">
              <div class="profile-stat-value">🏆 Master</div>
              <div class="profile-stat-lbl">Tingkat Kemampuan</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
            <button class="btn-login-submit" onclick="app.closeLoginModal()">
              <span>🚀</span> Lanjut Belajar Sekarang
            </button>
            <button class="btn-game" style="justify-content: center; width: 100%; border-color: #CBD5E1;" onclick="app.renderLoginForm(true)">
              <span>✏️</span> Ubah Nama & Avatar
            </button>
          </div>
        </div>
      `;
    } else {
      this.renderLoginForm(false);
    }

    modal.classList.add('active');
  }

  renderLoginForm(isEditing = false) {
    const container = document.getElementById('login-form-area');
    if (!container) return;

    const avatars = ['🦁', '🚀', '🐱', '🐼', '🦊', '🦄', '🦖', '🦉'];
    const classes = ['Kelas IV-A', 'Kelas IV-B', 'Kelas IV-C', 'Kelas IV-D'];
    
    let selectedAvatar = this.studentAvatar || '🦁';
    let selectedClass = this.studentClass || 'Kelas IV-A';

    container.innerHTML = `
      <div class="login-form-title">${isEditing ? 'Ubah Profil Siswa' : 'Masuk untuk Mulai Belajar!'}</div>
      <div class="login-form-subtitle">Lengkapi namamu agar bintang dan pialamu tersimpan rapi!</div>

      <div class="form-group-kid">
        <label class="form-label-kid">👤 Nama Panggilan Kamu:</label>
        <input type="text" id="login-input-name" class="form-input-kid" placeholder="Ketik namamu di sini (misal: Budi / Siti)" value="${this.isLoggedIn ? this.studentName : ''}" maxlength="20" autofocus>
      </div>

      <div class="form-group-kid">
        <label class="form-label-kid">🏫 Pilihan Kelas:</label>
        <div class="class-selector-grid" id="class-select-group">
          ${classes.map(c => `
            <button type="button" class="btn-class-pill ${c === selectedClass ? 'active' : ''}" onclick="app.selectClassOption('${c}')">
              ${c}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="form-group-kid">
        <label class="form-label-kid">🎭 Pilih Karakter Avatar Lucu Kamu:</label>
        <div class="avatar-grid-select" id="avatar-select-group">
          ${avatars.map(a => `
            <button type="button" class="avatar-choice-btn ${a === selectedAvatar ? 'active' : ''}" onclick="app.selectAvatarOption('${a}')">
              ${a}
            </button>
          `).join('')}
        </div>
      </div>

      <button type="button" class="btn-login-submit" onclick="app.submitLogin()">
        <span>🚀</span> ${isEditing ? 'Simpan Perubahan' : 'Mulai Belajar Bahasa Inggris!'}
      </button>
    `;

    this.tempSelectedAvatar = selectedAvatar;
    this.tempSelectedClass = selectedClass;
  }

  selectClassOption(className) {
    this.audio.playTone('pop');
    this.tempSelectedClass = className;
    const btns = document.querySelectorAll('.btn-class-pill');
    btns.forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === className);
    });
  }

  selectAvatarOption(avatarChar) {
    this.audio.playTone('pop');
    this.tempSelectedAvatar = avatarChar;
    const btns = document.querySelectorAll('.avatar-choice-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === avatarChar);
    });
  }

  submitLogin() {
    const inputEl = document.getElementById('login-input-name');
    const name = inputEl ? inputEl.value.trim() : '';

    if (!name) {
      this.audio.playTone('wrong');
      this.showKidAlert({
        title: "Tulis Namamu Dulu Ya! 😊",
        message: "Supaya guru dan teman tahu siapa sang juara bintang!",
        hint: "Ketik nama panggilanmu di kolom yang tersedia.",
        icon: "✍️",
        type: "warning",
        badge: "Nama Masih Kosong",
        buttonText: "Siap, Aku Tulis! ✏️",
        onConfirm: () => {
          if (inputEl) inputEl.focus();
        }
      });
      return;
    }

    this.studentName = name;
    this.studentClass = this.tempSelectedClass || 'Kelas IV-A';
    this.studentAvatar = this.tempSelectedAvatar || '🦁';
    this.isLoggedIn = true;

    localStorage.setItem('sd4_student_name', this.studentName);
    localStorage.setItem('sd4_student_class', this.studentClass);
    localStorage.setItem('sd4_student_avatar', this.studentAvatar);

    this.updateStudentHeader();
    this.closeLoginModal();
    this.audio.playTone('fanfare');

    this.showKidAlert({
      title: `Selamat Datang, ${this.studentName}! 🎉`,
      message: `Senang sekali belajar bersamamu di ${this.studentClass}!`,
      hint: "Yuk dengarkan kata pertama dan kumpulkan bintang sebanyak-banyaknya!",
      icon: this.studentAvatar,
      type: "success",
      badge: "Profil Berhasil Disimpan",
      buttonText: "Ayo Mulai Belajar! 🚀"
    });
  }

  closeLoginModal() {
    this.audio.playTone('pop');
    const modal = document.getElementById('modal-login');
    if (modal) modal.classList.remove('active');
  }

  // Mobile Bottom Navigation Switcher
  switchMobileNav(tabName) {
    this.audio.playTone('pop');
    const tabs = ['materi', 'spelling', 'listen', 'quiz', 'profile'];
    tabs.forEach(t => {
      const btn = document.getElementById(`mob-nav-${t}`);
      if (btn) btn.classList.toggle('active', t === tabName);
    });

    if (tabName === 'materi') {
      const el = document.getElementById('vocab-card-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tabName === 'spelling') {
      this.openSpellingGame();
    } else if (tabName === 'listen') {
      this.openListenGame();
    } else if (tabName === 'quiz') {
      this.openQuizGame();
    } else if (tabName === 'profile') {
      this.openLoginModal(true);
    }
  }

  setupEventListeners() {
    // Tombol close modal game
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal();
    }

    // Modal background click to close
    const modal = document.getElementById('modal-game');
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal();
      };
    }

    // Tombol close modal login
    const loginCloseBtn = document.getElementById('modal-login-close-btn');
    if (loginCloseBtn) {
      loginCloseBtn.onclick = () => this.closeLoginModal();
    }

    // Modal login background click to close
    const loginModal = document.getElementById('modal-login');
    if (loginModal) {
      loginModal.onclick = (e) => {
        if (e.target === loginModal) this.closeLoginModal();
      };
    }

    // Mascot click voice greeting
    const mascot = document.getElementById('hero-mascot');
    if (mascot) {
      mascot.onclick = () => {
        this.audio.playTone('pop');
        const greetings = [
          "Hello! You are doing amazing!",
          "Great job! Keep learning English!",
          "Practice makes perfect! You are a superstar!",
          "English is fun and easy!"
        ];
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        this.showToast({ icon: '🦉', message: `Maskot: "${randomGreeting}"` });
        this.audio.speak(randomGreeting);
      };
    }

    // Toggle sound button
    const muteBtn = document.getElementById('btn-mute-toggle');
    if (muteBtn) {
      muteBtn.onclick = () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.title = isMuted ? 'Suara dinonaktifkan' : 'Suara aktif';
        this.showToast({
          icon: isMuted ? '🔇' : '🔊',
          message: isMuted ? 'Suara telah dimatikan' : 'Suara aktif kembali!'
        });
      };
    }

    // Tombol Konfirmasi Kid Alert
    const kidAlertBtn = document.getElementById('kid-alert-btn-action');
    if (kidAlertBtn) {
      kidAlertBtn.onclick = () => this.closeKidAlert();
    }

    // Klik background overlay Kid Alert untuk menutup
    const kidAlertModal = document.getElementById('modal-kid-alert');
    if (kidAlertModal) {
      kidAlertModal.onclick = (e) => {
        if (e.target === kidAlertModal) this.closeKidAlert();
      };
    }
  }

  // Mini confetti animasi dengan canvas
  triggerMiniConfetti() {
    try {
      const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6'];
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.top = '70px';
        particle.style.right = '120px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.transition = 'all 0.8s ease-out';
        document.body.appendChild(particle);

        const destX = (Math.random() - 0.5) * 200;
        const destY = Math.random() * 150;

        setTimeout(() => {
          particle.style.transform = `translate(${destX}px, ${destY}px) scale(0)`;
          particle.style.opacity = '0';
        }, 20);

        setTimeout(() => particle.remove(), 900);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

// Inisialisasi App saat DOM dimuat
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new EnglishLMSApp();
});
