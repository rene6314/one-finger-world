const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ===== 9:16 FIJO & REDIMENSIONAMIENTO ===== */
const W = 360;
const H = 640;

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W * scale + "px";
  canvas.style.height = H * scale + "px";
  canvas.style.margin = "auto";
}
resize();
window.addEventListener("resize", resize);

/* ===== AUDIO ENGINE (Sintetizador) ===== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, type, duration, vol) {
  try {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const sfx = {
  jump: () => playSound(400, "square", 0.1, 0.05),
  die: () => {
    playSound(150, "sawtooth", 0.6, 0.2);
    playSound(60, "square", 0.4, 0.2);
  },
  levelUp: () => {
    playSound(500, "sine", 0.3, 0.08);
    setTimeout(() => playSound(700, "sine", 0.3, 0.08), 100);
  }
};

/* ===== SISTEMA DE PARTÍCULAS ===== */
let particles = [];
function createParticles(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: Math.random() * 4 + 2,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.02 + 0.02
    });
  }
}

/* ===== OBSTÁCULOS (BARRAS DE ERROR) ===== */
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 300; 

function spawnObstacle() {
  const gapSize = 130 - (level * 4); 
  const gapY = Math.random() * (H - 240) + 120;
  obstacles.push({
    y: H + 50,
    gapY: gapY,
    gapSize: Math.max(75, gapSize),
    speed: 1.2 + (level * 0.3), 
    width: W
  });
}

/* ===== JUGADOR ===== */
const player = {
  x: W / 2,
  y: H / 2,
  size: 14,
  vy: 0,
  gravity: 0.6,
  jump: -10
};

/* ===== ESTADO ===== */
let started = false;
let alive = true;
let time = 0;
let level = 1;
let levelTime = 600; 
let ruleText = "Toca para empezar";
let glitchIntensity = 0;
let flashAlpha = 0; // Nueva variable para el flash

/* ===== INPUT ===== */
function input(e) {
  if (e) e.preventDefault();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (!started) {
    started = true;
    ruleText = "Regla: Tocar = Saltar";
    return;
  }

  if (!alive) {
    restart();
    return;
  }

  player.vy = player.jump;
  sfx.jump();
  createParticles(player.x, player.y + player.size, "#fff", 5, 4);
}

canvas.addEventListener("mousedown", input);
canvas.addEventListener("touchstart", input, { passive: false });

/* ===== COLOR DINÁMICO ===== */
function getWallColor(offsetY = 0) {
  const speedEffect = (time * 15) + (offsetY * 0.8);
  const hue = speedEffect % 360;
  return `hsl(${hue}, 90%, 60%)`;
}

/* ===== UPDATE ===== */
function update() {
  // Reducir el flash gradualmente
  if (flashAlpha > 0) flashAlpha -= 0.05;

  particles.forEach((p, i) => {
    p.x += p.vx; p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  });

  if (!started || !alive) {
    glitchIntensity *= 0.9; 
    return;
  }

  time++;
  player.vy += player.gravity;
  player.y += player.vy;

  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  obstacles.forEach((obs, i) => {
    obs.y -= obs.speed; 
    if (Math.abs(player.y - obs.y) < player.size + 8) {
      if (player.y < obs.gapY - obs.gapSize/2 || player.y > obs.gapY + obs.gapSize/2) {
         gameOver();
      }
    }
    if (obs.y < -50) obstacles.splice(i, 1);
  });

  if (player.y - player.size <= 0 || player.y + player.size >= H) {
    gameOver();
  }

  if (time >= levelTime) nextLevel();

  if (Math.random() < 0.02) glitchIntensity = 7;
  else glitchIntensity *= 0.85;
}

function gameOver() {
  if (alive) {
    sfx.die();
    glitchIntensity = 30;
    flashAlpha = 0.8; // Flash al morir
    createParticles(player.x, player.y, getWallColor(player.y), 35, 18);
    alive = false;
  }
}

/* ===== DRAW ===== */
function draw() {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (glitchIntensity > 0.5) {
    ctx.translate((Math.random() - 0.5) * glitchIntensity, (Math.random() - 0.5) * glitchIntensity);
  }

  drawWalls();

  obstacles.forEach(obs => {
    const col = getWallColor(obs.y);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, obs.y - 6, W, 12);
    ctx.clearRect(W/2 - 60, obs.gapY - obs.gapSize/2, 120, obs.gapSize); 
    ctx.globalAlpha = 1.0;
  });

  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1.0;

  if (alive) {
    const glow = getWallColor(player.y);
    ctx.shadowBlur = 25;
    ctx.shadowColor = glow;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "#888";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText("NIVEL " + level, 16, 30);
  ctx.fillText(ruleText, 16, 50);

  if (!started) drawStart();
  if (!alive && started) drawGameOver();

  ctx.restore();

  // DIBUJAR EL FLASH (encima de todo)
  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawWalls() {
  const wallWidth = 24;
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, getWallColor(0));
  grd.addColorStop(0.3, getWallColor(H*0.3));
  grd.addColorStop(0.6, getWallColor(H*0.6));
  grd.addColorStop(1, getWallColor(H));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, wallWidth, H);
  ctx.fillRect(W - wallWidth, 0, wallWidth, H);
}

function drawStart() {
  ctx.fillStyle = "#aaa";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ONE FINGER WORLD", W / 2, H / 2 - 40);
  ctx.font = "14px Arial";
  ctx.fillText("Toca para empezar", W / 2, H / 2);
}

function drawGameOver() {
  ctx.fillStyle = "#ff5555";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("FALLASTE", W / 2, H / 2 - 10);
  ctx.fillStyle = "#aaa";
  ctx.font = "14px Arial";
  ctx.fillText("Toca para intentar otra vez", W / 2, H / 2 + 20);
}

function nextLevel() {
  level++;
  time = 0;
  player.gravity += 0.06;
  obstacleInterval = Math.max(100, obstacleInterval - 20); 
  sfx.levelUp();
  glitchIntensity = 20;
  flashAlpha = 0.5; // Flash suave al subir de nivel
  createParticles(W/2, H/2, "#fff", 20, 10);
  const messages = ["Las paredes observan", "Sigue subiendo", "No parpadees", "Casi lo tienes", "Inestabilidad detectada"];
  ruleText = messages[Math.min(level - 1, messages.length - 1)];
}

function restart() {
  level = 1;
  time = 0;
  player.gravity = 0.6;
  obstacleInterval = 300; 
  ruleText = "Regla: Tocar = Saltar";
  alive = true;
  particles = [];
  obstacles = [];
  obstacleTimer = 0;
  player.y = H / 2;
  player.vy = 0;
  flashAlpha = 0; // Resetear flash
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

loop();