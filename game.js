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

/* ===== ECONOMÍA ===== */
let totalCoins = parseInt(localStorage.getItem("oneFingerCoins")) || 0;
let highScore = parseInt(localStorage.getItem("oneFingerHighScore")) || 1;
let currentSkin = localStorage.getItem("oneFingerSkin") || "#fff";

function saveGame() {
  localStorage.setItem("oneFingerCoins", totalCoins);
  localStorage.setItem("oneFingerHighScore", highScore);
  localStorage.setItem("oneFingerSkin", currentSkin);
}

/* ===== AUDIO ===== */
let audioCtx;
let musicTick = 0;
const scale = [0, 3, 5, 7, 10]; 

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    playMusicStep();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(freq, type, duration, vol) {
  if (!audioCtx) return;
  try {
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    gain.connect(audioCtx.destination);

    if (type === "white") {
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.connect(gain);
      noise.start();
    } else {
      const osc = audioCtx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  } catch (e) {}
}

function playMusicStep() {
  if (!started && !isInShop) { setTimeout(playMusicStep, 200); return; }
  const tempo = 0.14;
  const step = musicTick % 16;
  
  if (step % 4 === 0) playSound(55 + (level * 2), "triangle", 0.3, 0.12);
  if (step === 4 || step === 12) playSound(0, "white", 0.05, 0.02);
  
  if (step % 2 === 0 && Math.random() < (0.3 + level * 0.1)) {
    const note = scale[Math.floor(Math.random() * scale.length)];
    const freq = 220 * Math.pow(2, (note + (level > 3 ? 12 : 0)) / 12);
    playSound(freq, "square", 0.15, 0.03);
  }
  musicTick++;
  setTimeout(playMusicStep, tempo * 1000);
}

const sfx = {
  jump: () => playSound(400, "square", 0.1, 0.04),
  die: () => { playSound(150, "sawtooth", 0.5, 0.15); playSound(60, "square", 0.3, 0.15); },
  coin: () => { playSound(1200, "sine", 0.1, 0.1); playSound(1800, "square", 0.1, 0.05); },
  levelUp: () => playSound(500, "sine", 0.3, 0.07)
};

/* ===== JUEGO ===== */
const palettes = [{ hue: 200 }, { hue: 0 }, { hue: 140 }, { hue: 280 }, { hue: 45 }, { hue: 320 }];
function getCol(offsetY = 0) {
  const p = palettes[Math.min(level - 1, palettes.length - 1)];
  return `hsl(${(p.hue + time * 2 + offsetY * 0.5) % 360}, 90%, 60%)`;
}

let particles = [];
function createP(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.5)*speed, size: Math.random()*4+2, color, life: 1.0, decay: Math.random()*0.03+0.02 });
  }
}

let obstacles = [];
let coins = [];
let obstacleTimer = 0;

function spawn() {
  // NUEVO: Definimos el centro del hueco y su movimiento
  obstacles.push({
    y: H + 30,
    gapCenter: W / 2, // Empieza en el centro
    gapSize: 130 - (level * 2), // Hueco fijo
    moveOffset: Math.random() * 10, // Para que no se muevan todos igual
    moveSpeed: 0.05 + (level * 0.01), // Velocidad lateral
    moveRange: 100, // Qué tanto se mueve a los lados
    speed: 1.4 + (level * 0.2), 
    thick: 18
  });
  
  // Monedas (ahora siguen el movimiento del hueco en update)
  if (Math.random() > 0.4) {
    coins.push({ 
      y: H + 30, 
      linkedToObstacle: obstacles[obstacles.length-1], // Vinculada al obstáculo
      collected: false 
    });
  }
}

let player = { x: W/2, y: H/2, size: 13, vy: 0, gravity: 0.6, jump: -10 };
let started = false, alive = true, time = 0, level = 1, levelTime = 600, glitch = 0, flash = 0, shake = 0;
let isInShop = false;

