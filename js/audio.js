// Audio System: Text-to-Speech (TTS) Bahasa Inggris + Web Audio Sound Effects (SFX)
// Didesain khusus untuk anak-anak: suara jernih, ada opsi pelan (turtle 🐢), dan ejaan per huruf!

class AudioController {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.audioCtx = null;
    this.isMuted = false;
    this.initVoice();

    // Pastikan voices ter-load di berbagai browser (Chrome, Edge, Safari)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.initVoice();
    }
  }

  // Pilih voice bahasa Inggris terbaik & ramah (en-US / en-GB)
  initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Cari voice US/GB natural
    this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Jenny')))
      || voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'))
      || null;
  }

  // Init AudioContext saat interaksi pengguna
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pelafalan Kata Normal
  speak(text, onEndCallback = null) {
    if (this.isMuted || !this.synth) return;
    this.synth.cancel(); // Hentikan suara sebelumnya

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Kecepatan nyaman untuk anak SD
    utterance.pitch = 1.1; // Nada sedikit ceria

    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }

    this.synth.speak(utterance);
  }

  // Pelafalan Lambat (Mode Kura-kura 🐢) agar anak dapat mendengar setiap suku kata
  speakSlow(text, onEndCallback = null) {
    if (this.isMuted || !this.synth) return;
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = 'en-US';
    utterance.rate = 0.6; // Sangat lambat dan jelas
    utterance.pitch = 1.05;

    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }

    this.synth.speak(utterance);
  }

  // Mengeja Huruf Demi Huruf (Spelling out loud: "A - P - P - L - E ... Apple!")
  spellOutLoud(text, onProgressCallback = null, onEndCallback = null) {
    if (this.isMuted || !this.synth) return;
    this.synth.cancel();

    // Ambil hanya huruf alfabet
    const letters = text.toUpperCase().replace(/[^A-Z]/g, '').split('');
    if (letters.length === 0) return;

    let index = 0;

    const speakNextLetter = () => {
      if (index < letters.length) {
        const letter = letters[index];
        if (onProgressCallback) onProgressCallback(letter, index);

        const letterUtterance = new SpeechSynthesisUtterance(letter);
        if (this.voice) letterUtterance.voice = this.voice;
        letterUtterance.lang = 'en-US';
        letterUtterance.rate = 0.85;
        letterUtterance.pitch = 1.15;

        letterUtterance.onend = () => {
          index++;
          setTimeout(speakNextLetter, 300);
        };

        this.synth.speak(letterUtterance);
      } else {
        // Setelah selesai dieja, sebutkan kata utuhnya
        setTimeout(() => {
          this.playTone('pop');
          const fullUtterance = new SpeechSynthesisUtterance(text);
          if (this.voice) fullUtterance.voice = this.voice;
          fullUtterance.lang = 'en-US';
          fullUtterance.rate = 0.9;
          fullUtterance.onend = () => {
            if (onEndCallback) onEndCallback();
          };
          this.synth.speak(fullUtterance);
        }, 400);
      }
    };

    speakNextLetter();
  }

  // Efek Suara Sintetis (Web Audio API - No external mp3 files required!)
  playTone(type) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'click' || type === 'pop') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'correct') {
        // Nada ceria sukses (Arpeggio C - E - G - C)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const noteTime = now + idx * 0.09;
          gain.gain.setValueAtTime(0.25, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.25);
        });
      } else if (type === 'wrong') {
        // Nada lembut salah (Boing lembut, tidak menakutkan anak)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'star' || type === 'fanfare') {
        // Fanfare kemenangan
        const fanfareNotes = [
          { f: 523.25, t: 0, d: 0.12 },
          { f: 659.25, t: 0.12, d: 0.12 },
          { f: 783.99, t: 0.24, d: 0.12 },
          { f: 1046.50, t: 0.38, d: 0.4 }
        ];
        fanfareNotes.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = note.f;
          const noteTime = now + note.t;
          gain.gain.setValueAtTime(0.3, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(noteTime);
          osc.stop(noteTime + note.d);
        });
      }
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.synth) {
      this.synth.cancel();
    }
    return this.isMuted;
  }
}

// Inisialisasi Audio Controller Global
const audioCtrl = new AudioController();
