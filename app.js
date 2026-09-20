// Audio & SFX Engine with real music tracks & sound effects
class AudioManager {
  constructor() {
    this.musicAudio = new Audio();
    this.musicAudio.loop = true;
    this.musicAudio.volume = 0.45;
    this.soundEnabled = true;

    this.sfxMap = {
      stamp: new Audio('assets/sfx/interface/error_005.ogg'),
      pop: new Audio('assets/sfx/interface/bong_001.ogg'),
      scan: new Audio('assets/sfx/interface/glitch_002.ogg'),
      click: new Audio('assets/sfx/interface/click_001.ogg'),
      success: new Audio('assets/sfx/interface/drop_001.ogg')
    };

    Object.values(this.sfxMap).forEach(s => s.volume = 0.6);
    this.synthCtx = null;
  }

  setMusicTrack(filename) {
    const wasPlaying = !this.musicAudio.paused;
    this.musicAudio.src = `assets/music/${filename}`;
    if (wasPlaying && this.soundEnabled) {
      this.musicAudio.play().catch(() => {});
    }
  }

  startMusic() {
    if (!this.musicAudio.src || this.musicAudio.src === '') {
      this.setMusicTrack('happy-beats-business-moves-vol-1-by-ende-dot-app.mp3');
    }
    if (this.soundEnabled) {
      this.musicAudio.play().catch(e => console.log('Audio autoplay prevented:', e));
    }
  }

  pauseMusic() {
    this.musicAudio.pause();
  }

  restartMusic() {
    this.musicAudio.currentTime = 0;
    if (this.soundEnabled) {
      this.musicAudio.play().catch(() => {});
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.musicAudio.play().catch(() => {});
    } else {
      this.musicAudio.pause();
    }
    return this.soundEnabled;
  }

  playSFX(key) {
    if (!this.soundEnabled) return;
    try {
      const sfx = this.sfxMap[key];
      if (sfx) {
        sfx.currentTime = 0;
        sfx.play().catch(() => {
          this.playSynthFallback(key);
        });
      } else {
        this.playSynthFallback(key);
      }
    } catch (e) {
      this.playSynthFallback(key);
    }
  }

  playSynthFallback(key) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!this.synthCtx && AudioCtx) this.synthCtx = new AudioCtx();
    if (!this.synthCtx) return;
    if (this.synthCtx.state === 'suspended') this.synthCtx.resume();

    const osc = this.synthCtx.createOscillator();
    const gain = this.synthCtx.createGain();
    const now = this.synthCtx.currentTime;

    if (key === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(this.synthCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (key === 'scan') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.synthCtx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (key === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.synthCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (key === 'success') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = this.synthCtx.createOscillator();
        const g = this.synthCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.05);
        g.gain.setValueAtTime(0.15, now + idx * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);
        o.connect(g);
        g.connect(this.synthCtx.destination);
        o.start(now + idx * 0.05);
        o.stop(now + idx * 0.05 + 0.4);
      });
    }
  }
}

// Particle & Confetti FX Engine
class ParticleFX {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  burstConfetti() {
    if (!this.canvas || !this.ctx) return;
    const colors = ['#ffc800', '#10b981', '#38bdf8', '#ffffff', '#ff9500'];
    const count = 75;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        opacity: 1,
        life: 0.95 + Math.random() * 0.03
      });
    }
    this.render();
  }

  render() {
    if (!this.ctx || this.particles.length === 0) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.rotation += p.rotationSpeed;
      p.opacity *= p.life;

      if (p.opacity < 0.02) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.render());
    }
  }
}

// Fast-Paced 16s Video Reel Engine
class VideoReelEngine {
  constructor() {
    this.totalDuration = 16.0; // Fast-paced 16.0s
    this.currentTime = 0.0;
    this.isPlaying = false;
    this.lastTimestamp = null;
    this.currentScene = 1;
    this.lastSoundScene = 0;

    this.audio = new AudioManager();
    this.particles = new ParticleFX('fxCanvas');

    this.scenes = [
      { id: 1, start: 0.0, end: 3.2, name: 'Gmail Alert', element: document.getElementById('scene1') },
      { id: 2, start: 3.2, end: 6.8, name: 'Forward Email', element: document.getElementById('scene2') },
      { id: 3, start: 6.8, end: 10.2, name: 'AI Parsing', element: document.getElementById('scene3') },
      { id: 4, start: 10.2, end: 13.5, name: '1-Tap Checkout', element: document.getElementById('scene4') },
      { id: 5, start: 13.5, end: 16.0, name: 'Active Policy', element: document.getElementById('scene5') }
    ];

    this.initElements();
    this.attachEvents();
    this.updateUI(0);
    this.initVisualizer();
  }

