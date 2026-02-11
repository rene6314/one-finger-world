const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = 360;
const H = 640;

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W; canvas.height = H;
  canvas.style.width = W * scale + "px";
  canvas.style.height = H * scale + "px";
  canvas.style.margin = "auto";
}
resize();
window.addEventListener("resize", resize);

/* ===== 1. DATOS, GUARDADO, MISIONES Y AJUSTES ===== */
let totalCoins = parseInt(localStorage.getItem("oneFingerCoins")) || 0;
let currentSkinIndex = parseInt(localStorage.getItem("oneFingerSkinIndex")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("oneFingerOwnedSkinsIndices")) || [0];

// Ajustes de Audio
let musicMuted = localStorage.getItem("oneFingerMusicMuted") === "true";
let sfxMuted = localStorage.getItem("oneFingerSfxMuted") === "true";

let leaderboard = JSON.parse(localStorage.getItem("oneFingerLB_V2")) || [
  {name: "CPU", score: 5}, {name: "CPU", score: 4}, 
  {name: "CPU", score: 3}, {name: "CPU", score: 2}, {name: "CPU", score: 1}
];

let mission = JSON.parse(localStorage.getItem("oneFingerMission")) || generateMission();
let missionCompleted = localStorage.getItem("oneFingerMissionDone") === "true";

function generateMission() {
  const types = [
    { text: "Llega al Nivel 5", type: "level", target: 5 },
    { text: "Recoge 10 Monedas", type: "coin", target: 10 },
    { text: "Llega al Nivel 8", type: "level", target: 8 },
    { text: "Recoge 20 Monedas", type: "coin", target: 20 },
    { text: "Llega al Nivel 10", type: "level", target: 10 }
  ];
  const m = types[Math.floor(Math.random() * types.length)];
  m.progress = 0;
  return m;
}

function saveGame() {
  localStorage.setItem("oneFingerCoins", totalCoins);
  localStorage.setItem("oneFingerSkinIndex", currentSkinIndex);
  localStorage.setItem("oneFingerOwnedSkinsIndices", JSON.stringify(ownedSkins));
  localStorage.setItem("oneFingerLB_V2", JSON.stringify(leaderboard));
  localStorage.setItem("oneFingerMission", JSON.stringify(mission));
  localStorage.setItem("oneFingerMissionDone", missionCompleted);
  localStorage.setItem("oneFingerMusicMuted", musicMuted);
  localStorage.setItem("oneFingerSfxMuted", sfxMuted);
}

function checkHighScore(finalLevel) {
  let lowestScore = leaderboard[leaderboard.length - 1].score;
  if (finalLevel > lowestScore) {
    setTimeout(() => {
      let name = prompt("¡NUEVO RÉCORD! Ingresa tus iniciales (Max 3):");
      if (!name) name = "YO";
      name = name.substring(0, 3).toUpperCase();
      leaderboard.push({ name: name, score: finalLevel });
      leaderboard.sort((a, b) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 5);
      saveGame();
    }, 100);
  }
}

function checkMission(type, amount) {
  if (missionCompleted) return;
  if (mission.type === type) {
    if (type === "level") mission.progress = amount;
    if (type === "coin") mission.progress += amount;
    if (mission.progress >= mission.target) {
      missionCompleted = true; totalCoins += 100; saveGame(); sfx.levelUp(); 
    } else { saveGame(); }
  }
}