/* ===== TIENDA ===== */
const skins = [
  { color: "#ffffff", price: 0, name: "Classic" },
  { color: "#ffff00", price: 50, name: "Gold" },
  { color: "#00ffff", price: 100, name: "Cyber" },
  { color: "#ff00ff", price: 200, name: "Neon" }
];

function checkShopClick(x, y) {
  let startY = 200;
  skins.forEach((skin, i) => {
    if (y > startY + (i * 60) && y < startY + (i * 60) + 50) {
      if (totalCoins >= skin.price) {
        currentSkin = skin.color;
        saveGame();
        sfx.coin();
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

  if (!started) { 
    if (y > H/2 + 60 && y < H/2 + 100) { isInShop = true; return; }
    started = true; return; 
  }
  
  if (!alive) { restart(); return; }
  
  player.vy = player.jump;
  sfx.jump();
  createP(player.x, player.y + player.size, currentSkin, 5, 4);
}
canvas.addEventListener("touchstart", input, { passive: false });
canvas.addEventListener("mousedown", input);

function update() {
  if (flash > 0) flash -= 0.05;
  if (shake > 0) shake -= 1;

  particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= p.decay; if (p.life <= 0) particles.splice(i, 1); });
  
  if (!started || !alive || isInShop) { glitch *= 0.9; return; }
  
  time++;
  player.vy += player.gravity;
  player.y += player.vy;
  
  if (++obstacleTimer >= 220) { spawn(); obstacleTimer = 0; }
  
  // OBSTÁCULOS PÉNDULO
  obstacles.forEach((obs, i) => {
    obs.y -= obs.speed; 
    
    // Movimiento Lateral (Seno)
    obs.gapCenter = (W / 2) + Math.sin(time * obs.moveSpeed + obs.moveOffset) * obs.moveRange;

    // Colisión Izquierda
    if (player.y + player.size*0.6 > obs.y - obs.thick/2 && player.y - player.size*0.6 < obs.y + obs.thick/2) {
      // Si el jugador NO está dentro del hueco
      if (player.x - player.size < obs.gapCenter - obs.gapSize/2 || player.x + player.size > obs.gapCenter + obs.gapSize/2) {
        die();
      }
    }
    if (obs.y < -50) obstacles.splice(i, 1);
  });

  // MONEDAS
  coins.forEach((c, i) => {
    // La moneda sigue al obstáculo
    if (c.linkedToObstacle) {
      c.y = c.linkedToObstacle.y;
      c.x = c.linkedToObstacle.gapCenter; // La moneda siempre está en el centro del hueco
    }
    
    let dx = player.x - c.x;
    let dy = player.y - c.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < player.size + 15) {
      sfx.coin();
      totalCoins++;
      createP(c.x, c.y, "#ffd700", 10, 8);
      saveGame();
      coins.splice(i, 1);
    } else if (c.y < -50) {
      coins.splice(i, 1);
    }
  });

  if (player.y - player.size <= 0 || player.y + player.size >= H) die();
  if (time >= levelTime) { level++; time = 0; sfx.levelUp(); flash = 0.6; glitch = 20; }
  if (Math.random() < 0.02) glitch = 7; else glitch *= 0.85;
}

function die() {
  if (!alive) return;
  sfx.die(); glitch = 30; flash = 0.8; shake = 20;
  alive = false;
  createP(player.x, player.y, currentSkin, 35, 18);
  if (level > highScore) { highScore = level; saveGame(); }
}

function restart() {
  level = 1; time = 0; alive = true; obstacles = []; coins = []; obstacleTimer = 0;
  player.y = H/2; player.vy = 0; flash = 0; musicTick = 0; shake = 0;
}

function draw() {
  ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  ctx.save();
  
  if (shake > 0) {
    let dx = (Math.random() - 0.5) * shake;
    let dy = (Math.random() - 0.5) * shake;
    ctx.translate(dx, dy);
  }
  if (glitch > 0.5) ctx.translate((Math.random()-0.5)*glitch, (Math.random()-0.5)*glitch);
  
  const wallGrd = ctx.createLinearGradient(0, 0, 0, H);
  wallGrd.addColorStop(0, getCol(0)); wallGrd.addColorStop(1, getCol(H));
  ctx.fillStyle = wallGrd; ctx.fillRect(0, 0, 20, H); ctx.fillRect(W - 20, 0, 20, H);

  // DIBUJAR PÉNDULOS
  obstacles.forEach(obs => {
    const c = getCol(obs.y); ctx.fillStyle = c;
    ctx.shadowBlur = 15; ctx.shadowColor = c;
    
    // Parte Izquierda
    ctx.fillRect(0, obs.y - obs.thick/2, obs.gapCenter - obs.gapSize/2, obs.thick);
    // Parte Derecha
    ctx.fillRect(obs.gapCenter + obs.gapSize/2, obs.y - obs.thick/2, W, obs.thick);
    
    ctx.shadowBlur = 0;
  });

  coins.forEach(c => {
    ctx.fillStyle = "#ffd700";
    ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "10px Arial"; ctx.textAlign="center"; ctx.fillText("$", c.x, c.y+3);
  });

  particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
  ctx.globalAlpha = 1.0;
  
  if (alive && !isInShop) {
    ctx.shadowBlur = 25; ctx.shadowColor = currentSkin; ctx.fillStyle = currentSkin;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "white"; ctx.font = "bold 16px Arial"; ctx.textAlign = "left";
  ctx.fillText("NIVEL " + level, 25, 35);
  ctx.fillStyle = "#ffd700"; ctx.fillText("M: " + totalCoins, 25, 55); 

  if (!started && !isInShop) {
    ctx.fillStyle = "white"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("ONE FINGER WORLD", W/2, H/2-60);
    ctx.font = "16px Arial"; ctx.fillText("Toca para saltar", W/2, H/2 - 20);
    ctx.fillStyle = "#333"; ctx.fillRect(W/2 - 60, H/2 + 60, 120, 40);
    ctx.fillStyle = "#fff"; ctx.fillText("TIENDA SKINS", W/2, H/2 + 85);
  }

  if (isInShop) {
    ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("TIENDA", W/2, 80);
    ctx.fillText("Tus Monedas: " + totalCoins, W/2, 120);

    let startY = 200;
    skins.forEach((skin, i) => {
      ctx.fillStyle = "#222"; 
      if (currentSkin === skin.color) ctx.fillStyle = "#444"; 
      ctx.fillRect(40, startY + (i*60), W-80, 50);
      ctx.fillStyle = skin.color; ctx.beginPath(); ctx.arc(70, startY + (i*60) + 25, 15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "16px Arial"; ctx.textAlign = "left";
      ctx.fillText(skin.name, 100, startY + (i*60) + 30);
      ctx.textAlign = "right";
      if (totalCoins >= skin.price) ctx.fillStyle = "#0f0"; else ctx.fillStyle = "#f00";
      ctx.fillText("$" + skin.price, W-60, startY + (i*60) + 30);
    });

    ctx.fillStyle = "#f00"; ctx.fillRect(W/2 - 50, H - 100, 100, 40);
    ctx.fillStyle = "#fff"; ctx.textAlign="center"; ctx.fillText("SALIR", W/2, H - 75);
  }

  if (!alive && started) {
    ctx.fillStyle = "#ff5555"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", W/2, H/2-10);
    ctx.fillStyle = "white"; ctx.font = "14px Arial"; ctx.fillText("Toca para reiniciar", W/2, H/2+25);
    ctx.fillStyle = "#ffd700"; ctx.fillText("Ganaste " + totalCoins + " monedas", W/2, H/2+50);
  }

  ctx.restore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0,0,W,H); }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();