  initElements() {
    this.playOverlay = document.getElementById('videoPlayOverlay');
    this.bigPlayBtn = document.getElementById('bigPlayBtn');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.playPauseIcon = document.getElementById('playPauseIcon');
    this.timelineTrack = document.getElementById('timelineTrack');
    this.timelineFill = document.getElementById('timelineFill');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.restartBtn = document.getElementById('restartBtn');
    this.musicSelect = document.getElementById('musicTrackSelect');
    this.scenePills = document.querySelectorAll('.scene-pill');
    this.ambientGlow = document.getElementById('ambientGlow');
    this.simCursor = document.getElementById('simCursor');
    this.videoScreen = document.getElementById('videoScreen');
  }

  attachEvents() {
    this.bigPlayBtn.addEventListener('click', () => {
      this.playOverlay.classList.add('hidden');
      this.audio.setMusicTrack(this.musicSelect.value);
      this.audio.startMusic();
      this.startPlay();
    });

    this.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.restartBtn.addEventListener('click', () => {
      this.audio.restartMusic();
      this.seekTo(0);
    });

    this.soundToggleBtn.addEventListener('click', () => {
      const enabled = this.audio.toggleSound();
      this.soundIcon.textContent = enabled ? '🔊' : '🔇';
    });

    this.musicSelect.addEventListener('change', (e) => {
      this.audio.setMusicTrack(e.target.value);
    });

    this.timelineTrack.addEventListener('click', (e) => {
      const rect = this.timelineTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      this.seekTo(progress * this.totalDuration);
    });

    this.scenePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const sceneNum = parseInt(pill.dataset.scene, 10);
        const targetScene = this.scenes.find(s => s.id === sceneNum);
        if (targetScene) {
          this.seekTo(targetScene.start + 0.05);
        }
      });
    });

    const videoTapBtn = document.getElementById('videoTapBtn');
    if (videoTapBtn) {
      videoTapBtn.addEventListener('click', () => {
        this.audio.playSFX('click');
        this.audio.playSFX('success');
      });
    }
  }

  initVisualizer() {
    this.visualizerBars = document.querySelectorAll('.audio-visualizer-bar .bar');
    setInterval(() => {
      if (this.isPlaying && this.audio.soundEnabled) {
        this.visualizerBars.forEach(bar => {
          const height = 4 + Math.random() * 20;
          bar.style.height = `${height}px`;
        });
      } else {
        this.visualizerBars.forEach(bar => bar.style.height = '4px');
      }
    }, 80);
  }

  startPlay() {
    this.isPlaying = true;
    this.playPauseIcon.textContent = '⏸';
    this.audio.startMusic();
    this.lastTimestamp = performance.now();
    requestAnimationFrame((ts) => this.tick(ts));
  }

  pausePlay() {
    this.isPlaying = false;
    this.playPauseIcon.textContent = '▶';
    this.audio.pauseMusic();
  }

  togglePlay() {
    if (this.playOverlay && !this.playOverlay.classList.contains('hidden')) {
      this.playOverlay.classList.add('hidden');
    }
    if (this.isPlaying) {
      this.pausePlay();
    } else {
      this.startPlay();
    }
  }

  seekTo(time) {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
    this.audio.musicAudio.currentTime = (this.currentTime % this.audio.musicAudio.duration) || 0;
    this.updateUI(this.currentTime);
    this.renderFrame(this.currentTime);
  }

  tick(timestamp) {
    if (!this.isPlaying) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.currentTime += delta;

    if (this.currentTime >= this.totalDuration) {
      this.currentTime = this.totalDuration;
      this.pausePlay();
    }

    this.updateUI(this.currentTime);
    this.renderFrame(this.currentTime);

    if (this.isPlaying) {
      requestAnimationFrame((ts) => this.tick(ts));
    }
  }

  updateUI(time) {
    const progress = (time / this.totalDuration) * 100;
    this.timelineFill.style.width = `${progress}%`;

    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    this.timeDisplay.textContent = `${mins}:${secs} / 0:16`;
  }

  renderFrame(time) {
    const activeScene = this.scenes.find(s => time >= s.start && time < s.end) || this.scenes[this.scenes.length - 1];

    if (activeScene && activeScene.id !== this.currentScene) {
      this.currentScene = activeScene.id;
      this.onSceneEnter(activeScene.id);
    }

    this.scenes.forEach(s => {
      if (s.id === this.currentScene) {
        s.element.classList.remove('hidden');
      } else {
        s.element.classList.add('hidden');
      }
    });

    this.scenePills.forEach(pill => {
      if (parseInt(pill.dataset.scene, 10) === this.currentScene) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Scene 2 Cursor Animation (Clicking Send on Gmail Forward)
    if (this.currentScene === 2 && this.simCursor) {
      this.simCursor.classList.add('visible');
      const s2Progress = (time - 3.2) / 3.6;
      this.simCursor.style.left = `${45 + s2Progress * 20}%`;
      this.simCursor.style.top = `${65 - s2Progress * 5}%`;
      if (s2Progress > 0.7 && s2Progress < 0.8 && this.lastSoundScene !== 2.5) {
        this.lastSoundScene = 2.5;
        this.audio.playSFX('click');
      }
    }
    // Scene 4 Cursor Animation (Clicking 1-Tap Checkout)
    else if (this.currentScene === 4 && this.simCursor) {
      this.simCursor.classList.add('visible');
      const s4Progress = (time - 10.2) / 3.3;
      this.simCursor.style.left = `${46 + s4Progress * 8}%`;
      this.simCursor.style.top = `${68 - s4Progress * 6}%`;

      if (s4Progress > 0.6 && s4Progress < 0.7 && this.lastSoundScene !== 4.5) {
        this.lastSoundScene = 4.5;
        this.audio.playSFX('click');
        const ripple = document.getElementById('successRipple');
        if (ripple) {
          ripple.style.animation = 'ripple-expand 0.5s ease-out';
          setTimeout(() => ripple.style.animation = '', 500);
        }
      }
    } else if (this.simCursor) {
      this.simCursor.classList.remove('visible');
    }
  }

  onSceneEnter(sceneId) {
    if (sceneId === 1) {
      this.audio.playSFX('pop');
      if (this.ambientGlow) this.ambientGlow.style.background = 'radial-gradient(circle, rgba(255, 200, 0, 0.28) 0%, transparent 70%)';
    } else if (sceneId === 2) {
      this.audio.playSFX('pop');
      if (this.ambientGlow) this.ambientGlow.style.background = 'radial-gradient(circle, rgba(26, 115, 232, 0.3) 0%, transparent 70%)';
    } else if (sceneId === 3) {
      this.audio.playSFX('scan');
      if (this.ambientGlow) this.ambientGlow.style.background = 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, transparent 70%)';
    } else if (sceneId === 4) {
      this.audio.playSFX('pop');
      if (this.ambientGlow) this.ambientGlow.style.background = 'radial-gradient(circle, rgba(255, 200, 0, 0.35) 0%, transparent 70%)';
    } else if (sceneId === 5) {
      this.audio.playSFX('success');
      this.particles.burstConfetti();
      if (this.ambientGlow) this.ambientGlow.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)';
    }
  }
}