/* ===== 2. CATÁLOGO DE SKINS ===== */
const skins = [
  {
    name: "Classic", price: 0, color: "#fff",
    draw: (ctx, r) => {
      let grd = ctx.createRadialGradient(-r/3, -r/3, r/4, 0, 0, r);
      grd.addColorStop(0, "#fff"); grd.addColorStop(1, "#aaa");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: "Gold", price: 100, color: "#ffd700",
    draw: (ctx, r) => {
      let grd = ctx.createRadialGradient(-r/3, -r/3, r/5, 0, 0, r);
      grd.addColorStop(0, "#fff"); grd.addColorStop(0.3, "#ffd700"); grd.addColorStop(1, "#b8860b");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.arc(-r/3, -r/3, r/4, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: "Creeper", price: 300, color: "#00AA00",
    draw: (ctx, r) => {
      ctx.fillStyle = "#00AA00"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(-r/2, -r/2, r, r/4); 
      ctx.fillStyle = "#000";
      let s = r * 0.4;
      ctx.fillRect(-s - (s/4), -s/1.5, s, s); ctx.fillRect(s/4, -s/1.5, s, s);      
      ctx.fillRect(-s/4, 0, s/2, s/1.5); ctx.fillRect(-s, s/1.5, s/1.2, s); ctx.fillRect(s/4, s/1.5, s/1.2, s);   
    }
  },
  {
    name: "Enderman", price: 400, color: "#111",
    draw: (ctx, r) => {
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#d35dff"; ctx.shadowBlur = 10; ctx.shadowColor = "#d35dff"; 
      let w = r * 0.8; let h = r * 0.25;
      ctx.fillRect(-w/1.1, -h/2, w, h); ctx.fillRect(w/10, -h/2, w, h); ctx.shadowBlur = 0; 
    }
  },
  {
    name: "Cyber", price: 600, color: "#00ffff",
    draw: (ctx, r) => {
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r-2, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "#00ffff"; ctx.beginPath(); ctx.arc(0, 0, r/2.5, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: "Toxic", price: 800, color: "#39ff14",
    draw: (ctx, r) => {
      let grd = ctx.createRadialGradient(0, 0, r/2, 0, 0, r);
      grd.addColorStop(0, "#000"); grd.addColorStop(1, "#39ff14");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; 
      ctx.beginPath(); ctx.arc(0, -r/2, r/4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-r/2.2, r/3, r/4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(r/2.2, r/3, r/4, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: "Ninja", price: 1500, color: "#ff0000",
    draw: (ctx, r) => {
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#ff0000"; ctx.fillRect(-r, -r/4, r*2, r/2);
      ctx.fillStyle = "#fff"; 
      ctx.beginPath(); ctx.arc(-r/3, 0, r/5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(r/3, 0, r/5, 0, Math.PI*2); ctx.fill();
    }
  }
];

/* ===== 3. AUDIO ===== */
let audioCtx;
let musicTick = 0;
const scalePop = [0, 4, 7, 9, 12]; 
const scaleElectro = [0, 2, 3, 5, 7, 8, 10, 12]; 

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    playMusicStep();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(freq, type, duration, vol, isMusic = false) {
  if (isMusic && musicMuted) return; 
  if (!isMusic && sfxMuted) return;

  if (!audioCtx) return;
  try {
    const gain = audioCtx.createGain();
    const osc = audioCtx.createOscillator();
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    if (type === "white") {
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } else {
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (!isMusic) {
         osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      } 
      else if (type === "sawtooth") {
         osc.frequency.exponentialRampToValueAtTime(freq * 0.9, audioCtx.currentTime + duration);
      }
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  } catch (e) {}
}

function playMusicStep() {
  if (!started && !isInShop && !isInRecords) { setTimeout(playMusicStep, 200); return; }
  
  let isElectro = level >= 6; 
  let baseTempo = isElectro ? 0.11 : 0.13; 
  let currentTempo = isFever ? 0.08 : baseTempo;

  const step = musicTick % 16;
  
  let scale = isElectro ? scaleElectro : scalePop;
  let type = isElectro ? "sawtooth" : "triangle"; 
  
  if (step % 4 === 0) {
    let kickType = isElectro ? "square" : "sine";
    let kickFreq = isElectro ? 100 : 150;
    playSound(kickFreq, kickType, 0.1, 0.3, true); 
  }
  if (step === 4 || step === 12) {
    playSound(0, "white", 0.05, isElectro ? 0.08 : 0.04);
  }
  
  let chance = isFever ? 0.9 : (isElectro ? 0.7 : 0.5); 

  if (step % 2 === 0 && Math.random() < chance) {
    const note = scale[Math.floor(Math.random() * scale.length)];
    let baseFreq = isElectro ? 220 : 440; 
    if (!isElectro && Math.random() > 0.7) baseFreq *= 0.5; 
    if (isElectro && Math.random() > 0.8) baseFreq *= 2;   
    const freq = baseFreq * Math.pow(2, note / 12);
    playSound(freq, type, 0.15, 0.1, true);
  }

  musicTick++;
  setTimeout(playMusicStep, currentTempo * 1000);
}

const sfx = {
  jump: () => playSound(400, "square", 0.1, 0.04, false), 
  die: () => { playSound(150, "sawtooth", 0.5, 0.15, false); playSound(60, "square", 0.3, 0.15, false); },
  coin: () => { playSound(1200, "sine", 0.1, 0.1, true); playSound(1800, "square", 0.1, 0.05, true); }, 
  levelUp: () => playSound(500, "sine", 0.3, 0.07, true),
  break: () => playSound(100, "sawtooth", 0.2, 0.1, false) 
};

/* ===== 4. VISUALES ===== */
const palettes = [{ hue: 190 }, { hue: 30 }, { hue: 120 }, { hue: 300 }, { hue: 270 }, { hue: 0 }, { hue: 60 }, { hue: 240 }];
function getCol(offsetY = 0) {
  const p = palettes[(level - 1) % palettes.length];
  const pulse = Math.sin(time * 0.05) * 5; 
  return `hsl(${p.hue}, 100%, ${50 + pulse}%)`;
}

let stars = [];
for(let i=0; i<40; i++) stars.push({ x: Math.random()*W, y: Math.random()*H, size: Math.random()*2, speed: Math.random()*3+1 });
let floatTexts = [];
function addFloatText(text, x, y, color) { floatTexts.push({text, x, y, color, life: 1.0, dy: -2}); }
let shockwaves = [];
function addShockwave(x, y, color) { shockwaves.push({x, y, radius: 5, alpha: 1.0, color}); }
let particles = [];
function createP(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.5)*speed, size: Math.random()*4+2, color, life: 1.0, decay: Math.random()*0.03+0.02 });
}

/* ===== 5. LÓGICA DE JUEGO ===== */
let obstacles = [];
let coins = [];
let obstacleTimer = 0;

function spawn() {
  let type = 0;
  if (level >= 4 && Math.random() > 0.6) type = 1;
  if (level >= 8 && Math.random() > 0.7) type = 2;

  let randomX = Math.random() * (W - 100) + 50;
  let obs = {
    type: type, y: H + 50, gapCenter: randomX, gapSize: 140 - (level * 1.5), 
    speed: 1.4 + (level * 0.2), thick: 20,
    moveSpeed: level > 2 ? 0.03 + (level * 0.005) : 0, moveRange: level > 2 ? 50 : 0, moveOffset: Math.random() * 10,
    crushPhase: 0, angle: 0, angularSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + level * 0.005)
  };
  if (type === 2) { obs.gapCenter = W / 2; obs.gapSize = 130; }
  obstacles.push(obs);
  
  if (Math.random() > 0.4 && type !== 2) { 
    coins.push({ y: H + 50, linkedToObstacle: obs, collected: false });
  }
}

let player = { x: W/2, y: H/2, targetX: W/2, size: 13, vy: 0, gravity: 0.6, jump: -10, trail: [], maxTrail: 12, sx: 1, sy: 1 };
let started = false, alive = true, time = 0, level = 1, levelTime = 600, glitch = 0, flash = 0, shake = 0;
let isInShop = false;
let isInRecords = false; 
let globalZoom = 1; 
let combo = 0; const comboMax = 10; let isFever = false; let feverTimer = 0;

function checkShopClick(x, y) {
  let startY = 150;
  skins.forEach((skin, i) => {
    let btnY = startY + (i * 70);
    if (y > btnY && y < btnY + 60) {
      let isOwned = ownedSkins.includes(i);
      if (isOwned) {
        currentSkinIndex = i; 
        saveGame();
        sfx.coin();
        addFloatText("EQUIPADO", x, y, "#fff");
      } else {
        if (totalCoins >= skin.price) {
          totalCoins -= skin.price; 
          ownedSkins.push(i); 
          currentSkinIndex = i;
          saveGame();
          sfx.coin();
          addFloatText("¡COMPRADO!", x, y, "#0f0");
        } else {
          addFloatText("FALTA DINERO", x, y, "#f00");
        }
      }
    }
  });
  if (y > H - 100 && y < H - 50) isInShop = false;
}

function input(e) {
  if (e) e.preventDefault();
  initAudio();
  
  let touchX, touchY;
  if(e.touches) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }
  else { touchX = e.clientX; touchY = e.clientY; }
  const rect = canvas.getBoundingClientRect();
  const x = (touchX - rect.left) * (W / rect.width);
  const y = (touchY - rect.top) * (H / rect.height);

  if (isInShop) { checkShopClick(x, y); return; }
  if (isInRecords) { if (y > H - 100 && y < H - 50) isInRecords = false; return; }

  // === BOTONES DE MUTE (MOVIDOS DEBAJO DE LAS MONEDAS) ===
  // Botón Música (30, 85)
  if (x > 10 && x < 50 && y > 70 && y < 110) {
    musicMuted = !musicMuted;
    saveGame();
    return;
  }
  // Botón SFX (70, 85)
  if (x > 50 && x < 90 && y > 70 && y < 110) {
    sfxMuted = !sfxMuted;
    saveGame();
    return;
  }

  if (!started) { 
    if (y > H/2 + 60 && y < H/2 + 100) { isInShop = true; return; }
    if (y > H/2 + 110 && y < H/2 + 150) { isInRecords = true; return; }
    if (missionCompleted && y < 50) { missionCompleted = false; mission = generateMission(); saveGame(); }
    started = true; return; 
  }

  if (!alive) { 
    if (x > W/2 - 60 && x < W/2 + 60 && y > H/2 + 70 && y < H/2 + 110) { started = false; restart(); } 
    else restart(); 
    return; 
  }
  
  player.vy = player.jump;
  player.targetX = Math.max(20, Math.min(W - 20, x));
  player.sy = 0.6; player.sx = 1.4;
  sfx.jump();
  
  let pColor = isFever ? "#ff4400" : skins[currentSkinIndex].color;
  addShockwave(player.x, player.y, pColor);
  createP(player.x, player.y + player.size, pColor, 3, 3);
}
canvas.addEventListener("touchstart", input, { passive: false });
canvas.addEventListener("mousedown", input);

function update() {
  if (flash > 0) flash -= 0.05;
  if (shake > 0) shake -= 1;

  stars.forEach(s => { s.y += s.speed + (level * 0.5) + (isFever ? 5 : 0); if (s.y > H) s.y = 0; });
  for(let i = floatTexts.length -1; i >= 0; i--) { let ft = floatTexts[i]; ft.y += ft.dy; ft.life -= 0.02; if(ft.life <= 0) floatTexts.splice(i, 1); }
  for(let i = shockwaves.length -1; i >= 0; i--) { let sw = shockwaves[i]; sw.radius += 3; sw.alpha -= 0.05; if(sw.alpha <= 0) shockwaves.splice(i, 1); }
  particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; if (p.life <= 0) particles.splice(i, 1); });
  
  if (!started || !alive || isInShop || isInRecords) { glitch *= 0.9; return; }
  
  time++;
  if (isFever) {
    feverTimer--;
    if (feverTimer <= 0) { isFever = false; combo = 0; }
    if (time % 2 === 0) createP(player.x, player.y, "#ff4400", 2, 5);
  }

  player.trail.unshift({x: player.x, y: player.y});
  if(player.trail.length > player.maxTrail) player.trail.pop();
  
  player.vy += player.gravity; player.y += player.vy;
  player.x += (player.targetX - player.x) * 0.15;
  player.sx += (1 - player.sx) * 0.1; player.sy += (1 - player.sy) * 0.1;
  if (Math.abs(player.vy) > 2) { let stretch = 1 + Math.abs(player.vy) * 0.02; stretch = Math.min(stretch, 1.5); player.sy = stretch; player.sx = 1 / stretch; }
  
  let targetZoom = 1 + (level * 0.005) + (isFever ? 0.1 : 0); 
  globalZoom += (targetZoom - globalZoom) * 0.05;

  if (++obstacleTimer >= (isFever ? 150 : 220)) { spawn(); obstacleTimer = 0; } 
  
  for(let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.y -= obs.speed + (isFever ? 2 : 0); 
    
    if (obs.type === 0) {
      if (obs.moveRange > 0) obs.currentX = obs.gapCenter + Math.sin(time * obs.moveSpeed + obs.moveOffset) * obs.moveRange;
      else obs.currentX = obs.gapCenter;
    } else if (obs.type === 1) {
      obs.crushPhase += 0.05;
      obs.currentX = obs.gapCenter;
      obs.currentGap = 20 + (obs.gapSize - 20) * (0.5 + 0.5 * Math.sin(obs.crushPhase));
    } else if (obs.type === 2) {
      obs.angle += obs.angularSpeed;
    }

    let collision = false;
    if (player.y + player.size*0.6 > obs.y - obs.thick/2 && player.y - player.size*0.6 < obs.y + obs.thick/2) {
      if (obs.type === 0) {
        if (player.x - player.size < obs.currentX - obs.gapSize/2 || player.x + player.size > obs.currentX + obs.gapSize/2) collision = true;
      } else if (obs.type === 1) {
        if (player.x - player.size < obs.currentX - obs.currentGap/2 || player.x + player.size > obs.currentX + obs.currentGap/2) collision = true;
      } else if (obs.type === 2) {
         let dx = player.x - obs.gapCenter; let dy = player.y - obs.y;
         let cos = Math.cos(-obs.angle); let sin = Math.sin(-obs.angle);
         let rx = dx * cos - dy * sin; let ry = dx * sin + dy * cos;
         if (Math.abs(rx) < obs.gapSize && Math.abs(ry) < obs.thick/2) collision = true;
         if (Math.abs(ry) < obs.gapSize && Math.abs(rx) < obs.thick/2) collision = true;
      }
    }

    if (collision) {
      if (isFever) {
        sfx.break(); shake = 10; createP(player.x, obs.y, "#fff", 10, 5);
        obstacles.splice(i, 1); continue; 
      } else {
        die();
      }
    }

    if (!obs.passed && player.y < obs.y - 50) {
      obs.passed = true;
      if (!isFever) {
        combo++;
        if (combo >= comboMax) { isFever = true; feverTimer = 300; addFloatText("¡FIEBRE!", player.x, player.y, "#ff4400"); shake = 20; }
      }
    }

    if (obs.y < -150) obstacles.splice(i, 1);
  }

  coins.forEach((c, i) => {
    if (isFever) { c.x += (player.x - c.x) * 0.2; c.y += (player.y - c.y) * 0.2; } 
    else if (c.linkedToObstacle) { c.y = c.linkedToObstacle.y; c.x = c.linkedToObstacle.currentX || c.linkedToObstacle.gapCenter; }
    
    let dx = player.x - c.x; let dy = player.y - c.y; let dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < player.size + 15) { 
      sfx.coin(); totalCoins++; checkMission("coin", 1); 
      createP(c.x, c.y, "#ffd700", 10, 8); addFloatText("+1", c.x, c.y, "#ffd700"); saveGame(); coins.splice(i, 1); 
    }
    else if (c.y < -50) coins.splice(i, 1);
  });

  if (player.y - player.size <= 0 || player.y + player.size >= H) die();
  if (time >= levelTime) { 
    level++; time = 0; sfx.levelUp(); flash = 0.6; glitch = 20; checkMission("level", level); addFloatText("LEVEL UP!", W/2, H/2, "#fff"); 
  }
  if (Math.random() < 0.02) glitch = 7; else glitch *= 0.85;
}

function die() {
  if (!alive) return;
  sfx.die(); glitch = 30; flash = 0.8; shake = 20; alive = false;
  let skinColor = skins[currentSkinIndex].color;
  createP(player.x, player.y, skinColor, 35, 18);
  checkHighScore(level); 
}

function restart() {
  level = 1; time = 0; alive = true; obstacles = []; coins = []; obstacleTimer = 0;
  player.y = H/2; player.x = W/2; player.targetX = W/2; player.trail = []; player.vy = 0; 
  flash = 0; musicTick = 0; shake = 0; combo = 0; isFever = false; feverTimer = 0;
}

/* ===== 6. DIBUJADO ===== */
function draw() {
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  
  ctx.save();
  ctx.translate(W/2, H/2); ctx.scale(globalZoom, globalZoom); ctx.translate(-W/2, -H/2);
  if (shake > 0) ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
  if (glitch > 0.5) ctx.translate((Math.random()-0.5)*glitch, (Math.random()-0.5)*glitch);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill(); });
  const wallGrd = ctx.createLinearGradient(0, 0, 0, H); wallGrd.addColorStop(0, getCol(0)); wallGrd.addColorStop(1, getCol(H));
  ctx.fillStyle = wallGrd; ctx.fillRect(0, 0, 20, H); ctx.fillRect(W - 20, 0, 20, H);

  shockwaves.forEach(sw => { ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI*2); ctx.strokeStyle = sw.color; ctx.lineWidth = 2; ctx.globalAlpha = sw.alpha; ctx.stroke(); ctx.globalAlpha = 1.0; });

  obstacles.forEach(obs => {
    const c = getCol(obs.y); ctx.fillStyle = c; ctx.shadowBlur = 15; ctx.shadowColor = c;
    if (obs.type === 0) {
      let cx = obs.currentX || obs.gapCenter;
      ctx.fillRect(0, obs.y - obs.thick/2, cx - obs.gapSize/2, obs.thick); ctx.fillRect(cx + obs.gapSize/2, obs.y - obs.thick/2, W, obs.thick);
    } else if (obs.type === 1) {
      let gap = obs.currentGap || obs.gapSize; let cx = obs.gapCenter;
      ctx.fillRect(0, obs.y - obs.thick/2, cx - gap/2, obs.thick); ctx.fillRect(cx + gap/2, obs.y - obs.thick/2, W, obs.thick);
    } else if (obs.type === 2) {
      ctx.save(); ctx.translate(obs.gapCenter, obs.y); ctx.rotate(obs.angle);
      ctx.fillRect(-obs.gapSize, -obs.thick/2, obs.gapSize*2, obs.thick); ctx.fillRect(-obs.thick/2, -obs.gapSize, obs.thick, obs.gapSize*2); 
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0,0, 15, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
    ctx.shadowBlur = 0;
  });

  coins.forEach(c => { ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "10px Arial"; ctx.textAlign="center"; ctx.fillText("$", c.x, c.y+3); });
  particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
  ctx.globalAlpha = 1.0;
  
  if (alive && !isInShop && !isInRecords) {
    let pSkinColor = isFever ? "#ff4400" : skins[currentSkinIndex].color;

    player.trail.forEach((pos, i) => { let alpha = 1 - (i/player.maxTrail); let size = player.size * (1 - (i/player.maxTrail) * 0.5); ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = pSkinColor; ctx.beginPath(); ctx.arc(pos.x, pos.y, size, 0, Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    
    ctx.save(); ctx.translate(player.x, player.y); ctx.scale(player.sx, player.sy); 
    ctx.shadowBlur = 25; ctx.shadowColor = pSkinColor; 
    
    if (isFever) {
      let grd = ctx.createRadialGradient(0,0, player.size/2, 0,0, player.size);
      grd.addColorStop(0, "#ffff00"); grd.addColorStop(1, "#ff0000");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0,0, player.size, 0, Math.PI*2); ctx.fill();
    } else {
      skins[currentSkinIndex].draw(ctx, player.size);
    }
    ctx.restore();
  }
  floatTexts.forEach(ft => { ctx.globalAlpha = ft.life; ctx.fillStyle = ft.color; ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.fillText(ft.text, ft.x, ft.y); });
  ctx.globalAlpha = 1.0;

  ctx.restore();

  // UI CAPA SUPERIOR
  ctx.fillStyle = "white"; ctx.font = "bold 16px Arial"; ctx.textAlign = "left";
  ctx.fillText("NIVEL " + level, 25, 35); ctx.fillStyle = "#ffd700"; ctx.fillText("M: " + totalCoins, 25, 55); 
  
  // DIBUJAR BOTONES DE MUTE (ABAJO DEL TEXTO MONEDAS)
  ctx.font = "24px Arial"; ctx.textAlign = "center";
  // Botón Música (30, 85)
  ctx.fillStyle = musicMuted ? "#f00" : "#fff"; ctx.fillText("♫", 30, 85);
  // Botón SFX (70, 85)
  ctx.fillStyle = sfxMuted ? "#f00" : "#fff"; ctx.fillText("🔊", 70, 85);

  if (alive && started && !isFever) {
    ctx.fillStyle = "#444"; ctx.fillRect(W - 120, 20, 100, 10);
    ctx.fillStyle = "#ff4400"; ctx.fillRect(W - 120, 20, 100 * (combo/comboMax), 10);
    ctx.fillStyle = "#fff"; ctx.font = "10px Arial"; ctx.fillText("FIEBRE", W - 70, 45);
  }
  if (isFever) { ctx.fillStyle = "#ff4400"; ctx.font = "bold 20px Arial"; ctx.textAlign = "center"; ctx.fillText("¡FIEBRE ACTIVADA!", W/2, 100); }
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0,0,W,H); }

  if (!started && !isInShop && !isInRecords) {
    ctx.fillStyle = "white"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("ONE FINGER WORLD", W/2, H/2-60);
    ctx.font = "16px Arial"; ctx.fillText("Toca LADOS para moverte", W/2, H/2 - 20);
    ctx.fillStyle = "#333"; ctx.fillRect(W/2 - 60, H/2 + 60, 120, 40); ctx.fillStyle = "#fff"; ctx.fillText("TIENDA SKINS", W/2, H/2 + 85);
    ctx.fillStyle = "#222"; ctx.fillRect(W/2 - 60, H/2 + 110, 120, 40); ctx.fillStyle = "#fff"; ctx.fillText("RÉCORDS", W/2, H/2 + 135);
    ctx.fillStyle = "#222"; ctx.fillRect(W/2 - 120, H - 150, 240, 60); ctx.fillStyle = "#ffd700"; ctx.font = "bold 14px Arial"; ctx.fillText("MISIÓN DIARIA:", W/2, H - 130);
    if (missionCompleted) { ctx.fillStyle = "#0f0"; ctx.fillText("¡COMPLETADA! (+100)", W/2, H - 110); } 
    else { ctx.fillStyle = "#fff"; ctx.fillText(mission.text + ` (${mission.progress}/${mission.target})`, W/2, H - 110); }
  }

  if (isInRecords) {
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("MEJORES PUNTAJES", W/2, 80);
    leaderboard.forEach((record, i) => {
      ctx.fillStyle = i === 0 ? "#ffd700" : "#fff"; ctx.font = "bold 20px Arial";
      ctx.fillText(`${i + 1}. ${record.name} - NIVEL ${record.score}`, W/2, 150 + (i * 40));
    });
    ctx.fillStyle = "#f00"; ctx.fillRect(W/2 - 50, H - 100, 100, 40); ctx.fillStyle = "#fff"; ctx.textAlign="center"; ctx.fillText("VOLVER", W/2, H - 75);
  }

  if (isInShop) {
    ctx.fillStyle = "rgba(0,0,0,0.95)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("TIENDA", W/2, 80); ctx.fillText("Tus Monedas: " + totalCoins, W/2, 120);
    let startY = 150;
    skins.forEach((skin, i) => {
      let btnY = startY + (i*70);
      ctx.fillStyle = "#222"; if (currentSkinIndex === i) ctx.fillStyle = "#444"; 
      ctx.fillRect(40, btnY, W-80, 60);
      
      ctx.save(); ctx.translate(70, btnY + 30);
      skin.draw(ctx, 20);
      ctx.restore();

      ctx.fillStyle = "#fff"; ctx.font = "16px Arial"; ctx.textAlign = "left"; ctx.fillText(skin.name, 110, btnY + 35);
      
      let isOwned = ownedSkins.includes(i);
      let statusText = isOwned ? "OK" : "$" + skin.price;
      let statusColor = isOwned ? "#0f0" : (totalCoins >= skin.price ? "#fff" : "#f00");
      ctx.textAlign = "right"; ctx.fillStyle = statusColor; ctx.fillText(statusText, W-60, btnY + 35);
    });
    ctx.fillStyle = "#f00"; ctx.fillRect(W/2 - 50, H - 100, 100, 40); ctx.fillStyle = "#fff"; ctx.textAlign="center"; ctx.fillText("SALIR", W/2, H - 75);
  }

  if (!alive && started) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#ff5555"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", W/2, H/2-20);
    ctx.fillStyle = "white"; ctx.font = "14px Arial"; ctx.fillText("Toca pantalla para reintentar", W/2, H/2+20);
    ctx.fillStyle = "#ffd700"; ctx.fillText("Ganaste " + totalCoins + " monedas", W/2, H/2+50);
    ctx.fillStyle = "#00ccff"; ctx.fillRect(W/2 - 60, H/2 + 70, 120, 40); 
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.strokeRect(W/2 - 60, H/2 + 70, 120, 40);
    ctx.fillStyle = "#000"; ctx.font = "bold 16px Arial"; ctx.fillText("MENÚ", W/2, H/2 + 95);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();