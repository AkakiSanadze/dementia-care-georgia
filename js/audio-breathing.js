// მომვლელის დამამშვიდებელი სუნთქვისა (4-7-8) და Web Audio ხმის მოდული
// არ საჭიროებს გარე აუდიო ფაილებს — სინთეზირდება პირდაპირ ბრაუზერში

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.chimeEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ნაზი, მედიტაციური ტონი 4-7-8 სუნთქვის ფაზების გადასვლებისთვის
  playChime(freq = 432, duration = 2.4) {
    if (!this.chimeEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted yet or not supported
    }
  }
}

// 4-7-8 სუნთქვის მართვის კლასი
class BreathingTrainer {
  constructor(soundEngine) {
    this.sound = soundEngine;
    this.isActive = false;
    this.stage = 'idle'; // 'inhale' (4s), 'hold' (7s), 'exhale' (8s)
    this.timer = null;
    this.secondsLeft = 0;
    this.cycleCount = 0;
    this.maxCycles = 4;

    this.affirmations = [
      "შენ შესანიშნავად უმკლავდები. შენი დაღლილობა ბუნებრივია.",
      "შენ ადამიანი ხარ და გაქვს დასვენებისა და სუნთქვის უფლება.",
      "ხმა ჩამოწიე, მხრები მოადუნე. ეს წუთები შენია.",
      "სიყვარული დარჩენაშია და არა სრულყოფილებაში. შენ მარტო არ ხარ."
    ];

    this.initDOMElements();
  }

  initDOMElements() {
    this.circle = document.getElementById('breathCircle');
    this.actionText = document.getElementById('breathActionText');
    this.counterText = document.getElementById('breathCounter');
    this.instruction = document.getElementById('breathInstruction');
    this.affirmationEl = document.getElementById('breathAffirmation');
    this.startBtn = document.getElementById('breathToggleBtn');
    this.cycleBadge = document.getElementById('breathCycleBadge');

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.toggle());
    }

    if (this.circle) {
      this.circle.addEventListener('click', () => this.toggle());
      this.circle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    if (this.instruction) {
      this.instruction.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.sound.init();
    this.isActive = true;
    this.cycleCount = 0;
    if (this.startBtn) {
      this.startBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> <span>შეჩერება</span>`;
      this.startBtn.classList.add('active');
    }
    this.runInhale();
  }

  stop() {
    this.isActive = false;
    clearTimeout(this.timer);
    this.stage = 'idle';
    if (this.circle) {
      this.circle.className = 'breath-circle';
      this.circle.style.transform = 'scale(1)';
    }
    if (this.actionText) this.actionText.textContent = "დაიწყე";
    if (this.counterText) this.counterText.textContent = "";
    if (this.instruction) this.instruction.textContent = "დააჭირეთ ღილაკს ან წრეს 3-წუთიანი ციკლის დასაწყებად";
    if (this.startBtn) {
      this.startBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> <span>4-7-8 ციკლის დაწყება</span>`;
      this.startBtn.classList.remove('active');
    }
  }

  runInhale() {
    if (!this.isActive) return;
    this.stage = 'inhale';
    this.secondsLeft = 4;
    this.cycleCount++;

    if (this.cycleBadge) {
      this.cycleBadge.textContent = `ციკლი: ${this.cycleCount} / ${this.maxCycles}`;
    }
    if (this.affirmationEl) {
      const idx = (this.cycleCount - 1) % this.affirmations.length;
      this.affirmationEl.textContent = this.affirmations[idx];
    }

    if (this.circle) {
      this.circle.className = 'breath-circle inhaling';
    }
    if (this.actionText) this.actionText.textContent = "ჩაისუნთქე";
    if (this.instruction) this.instruction.textContent = "ნელა, ცხვირით... გაავსე ფილტვები მშვიდი ჰაერით";
    this.sound.playChime(440, 3.5);

    this.tickCountdown(() => this.runHold());
  }

  runHold() {
    if (!this.isActive) return;
    this.stage = 'hold';
    this.secondsLeft = 7;

    if (this.circle) {
      this.circle.className = 'breath-circle holding';
    }
    if (this.actionText) this.actionText.textContent = "შეიკავე";
    if (this.instruction) this.instruction.textContent = "შეინარჩუნე სიმშვიდე, მხრები ჩამოწიე...";
    this.sound.playChime(528, 2.0);

    this.tickCountdown(() => this.runExhale());
  }

  runExhale() {
    if (!this.isActive) return;
    this.stage = 'exhale';
    this.secondsLeft = 8;

    if (this.circle) {
      this.circle.className = 'breath-circle exhaling';
    }
    if (this.actionText) this.actionText.textContent = "ამოისუნთქე";
    if (this.instruction) this.instruction.textContent = "პირით, რბილად და ნელა... გაუშვი დაძაბულობა";
    this.sound.playChime(396, 4.0);

    this.tickCountdown(() => {
      if (this.cycleCount >= this.maxCycles) {
        this.completeSession();
      } else {
        this.runInhale();
      }
    });
  }

  tickCountdown(onComplete) {
    if (this.counterText) this.counterText.textContent = this.secondsLeft;
    if (this.secondsLeft <= 0) {
      onComplete();
      return;
    }
    this.timer = setTimeout(() => {
      if (!this.isActive) return;
      this.secondsLeft--;
      this.tickCountdown(onComplete);
    }, 1000);
  }

  completeSession() {
    this.stop();
    if (this.actionText) this.actionText.textContent = "დასრულდა";
    if (this.instruction) this.instruction.textContent = "ნერვული სისტემა დასტაბილურდა. სუნთქვის ციკლი წარმატებით შესრულდა.";
    this.sound.playChime(528, 4.5);
    if (window.showAppToast) {
      window.showAppToast("4-7-8 სუნთქვითი ციკლი დასრულდა.");
    }
  }
}