// Interactive Sandbox Manager with default Under RM 80
class SandboxManager {
  constructor(audio) {
    this.audio = audio;
    this.airlineSelect = document.getElementById('simAirline');
    this.destSelect = document.getElementById('simDestination');
    this.daysInput = document.getElementById('simDays');
    this.travelersInput = document.getElementById('simTravelers');
    this.planButtons = document.querySelectorAll('.plan-toggle-btn');
    
    this.currentPlan = 'Gold';
    this.currentRate = 6.0; // 8 days * 1 pax * 6 = RM 48.00

    this.btnTrigger = document.getElementById('btnSimulateTrigger');
    this.btnForward = document.getElementById('btnSimForward');
    this.btnBuyNow = document.getElementById('btnSimBuyNow');
    this.btnReset = document.getElementById('btnSimReset');

    this.states = {
      idle: document.getElementById('simStateIdle'),
      alert: document.getElementById('simStateAlert'),
      parsing: document.getElementById('simStateParsing'),
      quote: document.getElementById('simStateQuoteReady'),
      success: document.getElementById('simStateSuccess')
    };

    this.initEvents();
  }

  initEvents() {
    this.planButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.planButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPlan = btn.dataset.plan;
        this.currentRate = parseFloat(btn.dataset.rate);
      });
    });

    this.btnTrigger.addEventListener('click', () => this.showBankAlert());
    this.btnForward.addEventListener('click', () => this.runAIParsing());
    this.btnBuyNow.addEventListener('click', () => this.completePurchase());
    this.btnReset.addEventListener('click', () => this.resetSandbox());
  }

  showState(stateName) {
    Object.keys(this.states).forEach(key => {
      if (key === stateName) {
        this.states[key].classList.remove('hidden');
        this.states[key].classList.add('active');
      } else {
        this.states[key].classList.add('hidden');
        this.states[key].classList.remove('active');
      }
    });
  }

  showBankAlert() {
    if (this.audio) this.audio.playSFX('pop');
    const airline = this.airlineSelect.value;
    const dest = this.destSelect.value;

    document.getElementById('simAlertAirline').textContent = airline;
    document.getElementById('simAlertDest').textContent = dest;

    this.showState('alert');
  }

  runAIParsing() {
    if (this.audio) this.audio.playSFX('scan');
    this.showState('parsing');

    setTimeout(() => {
      this.calculateAndShowQuote();
    }, 1000);
  }

  calculateAndShowQuote() {
    if (this.audio) this.audio.playSFX('pop');
    const days = parseInt(this.daysInput.value, 10) || 8;
    const pax = parseInt(this.travelersInput.value, 10) || 1;
    const total = days * pax * this.currentRate;

    document.getElementById('simTotalAmount').textContent = `RM ${total.toFixed(2)}`;
    document.getElementById('simQuoteDest').textContent = this.destSelect.value;
    document.getElementById('simQuoteDays').textContent = `${days} Days`;
    document.getElementById('simQuotePax').textContent = `${pax} Pax`;
    document.getElementById('simQuotePlan').textContent = `${this.currentPlan} Tier (RM ${total.toFixed(2)})`;

    this.showState('quote');
  }

  completePurchase() {
    if (this.audio) this.audio.playSFX('click');
    setTimeout(() => {
      if (this.audio) this.audio.playSFX('success');
      const randomPolicyNum = `ETQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      document.getElementById('simCertPolicyNo').textContent = randomPolicyNum;
      this.showState('success');
    }, 250);
  }

  resetSandbox() {
    this.showState('idle');
  }
}

// Feedback & Validation Manager
class FeedbackManager {
  constructor(audio) {
    this.audio = audio;
    this.form = document.getElementById('feedbackForm');
    this.successMsg = document.getElementById('feedbackSuccessMsg');
    this.feedContainer = document.getElementById('feedItemsContainer');

    this.sampleFeedback = [
      { text: '"This is so seamless! Forwarding the Gmail confirmation and getting an instant quote for RM 48 without typing my IC or address is awesome."', tag: 'Definitely Yes • Frequent Flyer' },
      { text: '"The pricing under RM 80 makes it an absolute no-brainer impulse buy whenever I fly."', tag: 'Pricing (RM 48) • Pilot Tester' },
      { text: '"Love the automatic flight delay payout. If my flight to Tokyo is delayed, having it auto-payout to Maybank is huge."', tag: 'Auto Delay • Verified Traveler' }
    ];

    this.init();
  }

  init() {
    this.renderFeedback();

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const likelihood = document.querySelector('input[name="likelihood"]:checked')?.value || 'Definitely';
      const comment = document.getElementById('feedbackComments').value.trim();
      const email = document.getElementById('feedbackEmail').value.trim();

      if (comment) {
        this.sampleFeedback.unshift({
          text: `"${comment}"`,
          tag: `${likelihood} • ${email ? 'Community User' : 'Anonymous'}`
        });
        this.renderFeedback();
      }

      this.successMsg.classList.remove('hidden');
      this.form.reset();
      if (this.audio) this.audio.playSFX('success');

      setTimeout(() => {
        this.successMsg.classList.add('hidden');
      }, 5000);
    });
  }

  renderFeedback() {
    this.feedContainer.innerHTML = '';
    this.sampleFeedback.slice(0, 5).forEach(item => {
      const el = document.createElement('div');
      el.className = 'feed-item';
      el.innerHTML = `
        <span class="feed-text">${item.text}</span>
        <span class="feed-tag">${item.tag}</span>
      `;
      this.feedContainer.appendChild(el);
    });
  }
}

// Initialize Everything on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.videoEngine = new VideoReelEngine();
  window.sandbox = new SandboxManager(window.videoEngine.audio);
  window.feedback = new FeedbackManager(window.videoEngine.audio);
});
