/**
 * SNAKE GAME - JAVASCRIPT
 * Game logic: snake movement, food types, score, high score, pause, wrap-around.
 */

// Get references to HTML elements
var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var scoreDisplay = document.getElementById('score');
var highScoreDisplay = document.getElementById('highScore');
var startButton = document.getElementById('startButton');
var gameOverMessage = document.getElementById('gameOverMessage');
var finalScoreDisplay = document.getElementById('finalScore');
var pausedMessage = document.getElementById('pausedMessage');
var easyModeBtn = document.getElementById('easyModeBtn');
var hardModeBtn = document.getElementById('hardModeBtn');
var carnivalModeBtn = document.getElementById('carnivalModeBtn');
var starMessageEl = document.getElementById('starMessage');
var sprintStatusEl = document.getElementById('sprintStatus');
var appleRainOverlayEl = document.getElementById('appleRainOverlay');
var appleRainCountdownEl = document.getElementById('appleRainCountdown');
var bombZoneWarningEl = document.getElementById('bombZoneWarning');
var starMessageTimeout = null;
var starMessageFadeTimeout = null;
var handbookBtn = document.getElementById('handbookBtn');
var handbookClose = document.getElementById('handbookClose');
var handbookOverlay = document.getElementById('handbookOverlay');

// Game mode: 'easy' (default, unchanged), 'hard', or 'carnival' (Hard-like mechanics, larger board).
var gameMode = 'easy';

// True for Hard and Carnival (shared mechanics: bombs, stars, hearts, apple expiry). Easy stays separate.
function isExtendedHardMode() {
  return gameMode === 'hard' || gameMode === 'carnival';
}

// Game settings - Easy mode uses GRID_SIZE 25 (16x16). Hard mode uses smaller cells (see initGame).
var GRID_SIZE = 25;
var CANVAS_SIZE = 400;
var BASE_GAME_SPEED = 150;
var MIN_GAME_SPEED = 80;
var SPEED_BONUS_MS_PER_5_POINTS = 15;
// Blue/green speed effects: 3 seconds each. Blue = 50% speed (2x interval), green = 150% speed (interval/1.5)
var SPEED_EFFECT_DURATION_MS = 3000;

// Apple types: red (+1), yellow (+3), blue (slow), green (speed up). Always 6 apples on board.
var FOOD_RED = 'red';
var FOOD_GOLDEN = 'golden';  // yellow
var FOOD_BLUE = 'blue';
var FOOD_GREEN = 'green';
var TOTAL_APPLES = 6;
// Hard mode: more apples and faster expiration (Easy mode keeps 6 apples, 5000ms lifetime)
var TOTAL_APPLES_HARD = 10;
// Carnival mode: 20 base apples + 5 extra golden + 5 extra red = 30 total, 8 bombs (separate from Hard)
var TOTAL_APPLES_CARNIVAL = 20;
var CARNIVAL_EXTRA_GOLDEN_APPLES = 5;
var CARNIVAL_EXTRA_RED_APPLES = 5;
var BOMB_COUNT_CARNIVAL = 6;
var BOMB_EXPIRY_MS_CARNIVAL = 8000;
var APPLE_LIFETIME_MS_HARD = 3000;
// Apple lifetime in ms (Easy mode). Hard mode uses APPLE_LIFETIME_MS_HARD.
var APPLE_LIFETIME_MS = 5000;
// Blinking: during last 2 seconds before expiry, apple blinks exactly 2 times (brief hide then show)
var APPLE_BLINK_LAST_MS = 2000;
// When each of the 2 blinks happens (start time in ms within that 2-second window) and how long the apple is hidden (ms)
var APPLE_BLINK_1_START_MS = 400;
var APPLE_BLINK_2_START_MS = 1200;
var APPLE_BLINK_HIDE_MS = 200;
// Spawn probabilities: red 60%, yellow 10%, blue 15%, green 15%
var FOOD_PROB_RED = 0.6;
var FOOD_PROB_YELLOW = 0.1;
var FOOD_PROB_BLUE = 0.15;
var FOOD_PROB_GREEN = 0.15;

// Game state - 6 apples. Easy: 1 bomb (no expiry). Hard: 3 bombs (each with independent expiry).
var snake = [];
var foodItems = []; // Array of { x, y, type, spawnTime, expires } - always 6 apples. Initial apples have expires: false.
var bomb = null;   // Easy mode: single bomb { x, y }
var bombs = [];    // Hard mode: array of { x, y, spawnTime, expiryMs } - 3 bombs, independent timers. Carnival: 8 bombs.
var hardModeNextExpiryIndex = 0; // Rotates 0,1,2 so new bombs get 10s, 20s, 30s in turn (keeps staggered)
var carnivalModeNextExpiryIndex = 0; // Carnival only: same 10s/20s/30s rotation for 8 bombs
// Carnival Apple Rain: trigger at 20, then every +15 score outside rain. Normal/Normal/Golden cycle. 5s rain + 1s invincibility.
var carnivalNextRainTriggerAt = 20;
var carnivalScoreAtRainStart = 0;
var carnivalRainIndex = 0;
var carnivalAppleRainActive = false;
var carnivalAppleRainEndTime = 0;
var carnivalInvincibilityEndTime = 0;
var carnivalIgnoreBombsThisTick = false;
var carnivalNoLengthGainThisTick = false;
var carnivalTickNow = 0; // Set each tick in gameLoop for Bomb Zone checks in moveSnake
var gameTickNow = 0;     // Set each tick for sprint invincible checks in moveSnake
var sprintInvincibleThisTick = false;
// Carnival Bomb Zone: every 30s, 2s warning then 3 zones for 5s. Each zone 5x5 (outer -2, core -4), 3 bombs, 1 star, 1 heart (2s), 2 golden apples.
var bombZones = [];
var lastBombZoneEventTime = 0;
var bombZoneWarningEndTime = 0;
var carnivalPendingStarMessage = false;
var pinkSquare = null;
var lastPinkSpawnTime = 0;
var scoreForRainTrigger = 0;
var carnivalDoubleScoreEndTime = 0;
var purpleSquares = [];
var lastPurpleSpawnTime = 0;
var BOMB_ZONE_INTERVAL_MS = 30000;
var PINK_INVINCIBILITY_MS = 3000;
var PINK_SPAWN_INTERVAL_MS = 15000;
var PINK_LIFETIME_MS = 3000;
var PINK_BLINK_INTERVAL_MS = 200;
var PURPLE_DOUBLE_SCORE_MS = 3000;
var PURPLE_SPAWN_INTERVAL_MS = 20000;
var PURPLE_LIFETIME_MS = 3000;
var BOMB_ZONE_WARNING_MS = 2000;
var BOMB_ZONE_DURATION_MS = 5000;
var BOMB_ZONE_SIZE = 5;
var BOMB_ZONE_STATIONARY_MS = 2000;
var BOMB_ZONE_MAX_SIZE = 9;
var BOMB_ZONE_CORE_ITEMS_MS = 2000;
var COMBO_WINDOW_MS = 2000;
var COMBO_WINDOW_APPLE_RAIN_MS = 2500;
var COMBO_DISPLAY_MS = 700;
var carnivalComboCount = 0;
var carnivalLastComboEatTime = 0;
var comboMessageTimeout = null;
var star = null;          // (Unused - Hard mode uses stars array.)
var stars = [];           // Hard mode only: array of { x, y, spawnTime }, max 2 per event, each lasts 3s
var hearts = [];          // Hard mode only: 1 White Heart per Star event, same 3s lifetime, -5 length when collected
var lastStarSpawnTime = 0; // When we last spawned a Star event; next spawn after 15s
var direction = 'right';
var nextDirection = 'right';
// Track currently held keys so we can support Arrow + WASD with WASD priority when both are pressed
var keysPressed = new Set();
var score = 0;
var highScore = 0;
var lastDisplayedScore = -1; // Avoid redundant DOM updates when score unchanged
var gameTimeoutId = null;
var isGameRunning = false;
var isPaused = false;
var slowEffectEndTime = null; // timestamp: blue effect ends at this time (50% speed until then)
var fastEffectEndTime = null; // timestamp: green effect ends at this time (150% speed until then)
// Sprint: 3 charges, 5s per charge. 1 charge = 2s speed. 3 full = 3s invincible sprint. No charge during sprint/skill.
var sprintStatusEl = document.getElementById('sprintStatus');
var sprintCharges = 0;
var sprintChargeProgress = 0;
var lastSprintChargeTime = 0;
var sprintEndTime = null;
var sprintInvincibleEndTime = 0;
var SPRINT_CHARGE_MS = 5000;
var SPRINT_DURATION_MS = 2000;
var SPRINT_INVINCIBLE_MS = 3000;
var lastSpacePressTime = 0;
var DOUBLE_SPACE_MS = 400; // Double-press Space within this window toggles pause

var magnetCount = 0;
var lastMagnetGrantTime = 0;
var MAGNET_FIRST_GRANT_MS = 30000;
var MAGNET_GRANT_INTERVAL_MS = 60000;
var MAGNET_MAX_STACK = 1;
var gameStartTime = 0;

// Hard mode: bomb expiry times (ms) - 10s, 20s, 30s. New bombs get these in rotation so they stay staggered.
var BOMB_EXPIRY_MS_HARD = [10000, 20000, 30000];
var BOMB_COUNT_HARD = 3;
// Hard mode: Star cycle = 3s lifetime each. Spawn 2 Stars every 15s. No message on collect or disappear.
var STAR_LIFETIME_MS = 3000;
var STAR_SPAWN_INTERVAL_MS = 15000;
var STAR_SPAWN_INTERVAL_MS_CARNIVAL = 12000;
var STAR_BLINK_INTERVAL_MS = 250;
var STARS_PER_EVENT = 2;
var MIN_SNAKE_LENGTH = 3; // Minimum segments (e.g. White Heart cannot shrink below this)

// ========== RESTART LOGIC ==========
// initGame() resets the snake, score, and spawns 6 apples + bomb(s). Easy: 1 bomb. Hard: 3 bombs with 10/20/30s expiry.
function initGame() {
  updateLegend();
  if (gameMode === 'hard') {
    GRID_SIZE = 26;           // 20x20 grid, larger cells (26px) so icons are easier to see
    CANVAS_SIZE = 20 * GRID_SIZE; // 520
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  } else if (gameMode === 'carnival') {
    GRID_SIZE = 22;           // 30x30 grid (24+3 on each side), icons stay visible
    CANVAS_SIZE = 30 * GRID_SIZE; // 660
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  } else {
    GRID_SIZE = 25;
    CANVAS_SIZE = 400;
    canvas.width = 400;
    canvas.height = 400;
  }

  var startX = Math.floor(CANVAS_SIZE / GRID_SIZE / 2) * GRID_SIZE;
  var startY = Math.floor(CANVAS_SIZE / GRID_SIZE / 2) * GRID_SIZE;

  snake = [
    { x: startX, y: startY },
    { x: startX - GRID_SIZE, y: startY },
    { x: startX - GRID_SIZE * 2, y: startY }
  ];

  direction = 'right';
  nextDirection = 'right';
  keysPressed.clear();
  score = 0;
  gameStartTime = Date.now();
  slowEffectEndTime = null;
  fastEffectEndTime = null;
  sprintEndTime = null;
  sprintInvincibleEndTime = 0;
  sprintCharges = 0;
  sprintChargeProgress = 0;
  lastSprintChargeTime = Date.now();
  magnetCount = 0;
  lastMagnetGrantTime = 0;
  isPaused = false;
  lastSpacePressTime = 0;
  pausedMessage.classList.add('hidden');
  scoreDisplay.textContent = '0';
  highScoreDisplay.textContent = highScore;
  lastDisplayedScore = 0;
  gameOverMessage.classList.add('hidden');

  foodItems = [];
  if (gameMode === 'easy') {
    bomb = null;
    bombs = [];
    spawnAllItems();
  } else {
    // Hard and Carnival: bombs, stars, hearts; apple count per mode (Hard 10, Carnival 20)
    bomb = null;
    bombs = [];
    hardModeNextExpiryIndex = 0;
    carnivalModeNextExpiryIndex = 0;
    stars = [];
    lastStarSpawnTime = Date.now(); // First Star event after 15s
    hearts = [];
    if (gameMode === 'carnival') {
      carnivalNextRainTriggerAt = 20;
      carnivalScoreAtRainStart = 0;
      carnivalRainIndex = 0;
      carnivalAppleRainActive = false;
      carnivalAppleRainEndTime = 0;
      carnivalInvincibilityEndTime = 0;
      hideAppleRainOverlay();
      bombZones = [];
      lastBombZoneEventTime = 0;
      bombZoneWarningEndTime = 0;
      carnivalPendingStarMessage = false;
      pinkSquare = null;
      lastPinkSpawnTime = 0;
      scoreForRainTrigger = 0;
      carnivalDoubleScoreEndTime = 0;
      purpleSquares = [];
      lastPurpleSpawnTime = 0;
      carnivalComboCount = 0;
      carnivalLastComboEatTime = 0;
    }
    spawnAllItems();
  }
  draw();
  updateSprintUI(Date.now());
  updateMagnetUI(Date.now());
  updateSkillReadyNotice(Date.now());
}

// Draw each segment of the snake; head uses a different color so it's easy to see
function drawSnake() {
  var padding = GRID_SIZE > 30 ? 2 : 1;
  var size = GRID_SIZE - padding * 2;
  for (var i = 0; i < snake.length; i++) {
    if (i === 0) {
      ctx.fillStyle = '#1B5E20';
      ctx.strokeStyle = '#0D3D0D';
    } else {
      ctx.fillStyle = '#4CAF50';
      ctx.strokeStyle = '#1B5E20';
    }
    ctx.lineWidth = 1;
    ctx.fillRect(snake[i].x + padding, snake[i].y + padding, size, size);
    ctx.strokeRect(snake[i].x + padding, snake[i].y + padding, size, size);
  }
}

// Draw one apple by type (red, yellow, blue, green). Expiration warning: Easy = all apples blink; Hard = only yellow apples blink.
// Pass now (ms) from draw tick to avoid Date.now() per item.
function drawFoodItem(item, now) {
  if (now === undefined) now = Date.now();
  var lifetimeMs = isExtendedHardMode() ? APPLE_LIFETIME_MS_HARD : APPLE_LIFETIME_MS;
  var showBlinkWarning = (!isExtendedHardMode() || item.type === FOOD_GOLDEN);
  if (item.expires && item.spawnTime > 0 && showBlinkWarning) {
    var age = now - item.spawnTime;
    if (age >= lifetimeMs - APPLE_BLINK_LAST_MS) {
      var blinkElapsed = age - (lifetimeMs - APPLE_BLINK_LAST_MS);
      var inBlink1 = blinkElapsed >= APPLE_BLINK_1_START_MS && blinkElapsed < APPLE_BLINK_1_START_MS + APPLE_BLINK_HIDE_MS;
      var inBlink2 = blinkElapsed >= APPLE_BLINK_2_START_MS && blinkElapsed < APPLE_BLINK_2_START_MS + APPLE_BLINK_HIDE_MS;
      if (inBlink1 || inBlink2) return;
    }
  }

  var pad = GRID_SIZE <= 30 ? 3 : 4;
  var size = GRID_SIZE - pad * 2;
  ctx.lineWidth = 1;
  if (item.type === FOOD_GOLDEN) {
    ctx.fillStyle = '#F9A825';
    ctx.strokeStyle = '#F57F17';
  } else if (item.type === FOOD_BLUE) {
    ctx.fillStyle = '#1976D2';
    ctx.strokeStyle = '#0D47A1';
  } else if (item.type === FOOD_GREEN) {
    ctx.fillStyle = '#388E3C';
    ctx.strokeStyle = '#1B5E20';
  } else {
    ctx.fillStyle = '#D32F2F';
    ctx.strokeStyle = '#B71C1C';
  }
  ctx.fillRect(item.x + pad, item.y + pad, size, size);
  ctx.strokeRect(item.x + pad, item.y + pad, size, size);
}

// Draw one apple (red) at the given position - kept for compatibility, prefer drawFoodItem
function drawApple(x, y) {
  ctx.fillStyle = '#D32F2F';
  ctx.strokeStyle = '#B71C1C';
  ctx.lineWidth = 1;
  var pad = GRID_SIZE <= 30 ? 3 : 4;
  var size = GRID_SIZE - pad * 2;
  ctx.fillRect(x + pad, y + pad, size, size);
  ctx.strokeRect(x + pad, y + pad, size, size);
}

// Draw golden square (yellow) - +3 points
function drawGolden(x, y) {
  ctx.fillStyle = '#F9A825';
  ctx.strokeStyle = '#F57F17';
  ctx.lineWidth = 1;
  var pad = GRID_SIZE <= 30 ? 3 : 4;
  var size = GRID_SIZE - pad * 2;
  ctx.fillRect(x + pad, y + pad, size, size);
  ctx.strokeRect(x + pad, y + pad, size, size);
}

// Draw bomb (black square) - -10 points when touched
function drawBomb(x, y) {
  ctx.fillStyle = '#212121';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  var pad = GRID_SIZE <= 30 ? 3 : 4;
  var size = GRID_SIZE - pad * 2;
  ctx.fillRect(x + pad, y + pad, size, size);
  ctx.strokeRect(x + pad, y + pad, size, size);
}

// Hard mode only: draw the Star (+10 points). Bright 5-point star shape so it stands out from apples.
function drawStar(x, y) {
  var cx = x + GRID_SIZE / 2;
  var cy = y + GRID_SIZE / 2;
  var outer = GRID_SIZE / 2 - 2;
  var inner = outer * 0.4;
  var points = 5;
  ctx.beginPath();
  for (var i = 0; i < points * 2; i++) {
    var r = i % 2 === 0 ? outer : inner;
    var angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
    var px = cx + r * Math.cos(angle);
    var py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFD700';
  ctx.fill();
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Hard mode only: draw White Heart (-5 length). Light pink/white fill, dark outline so it's visible on the grid.
function drawHeart(x, y) {
  var cx = x + GRID_SIZE / 2;
  var cy = y + GRID_SIZE / 2;
  var r = GRID_SIZE / 2 - 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.3);
  ctx.bezierCurveTo(cx + r, cy - r * 1.2, cx + r, cy + r * 0.5, cx, cy + r * 0.9);
  ctx.bezierCurveTo(cx - r, cy + r * 0.5, cx - r, cy - r * 1.2, cx, cy - r * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#FFE4E1';  // light pink, stands out on gray
  ctx.fill();
  ctx.strokeStyle = '#8B0000';
  ctx.lineWidth = 2;
  ctx.stroke();
}
function drawBlue(x, y) {
  ctx.fillStyle = '#1976D2';
  ctx.strokeStyle = '#0D47A1';
  ctx.lineWidth = 1;
  var pad = GRID_SIZE <= 30 ? 3 : 4;
  var size = GRID_SIZE - pad * 2;
  ctx.fillRect(x + pad, y + pad, size, size);
  ctx.strokeRect(x + pad, y + pad, size, size);
}

// Draw grid lines (batched), then apples, bombs, stars, hearts, snake.
// Pass now (ms) from game tick for time-based visibility/blink; avoids repeated Date.now() in loops.
function draw(now) {
  if (now === undefined) now = Date.now();

  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_SIZE);
  }
  for (var y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_SIZE, y);
  }
  ctx.stroke();

  var i;
  var rainBlinkHide = false;
  if (gameMode === 'carnival' && carnivalAppleRainActive && carnivalAppleRainEndTime > 0) {
    var blinkStart = carnivalAppleRainEndTime - 1000;
    if (now >= blinkStart) {
      var elapsed = now - blinkStart;
      if (elapsed < 200 || (elapsed >= 400 && elapsed < 600)) rainBlinkHide = true;
    }
  }
  for (i = 0; i < foodItems.length; i++) {
    var item = foodItems[i];
    if (item.rainApple && rainBlinkHide) continue;
    drawFoodItem(item, now);
  }
  if (gameMode === 'easy' && bomb) {
    drawBomb(bomb.x, bomb.y);
  } else if (isExtendedHardMode()) {
    for (i = 0; i < bombs.length; i++) {
      drawBomb(bombs[i].x, bombs[i].y);
    }
    var starLifetime = STAR_LIFETIME_MS;
    for (i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (s.rainItem) {
        if (gameMode === 'carnival' && carnivalAppleRainActive) drawStar(s.x, s.y);
      } else {
        var age = now - s.spawnTime;
        if (age < starLifetime && Math.floor(age / STAR_BLINK_INTERVAL_MS) % 2 === 0) drawStar(s.x, s.y);
      }
    }
    for (i = 0; i < hearts.length; i++) {
      var h = hearts[i];
      if (h.rainItem) {
        if (gameMode === 'carnival' && carnivalAppleRainActive) drawHeart(h.x, h.y);
      } else if (now - h.spawnTime < starLifetime) {
        drawHeart(h.x, h.y);
      }
    }
  }
  drawBombZones(now);
  if (gameMode === 'carnival' && pinkSquare && (now - pinkSquare.spawnTime < PINK_LIFETIME_MS)) {
    var pinkAge = now - pinkSquare.spawnTime;
    if (Math.floor(pinkAge / PINK_BLINK_INTERVAL_MS) % 2 === 0) {
      ctx.fillStyle = '#F8BBD9';
      ctx.strokeStyle = '#F48FB1';
      ctx.lineWidth = 1;
      var pad = GRID_SIZE <= 30 ? 3 : 4;
      var size = GRID_SIZE - pad * 2;
      ctx.fillRect(pinkSquare.x + pad, pinkSquare.y + pad, size, size);
      ctx.strokeRect(pinkSquare.x + pad, pinkSquare.y + pad, size, size);
    }
  }
  if (gameMode === 'carnival' && purpleSquares.length > 0) {
    ctx.fillStyle = '#B39DDB';
    ctx.strokeStyle = '#7E57C2';
    ctx.lineWidth = 1;
    var pad = GRID_SIZE <= 30 ? 3 : 4;
    var size = GRID_SIZE - pad * 2;
    for (var pi = 0; pi < purpleSquares.length; pi++) {
      var pur = purpleSquares[pi];
      if (now - pur.spawnTime < PURPLE_LIFETIME_MS) {
        ctx.fillRect(pur.x + pad, pur.y + pad, size, size);
        ctx.strokeRect(pur.x + pad, pur.y + pad, size, size);
      }
    }
  }
  drawSnake();
}

// ========== ITEM SPAWNING ==========
// Items must not spawn on snake or on each other. skipCell = optional { x, y } to treat as free.

function isCellOccupied(x, y, skipCell) {
  if (skipCell && skipCell.x === x && skipCell.y === y) return false;
  var i;
  for (i = 0; i < snake.length; i++) {
    if (snake[i].x === x && snake[i].y === y) return true;
  }
  for (i = 0; i < foodItems.length; i++) {
    if (foodItems[i].x === x && foodItems[i].y === y) return true;
  }
  if (gameMode === 'easy') {
    if (bomb && bomb.x === x && bomb.y === y) return true;
  } else {
    for (i = 0; i < bombs.length; i++) {
      if (bombs[i].x === x && bombs[i].y === y) return true;
    }
    for (i = 0; i < stars.length; i++) {
      if (stars[i].x === x && stars[i].y === y) return true;
    }
    for (i = 0; i < hearts.length; i++) {
      if (hearts[i].x === x && hearts[i].y === y) return true;
    }
  }
  if (gameMode === 'carnival' && pinkSquare && pinkSquare.x === x && pinkSquare.y === y) return true;
  if (gameMode === 'carnival') {
    for (i = 0; i < purpleSquares.length; i++) {
      if (purpleSquares[i].x === x && purpleSquares[i].y === y) return true;
    }
  }
  return false;
}

// Returns { x, y } for a random empty cell, or null if none found. skipCell = optional cell to treat as free.
function getRandomEmptyCell(skipCell) {
  var cols = CANVAS_SIZE / GRID_SIZE;
  var attempts = 0;
  while (attempts < 500) {
    var x = Math.floor(Math.random() * cols) * GRID_SIZE;
    var y = Math.floor(Math.random() * cols) * GRID_SIZE;
    if (!isCellOccupied(x, y, skipCell)) return { x: x, y: y };
    attempts++;
  }
  return null;
}

// Magnet skill: collect red and yellow apples in 7x7 area around head. Bonus score only (no Apple Rain progress, no Combo).
function activateMagnet() {
  if (magnetCount < 1 || snake.length === 0) return;
  magnetCount--;
  var head = snake[0];
  var cols = CANVAS_SIZE / GRID_SIZE;
  var hcol = head.x / GRID_SIZE;
  var hrow = head.y / GRID_SIZE;
  var i;
  for (i = foodItems.length - 1; i >= 0; i--) {
    var item = foodItems[i];
    if (item.rainApple) continue;
    if (item.type !== FOOD_RED && item.type !== FOOD_GOLDEN) continue;
    var acol = item.x / GRID_SIZE;
    var arow = item.y / GRID_SIZE;
    var dx = (acol - hcol + cols) % cols;
    if (dx > cols / 2) dx -= cols;
    var dy = (arow - hrow + cols) % cols;
    if (dy > cols / 2) dy -= cols;
    if (Math.abs(dx) <= 3 && Math.abs(dy) <= 3) {
      var points = item.type === FOOD_GOLDEN ? 3 : 1;
      score += points;
      var pos = { x: item.x, y: item.y };
      foodItems.splice(i, 1);
      spawnOneFood(pos, gameMode === 'carnival' || gameMode === 'hard');
    }
  }
  if (score !== lastDisplayedScore) {
    scoreDisplay.textContent = score;
    lastDisplayedScore = score;
  }
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;
  }
}

function updateMagnetGrant(now) {
  if (magnetCount >= MAGNET_MAX_STACK) return;
  var interval = (lastMagnetGrantTime === 0) ? MAGNET_FIRST_GRANT_MS : MAGNET_GRANT_INTERVAL_MS;
  var refTime = lastMagnetGrantTime === 0 ? gameStartTime : lastMagnetGrantTime;
  if (now - refTime >= interval) {
    magnetCount = MAGNET_MAX_STACK;
    lastMagnetGrantTime = now;
  }
}

function updateMagnetUI(now) {
  var el = document.getElementById('magnetStatus');
  if (!el) return;
  if (!isGameRunning) {
    el.textContent = 'Magnet: --';
    el.classList.remove('ready');
    return;
  }
  if (magnetCount >= 1) {
    el.textContent = 'Magnet: Ready';
    el.classList.add('ready');
  } else {
    el.classList.remove('ready');
    if (now === undefined) now = Date.now();
    var interval = (lastMagnetGrantTime === 0) ? MAGNET_FIRST_GRANT_MS : MAGNET_GRANT_INTERVAL_MS;
    var refTime = lastMagnetGrantTime === 0 ? gameStartTime : lastMagnetGrantTime;
    var remaining = Math.ceil((interval - (now - refTime)) / 1000);
    if (remaining < 0) remaining = 0;
    el.textContent = 'Magnet: ' + remaining + 's';
  }
}

function updateSkillReadyNotice(now) {
  var sprintPill = document.getElementById('canvasSprintReady');
  var magnetPill = document.getElementById('canvasMagnetReady');
  if (!isGameRunning) {
    if (sprintPill) sprintPill.classList.add('hidden');
    if (magnetPill) magnetPill.classList.add('hidden');
    return;
  }
  if (sprintPill) {
    if (sprintCharges >= 3) sprintPill.classList.remove('hidden');
    else sprintPill.classList.add('hidden');
  }
  if (magnetPill) {
    if (magnetCount >= 1) magnetPill.classList.remove('hidden');
    else magnetPill.classList.add('hidden');
  }
}

function updateLegend() {
  var container = document.getElementById('legend');
  if (!container) return;
  var items = [];
  function add(swatchClass, label) {
    items.push('<span class="legend-item"><span class="legend-swatch ' + swatchClass + '"></span> ' + label + '</span>');
  }
  add('legend-red', '+1 pt, +1 len');
  add('legend-yellow', '+3 pt, +2 len');
  add('legend-blue', 'Slow');
  add('legend-green', 'Fast');
  if (gameMode === 'easy') {
    add('legend-bomb', '-10 pt');
  } else if (gameMode === 'hard') {
    add('legend-bomb', '-10 pt');
    add('legend-star', '+10 pt');
    add('legend-heart', '-5 len');
  } else if (gameMode === 'carnival') {
    add('legend-bomb', '-5 pt');
    add('legend-star', '+10 pt');
    add('legend-heart', '-10 len');
    add('legend-pink', '3s invincible');
    add('legend-purple', '2× score 3s');
  }
  container.innerHTML = items.join('');
}

// Pick random apple type: red 60%, yellow 10%, blue 15%, green 15%
function randomFoodType() {
  var r = Math.random();
  if (r < FOOD_PROB_RED) return FOOD_RED;
  if (r < FOOD_PROB_RED + FOOD_PROB_YELLOW) return FOOD_GOLDEN;
  if (r < FOOD_PROB_RED + FOOD_PROB_YELLOW + FOOD_PROB_BLUE) return FOOD_BLUE;
  return FOOD_GREEN;
}

// Carnival Apple Rain only: pick type for Normal Rain (Red 50%, Green 20%, Blue 15%, Yellow 15%)
function carnivalRainNormalType() {
  var r = Math.random();
  if (r < 0.5) return FOOD_RED;
  if (r < 0.7) return FOOD_GREEN;
  if (r < 0.85) return FOOD_BLUE;
  return FOOD_GOLDEN;
}

// Carnival Apple Rain only: pick type for Golden Rain (Yellow 65%, Green 10%, Blue 10%, Red 15%)
function carnivalRainGoldenType() {
  var r = Math.random();
  if (r < 0.65) return FOOD_GOLDEN;
  if (r < 0.75) return FOOD_GREEN;
  if (r < 0.85) return FOOD_BLUE;
  return FOOD_RED;
}

// Carnival only: spawn 40 rain apples (30 with probability + 10 guaranteed), plus 2 rain hearts and 1 or 2 rain stars. Removed when rain ends.
function spawnAppleRainApples(isGolden) {
  var pickType = isGolden ? carnivalRainGoldenType : carnivalRainNormalType;
  var guaranteedType = isGolden ? FOOD_GOLDEN : FOOD_RED;
  var cell;
  var i;
  for (i = 0; i < 30; i++) {
    cell = getRandomEmptyCell(null);
    if (cell) {
      foodItems.push({
        x: cell.x,
        y: cell.y,
        type: pickType(),
        spawnTime: 0,
        expires: false,
        rainApple: true
      });
    }
  }
  for (i = 0; i < 10; i++) {
    cell = getRandomEmptyCell(null);
    if (cell) {
      foodItems.push({
        x: cell.x,
        y: cell.y,
        type: guaranteedType,
        spawnTime: 0,
        expires: false,
        rainApple: true
      });
    }
  }
  var rainStarCount = isGolden ? 2 : 1;
  for (i = 0; i < rainStarCount; i++) {
    cell = getRandomEmptyCell(null);
    if (cell) stars.push({ x: cell.x, y: cell.y, spawnTime: 0, rainItem: true });
  }
  for (i = 0; i < 2; i++) {
    cell = getRandomEmptyCell(null);
    if (cell) hearts.push({ x: cell.x, y: cell.y, spawnTime: 0, rainItem: true });
  }
}

// Spawn one apple so total stays at 6. skipCell = cell to treat as free.
// shouldExpire: if true, this apple will expire after APPLE_LIFETIME_MS; if false, it never expires (used for initial 6).
// typeOverride: optional; if provided (e.g. FOOD_GOLDEN, FOOD_RED), use this type instead of random.
function spawnOneFood(skipCell, shouldExpire, typeOverride) {
  var cell = getRandomEmptyCell(skipCell);
  if (cell) {
    foodItems.push({
      x: cell.x,
      y: cell.y,
      type: typeOverride !== undefined ? typeOverride : randomFoodType(),
      spawnTime: shouldExpire ? Date.now() : 0,
      expires: !!shouldExpire
    });
  }
}

// Spawn or respawn the single bomb (Easy mode). skipCell = current bomb position when respawning.
function spawnBomb(skipCell) {
  var cell = getRandomEmptyCell(skipCell);
  if (cell) bomb = { x: cell.x, y: cell.y }; else bomb = null;
}

// Hard mode: spawn one bomb with given expiry (ms). New bombs get 10s/20s/30s in rotation.
function spawnOneBombHard(skipCell, expiryMs) {
  var cell = getRandomEmptyCell(skipCell);
  if (cell) {
    bombs.push({
      x: cell.x,
      y: cell.y,
      spawnTime: Date.now(),
      expiryMs: expiryMs
    });
  }
}

// Carnival only: combo system. Call when eating something that gives score (apple, star, zone star, zone apple). now = carnivalTickNow.
// Combo x3 → +1, x4 → +2, x5 → +3, ... (bonus = count - 2). No bonus during Apple Rain or any invincibility.
function carnivalOnComboEat(now, isBonusStar) {
  if (gameMode !== 'carnival') return;
  var windowMs = carnivalAppleRainActive ? COMBO_WINDOW_APPLE_RAIN_MS : COMBO_WINDOW_MS;
  if (carnivalLastComboEatTime > 0 && (now - carnivalLastComboEatTime) > windowMs) carnivalComboCount = 0;
  carnivalComboCount++;
  carnivalLastComboEatTime = now;
  var inNoBonusPhase = carnivalAppleRainActive ||
    (carnivalInvincibilityEndTime > 0 && now < carnivalInvincibilityEndTime) ||
    (sprintInvincibleEndTime > 0 && now < sprintInvincibleEndTime);
  if (carnivalComboCount >= 3 && !inNoBonusPhase) {
    var bonus = carnivalComboCount - 2;
    score += bonus;
    var el = document.getElementById('comboMessage');
    var textEl = document.getElementById('comboMessageText');
    if (el && textEl) {
      textEl.textContent = 'COMBO x' + carnivalComboCount + '!';
      el.classList.remove('hidden');
      if (comboMessageTimeout) clearTimeout(comboMessageTimeout);
      comboMessageTimeout = setTimeout(function() {
        el.classList.add('hidden');
        comboMessageTimeout = null;
      }, COMBO_DISPLAY_MS);
    }
  }
}

// Carnival only: update Apple Rain (start when score reaches trigger, end after 5s, 1s invincibility, remove rain apples).
// Call every game tick when gameMode === 'carnival'. Pass now from game tick.
function updateCarnivalAppleRain(now) {
  if (gameMode !== 'carnival') return;

  if (carnivalAppleRainActive && now >= carnivalAppleRainEndTime) {
    carnivalAppleRainActive = false;
    carnivalInvincibilityEndTime = now + 1000;
    carnivalNextRainTriggerAt = scoreForRainTrigger + 15;
    for (var i = foodItems.length - 1; i >= 0; i--) {
      if (foodItems[i].rainApple) foodItems.splice(i, 1);
    }
    for (i = stars.length - 1; i >= 0; i--) {
      if (stars[i].rainItem) stars.splice(i, 1);
    }
    for (i = hearts.length - 1; i >= 0; i--) {
      if (hearts[i].rainItem) hearts.splice(i, 1);
    }
    hideAppleRainOverlay();
    return;
  }

  if (!carnivalAppleRainActive && now >= carnivalInvincibilityEndTime && scoreForRainTrigger >= carnivalNextRainTriggerAt) {
    carnivalAppleRainActive = true;
    carnivalScoreAtRainStart = score;
    carnivalAppleRainEndTime = now + 5000;
    var isGolden = (carnivalRainIndex % 3) === 2;
    spawnAppleRainApples(isGolden);
    carnivalRainIndex++;
    showAppleRainOverlay();
  }
}

function showAppleRainOverlay() {
  if (appleRainOverlayEl) {
    appleRainOverlayEl.classList.remove('hidden');
    if (appleRainCountdownEl) appleRainCountdownEl.textContent = '5';
  }
}

function hideAppleRainOverlay() {
  if (appleRainOverlayEl) appleRainOverlayEl.classList.add('hidden');
  if (appleRainCountdownEl) appleRainCountdownEl.textContent = '';
}

function updateAppleRainOverlay(now) {
  if (!appleRainOverlayEl || !appleRainCountdownEl || !carnivalAppleRainActive) return;
  var remaining = Math.ceil((carnivalAppleRainEndTime - now) / 1000);
  if (remaining < 0) remaining = 0;
  appleRainCountdownEl.textContent = String(remaining);
}

// Carnival only: pink invincibility square. Spawn every 15s at random cell, lasts 3s (blinks), eating gives 3s invincibility (no score, no slow, no damage, no self-death).
function updateCarnivalPinkSquare(now) {
  if (gameMode !== 'carnival') return;
  if (pinkSquare && (now - pinkSquare.spawnTime >= PINK_LIFETIME_MS)) pinkSquare = null;
  if (!pinkSquare && (now - lastPinkSpawnTime >= PINK_SPAWN_INTERVAL_MS)) {
    var cell = getRandomEmptyCell(null);
    if (cell) {
      pinkSquare = { x: cell.x, y: cell.y, spawnTime: now };
      lastPinkSpawnTime = now;
    }
  }
}

// Carnival only: two purple double-score squares. Spawn at start and every 20s, each lasts 3s. Eating one gives 3s double score/double penalty; that score does not count toward Apple Rain.
function updateCarnivalPurpleSquares(now) {
  if (gameMode !== 'carnival') return;
  var i;
  for (i = purpleSquares.length - 1; i >= 0; i--) {
    if (now - purpleSquares[i].spawnTime >= PURPLE_LIFETIME_MS) purpleSquares.splice(i, 1);
  }
  if (lastPurpleSpawnTime === 0 || (now - lastPurpleSpawnTime >= PURPLE_SPAWN_INTERVAL_MS)) {
    for (i = 0; i < 2; i++) {
      var cell = getRandomEmptyCell(null);
      if (cell) purpleSquares.push({ x: cell.x, y: cell.y, spawnTime: now });
    }
    lastPurpleSpawnTime = now;
  }
}

// ---------- Carnival Bomb Zone ----------
function getRandomZonePositions() {
  var cols = CANVAS_SIZE / GRID_SIZE;
  var rows = cols;
  var list = [];
  var attempts = 0;
  while (list.length < 4 && attempts < 200) {
    attempts++;
    var col = Math.floor(Math.random() * Math.max(1, cols - BOMB_ZONE_MAX_SIZE + 1));
    var row = Math.floor(Math.random() * Math.max(1, rows - BOMB_ZONE_MAX_SIZE + 1));
    var overlaps = false;
    for (var k = 0; k < list.length; k++) {
      if (Math.abs(list[k].col - col) < BOMB_ZONE_MAX_SIZE && Math.abs(list[k].row - row) < BOMB_ZONE_MAX_SIZE) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) list.push({ col: col, row: row });
  }
  return list;
}

// Carnival only: check zone is fully on board.
function bombZoneInBounds(zone) {
  var w = zone.zoneSize * GRID_SIZE;
  return zone.left >= 0 && zone.top >= 0 &&
    zone.left + w <= CANVAS_SIZE && zone.top + w <= CANVAS_SIZE;
}

// Carnival only: check if zone overlaps any other zone in the list (excluding excludeIndex).
function bombZoneOverlapsOther(zone, excludeIndex, zonesList) {
  var i;
  var left = zone.left;
  var top = zone.top;
  var size = zone.zoneSize;
  var right = left + size * GRID_SIZE;
  var bottom = top + size * GRID_SIZE;
  for (i = 0; i < zonesList.length; i++) {
    if (i === excludeIndex) continue;
    var o = zonesList[i];
    var oLeft = o.left;
    var oTop = o.top;
    var oSize = o.zoneSize;
    var oRight = oLeft + oSize * GRID_SIZE;
    var oBottom = oTop + oSize * GRID_SIZE;
    if (!(right <= oLeft || left >= oRight || bottom <= oTop || top >= oBottom))
      return true;
  }
  return false;
}

function spawnOneBombZone(col, row, now) {
  var left = col * GRID_SIZE;
  var top = row * GRID_SIZE;
  var outerCells = [];
  var coreCells = [];
  var allCells = [];
  for (var gx = 0; gx < BOMB_ZONE_SIZE; gx++) {
    for (var gy = 0; gy < BOMB_ZONE_SIZE; gy++) {
      var px = left + gx * GRID_SIZE;
      var py = top + gy * GRID_SIZE;
      allCells.push({ x: px, y: py });
      if (gx === 0 || gx === BOMB_ZONE_SIZE - 1 || gy === 0 || gy === BOMB_ZONE_SIZE - 1) {
        outerCells.push({ x: px, y: py });
      } else {
        coreCells.push({ x: px, y: py });
      }
    }
  }
  function pickRandom(arr, count) {
    var out = [];
    var copy = arr.slice();
    for (var i = 0; i < count && copy.length > 0; i++) {
      var idx = Math.floor(Math.random() * copy.length);
      out.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return out;
  }
  var bombCells = pickRandom(allCells, 3);
  var bombs = bombCells.map(function(c) { return { x: c.x, y: c.y }; });
  var coreForStarHeart = pickRandom(coreCells, 2);
  var starCell = coreForStarHeart[0];
  var heartCell = coreForStarHeart[1];
  var appleCells = pickRandom(outerCells, 2);
  var apples = appleCells.map(function(c) {
    return { x: c.x, y: c.y, type: FOOD_GOLDEN };
  });
  return {
    startTime: now,
    endTime: now + BOMB_ZONE_DURATION_MS,
    left: left,
    top: top,
    zoneSize: BOMB_ZONE_SIZE,
    lastUpdateSecond: 1,
    outerCells: outerCells,
    coreCells: coreCells,
    bombs: bombs,
    star: starCell ? { x: starCell.x, y: starCell.y, spawnTime: now } : null,
    heart: heartCell ? { x: heartCell.x, y: heartCell.y, spawnTime: now } : null,
    apples: apples
  };
}

function spawnBombZones(now) {
  var positions = getRandomZonePositions();
  for (var p = 0; p < positions.length; p++) {
    var zone = spawnOneBombZone(positions[p].col, positions[p].row, now);
    bombZones.push(zone);
  }
}

function moveBombZone(zone, dir, zoneIndex, zonesList) {
  // 0=up, 1=down, 2=left, 3=right. Move 2 grid cells. Try chosen dir first, then others if invalid.
  var dirs = [dir];
  var d;
  for (d = 0; d < 4; d++) if (d !== dir) dirs.push(d);
  var zonePx = zone.zoneSize * GRID_SIZE;
  var chosenDx = 0, chosenDy = 0;
  var found = false;
  for (var idx = 0; idx < dirs.length; idx++) {
    d = dirs[idx];
    var dx = (d === 2) ? -2 * GRID_SIZE : (d === 3) ? 2 * GRID_SIZE : 0;
    var dy = (d === 0) ? -2 * GRID_SIZE : (d === 1) ? 2 * GRID_SIZE : 0;
    var newLeft = Math.max(0, Math.min(CANVAS_SIZE - zonePx, zone.left + dx));
    var newTop = Math.max(0, Math.min(CANVAS_SIZE - zonePx, zone.top + dy));
    var proposed = { left: newLeft, top: newTop, zoneSize: zone.zoneSize };
    if (bombZoneInBounds(proposed) && !bombZoneOverlapsOther(proposed, zoneIndex, zonesList)) {
      chosenDx = newLeft - zone.left;
      chosenDy = newTop - zone.top;
      found = true;
      break;
    }
  }
  if (!found) return;
  zone.left += chosenDx;
  zone.top += chosenDy;
  var i;
  for (i = 0; i < zone.outerCells.length; i++) {
    zone.outerCells[i].x += chosenDx;
    zone.outerCells[i].y += chosenDy;
  }
  for (i = 0; i < zone.coreCells.length; i++) {
    zone.coreCells[i].x += chosenDx;
    zone.coreCells[i].y += chosenDy;
  }
  for (i = 0; i < zone.bombs.length; i++) {
    zone.bombs[i].x += chosenDx;
    zone.bombs[i].y += chosenDy;
  }
  if (zone.star) {
    zone.star.x += chosenDx;
    zone.star.y += chosenDy;
  }
  if (zone.heart) {
    zone.heart.x += chosenDx;
    zone.heart.y += chosenDy;
  }
  for (i = 0; i < zone.apples.length; i++) {
    zone.apples[i].x += chosenDx;
    zone.apples[i].y += chosenDy;
  }
}

function expandBombZone(zone, zoneIndex, zonesList) {
  if (zone.zoneSize >= BOMB_ZONE_MAX_SIZE) return;
  // Expand by 2 each step (5→7→9) so the zone grows one layer on each side from center.
  var newSize = zone.zoneSize + 2;
  if (newSize > BOMB_ZONE_MAX_SIZE) return;
  var newLeft = zone.left - GRID_SIZE;
  var newTop = zone.top - GRID_SIZE;
  var proposed = { left: newLeft, top: newTop, zoneSize: newSize };
  if (!bombZoneInBounds(proposed) || bombZoneOverlapsOther(proposed, zoneIndex, zonesList)) return;
  var offset = -GRID_SIZE;
  zone.left = newLeft;
  zone.top = newTop;
  zone.zoneSize = newSize;
  var i;
  for (i = 0; i < zone.outerCells.length; i++) {
    zone.outerCells[i].x += offset;
    zone.outerCells[i].y += offset;
  }
  for (i = 0; i < zone.coreCells.length; i++) {
    zone.coreCells[i].x += offset;
    zone.coreCells[i].y += offset;
  }
  for (i = 0; i < zone.bombs.length; i++) {
    zone.bombs[i].x += offset;
    zone.bombs[i].y += offset;
  }
  if (zone.star) {
    zone.star.x += offset;
    zone.star.y += offset;
  }
  if (zone.heart) {
    zone.heart.x += offset;
    zone.heart.y += offset;
  }
  for (i = 0; i < zone.apples.length; i++) {
    zone.apples[i].x += offset;
    zone.apples[i].y += offset;
  }
  // Replace outer with the new perimeter only (one new layer).
  var left = zone.left;
  var top = zone.top;
  var sz = zone.zoneSize;
  zone.outerCells = [];
  for (i = 0; i < sz; i++) {
    zone.outerCells.push({ x: left + i * GRID_SIZE, y: top });
    zone.outerCells.push({ x: left + i * GRID_SIZE, y: top + (sz - 1) * GRID_SIZE });
  }
  for (i = 1; i < sz - 1; i++) {
    zone.outerCells.push({ x: left, y: top + i * GRID_SIZE });
    zone.outerCells.push({ x: left + (sz - 1) * GRID_SIZE, y: top + i * GRID_SIZE });
  }
  // Core: center 3x3 of the zone.
  var start = Math.floor((sz - 3) / 2);
  zone.coreCells = [];
  for (var gx = start; gx <= start + 2; gx++) {
    for (var gy = start; gy <= start + 2; gy++) {
      zone.coreCells.push({ x: left + gx * GRID_SIZE, y: top + gy * GRID_SIZE });
    }
  }
}

function updateCarnivalBombZone(now) {
  if (gameMode !== 'carnival') return;
  var i;
  for (i = bombZones.length - 1; i >= 0; i--) {
    if (now >= bombZones[i].endTime) bombZones.splice(i, 1);
  }
  if (bombZoneWarningEndTime > 0 && now >= bombZoneWarningEndTime) {
    bombZoneWarningEndTime = 0;
    if (bombZoneWarningEl) bombZoneWarningEl.classList.add('hidden');
    spawnBombZones(now);
    if (carnivalPendingStarMessage) {
      carnivalPendingStarMessage = false;
      setStarMessage('⭐ Stars appeared!');
    }
    return;
  }
  if (bombZones.length === 0 && bombZoneWarningEndTime === 0 && (now - lastBombZoneEventTime >= BOMB_ZONE_INTERVAL_MS)) {
    lastBombZoneEventTime = now;
    bombZoneWarningEndTime = now + BOMB_ZONE_WARNING_MS;
    if (bombZoneWarningEl) bombZoneWarningEl.classList.remove('hidden');
  }
  var elapsed = 0;
  var currentSecond = 0;
  for (i = 0; i < bombZones.length; i++) {
    var zone = bombZones[i];
    if (now >= zone.endTime) continue;
    elapsed = now - zone.startTime;
    if (elapsed < BOMB_ZONE_STATIONARY_MS) continue;
    currentSecond = Math.floor(elapsed / 1000);
    if (currentSecond < 2 || currentSecond === zone.lastUpdateSecond) continue;
    zone.lastUpdateSecond = currentSecond;
    // One action per update: either move or expand, never both.
    if (Math.random() < 0.5) {
      var dir = Math.floor(Math.random() * 4);
      moveBombZone(zone, dir, i, bombZones);
    } else {
      expandBombZone(zone, i, bombZones);
    }
  }
}

function drawBombZones(now) {
  if (gameMode !== 'carnival') return;
  var i, z;
  for (z = 0; z < bombZones.length; z++) {
    var zone = bombZones[z];
    if (now >= zone.endTime) continue;
    for (i = 0; i < zone.outerCells.length; i++) {
      var c = zone.outerCells[i];
      ctx.fillStyle = 'rgba(220, 60, 60, 0.35)';
      ctx.fillRect(c.x, c.y, GRID_SIZE, GRID_SIZE);
    }
    for (i = 0; i < zone.coreCells.length; i++) {
      c = zone.coreCells[i];
      ctx.fillStyle = 'rgba(180, 40, 40, 0.6)';
      ctx.fillRect(c.x, c.y, GRID_SIZE, GRID_SIZE);
    }
    for (i = 0; i < zone.bombs.length; i++) {
      drawBomb(zone.bombs[i].x, zone.bombs[i].y);
    }
    if (zone.star && (now - zone.star.spawnTime < BOMB_ZONE_CORE_ITEMS_MS)) {
      drawStar(zone.star.x, zone.star.y);
    }
    if (zone.heart && (now - zone.heart.spawnTime < BOMB_ZONE_CORE_ITEMS_MS)) {
      drawHeart(zone.heart.x, zone.heart.y);
    }
    for (i = 0; i < zone.apples.length; i++) {
      var a = zone.apples[i];
      ctx.fillStyle = '#F9A825';
      ctx.strokeStyle = '#F57F17';
      ctx.lineWidth = 1;
      var pad = GRID_SIZE <= 30 ? 3 : 4;
      var size = GRID_SIZE - pad * 2;
      ctx.fillRect(a.x + pad, a.y + pad, size, size);
      ctx.strokeRect(a.x + pad, a.y + pad, size, size);
    }
  }
}

// Fill board with apples and bomb(s). Easy: 6 apples, 1 bomb. Hard: 10 apples, 3 bombs. Carnival: 30 apples (20 random + 5 golden + 5 red), 6 bombs (8s expiry).
function spawnAllItems() {
  foodItems = [];
  var i;
  var totalApples = gameMode === 'carnival' ? TOTAL_APPLES_CARNIVAL
    : (isExtendedHardMode() ? TOTAL_APPLES_HARD : TOTAL_APPLES);
  for (i = 0; i < totalApples; i++) {
    spawnOneFood(null, false);
  }
  if (gameMode === 'carnival') {
    for (i = 0; i < CARNIVAL_EXTRA_GOLDEN_APPLES; i++) spawnOneFood(null, false, FOOD_GOLDEN);
    for (i = 0; i < CARNIVAL_EXTRA_RED_APPLES; i++) spawnOneFood(null, false, FOOD_RED);
  }
  if (gameMode === 'easy') {
    spawnBomb(null);
  } else if (gameMode === 'carnival') {
    bombs = [];
    carnivalModeNextExpiryIndex = 0;
    for (i = 0; i < BOMB_COUNT_CARNIVAL; i++) {
      spawnOneBombHard(null, BOMB_EXPIRY_MS_CARNIVAL);
      carnivalModeNextExpiryIndex++;
    }
  } else {
    bombs = [];
    hardModeNextExpiryIndex = 0;
    spawnOneBombHard(null, BOMB_EXPIRY_MS_HARD[0]);
    spawnOneBombHard(null, BOMB_EXPIRY_MS_HARD[1]);
    spawnOneBombHard(null, BOMB_EXPIRY_MS_HARD[2]);
  }
}

// Hard/Carnival: remove expired bombs and respawn so total stays 3 (Hard) or 6 (Carnival).
// Pass now (ms) from game tick to avoid Date.now() per call.
function checkBombExpiration(now) {
  if (!isExtendedHardMode() || bombs.length === 0) return;
  if (now === undefined) now = Date.now();
  var expiryArr = BOMB_EXPIRY_MS_HARD;
  for (var i = bombs.length - 1; i >= 0; i--) {
    var b = bombs[i];
    if (now - b.spawnTime >= b.expiryMs) {
      var oldPos = { x: b.x, y: b.y };
      bombs.splice(i, 1);
      var nextExpiry = gameMode === 'carnival'
        ? BOMB_EXPIRY_MS_CARNIVAL
        : expiryArr[hardModeNextExpiryIndex % 3];
      if (gameMode === 'carnival') {
        carnivalModeNextExpiryIndex++;
      } else {
        hardModeNextExpiryIndex++;
      }
      spawnOneBombHard(oldPos, nextExpiry);
    }
  }
}

// Hard mode only: show one message when Stars appear ("⭐ Stars appeared!"). Short display then fade out.
function setStarMessage(text) {
  if (!starMessageEl || !isExtendedHardMode()) return;
  var textEl = starMessageEl.querySelector('.star-message-text');
  if (textEl) textEl.textContent = text;
  starMessageEl.classList.remove('hidden', 'star-message-fade-out');
  if (starMessageTimeout) clearTimeout(starMessageTimeout);
  if (starMessageFadeTimeout) clearTimeout(starMessageFadeTimeout);
  starMessageFadeTimeout = setTimeout(function() {
    starMessageEl.classList.add('star-message-fade-out');
    starMessageFadeTimeout = null;
  }, 1000);
  starMessageTimeout = setTimeout(function() {
    starMessageEl.classList.add('hidden');
    starMessageEl.classList.remove('star-message-fade-out');
    if (textEl) textEl.textContent = '';
    starMessageTimeout = null;
  }, 1500);
}

// Hard/Carnival: spawn Stars and White Hearts periodically; remove expired. Hard: 2 stars + 2 hearts every 15s. Carnival: 5 stars + 5 hearts every 12s.
// Pass now (ms) from game tick to avoid Date.now() per call.
function updateStarHard(now) {
  if (!isExtendedHardMode()) return;
  if (now === undefined) now = Date.now();
  var i;
  for (i = stars.length - 1; i >= 0; i--) {
    if (now - stars[i].spawnTime >= STAR_LIFETIME_MS) {
      stars.splice(i, 1);
    }
  }
  for (i = hearts.length - 1; i >= 0; i--) {
    if (now - hearts[i].spawnTime >= STAR_LIFETIME_MS) {
      hearts.splice(i, 1);
    }
  }
  if (stars.length > 0 || hearts.length > 0) return;
  var starInterval = (gameMode === 'carnival') ? STAR_SPAWN_INTERVAL_MS_CARNIVAL : STAR_SPAWN_INTERVAL_MS;
  if (now - lastStarSpawnTime < starInterval) return;
  var starCount = (gameMode === 'carnival') ? 5 : 2;
  var heartCount = (gameMode === 'carnival') ? 5 : 2;
  var k, cell;
  for (k = 0; k < starCount; k++) {
    cell = getRandomEmptyCell(null);
    if (cell) stars.push({ x: cell.x, y: cell.y, spawnTime: now });
  }
  for (k = 0; k < heartCount; k++) {
    cell = getRandomEmptyCell(null);
    if (cell) hearts.push({ x: cell.x, y: cell.y, spawnTime: now });
  }
  if (stars.length === 0 && hearts.length === 0) return;
  lastStarSpawnTime = now;
  if (gameMode === 'carnival' && bombZoneWarningEndTime > 0 && now < bombZoneWarningEndTime) {
    carnivalPendingStarMessage = true;
  } else {
    setStarMessage('⭐ Stars appeared!');
  }
}

// Remove expired apples and spawn new ones so total stays 6 (Easy) or 10 (Hard). Only Hard Mode has apple expiration.
// Pass now (ms) from game tick to avoid Date.now() per call.
function checkAppleExpiration(now) {
  if (!isExtendedHardMode()) return;
  if (now === undefined) now = Date.now();
  for (var i = foodItems.length - 1; i >= 0; i--) {
    var item = foodItems[i];
    if (item.expires && now - item.spawnTime >= APPLE_LIFETIME_MS_HARD) {
      foodItems.splice(i, 1);
      spawnOneFood(null, true);
    }
  }
}

// Move the snake one step. Wrap-around. Check 6 apples (red +1, yellow +3, blue slow, green speed up), then bomb (-10).
function moveSnake() {
  direction = nextDirection;
  var head = snake[0];
  var newHead = { x: head.x, y: head.y };

  if (direction === 'right') {
    newHead.x = newHead.x + GRID_SIZE;
  } else if (direction === 'left') {
    newHead.x = newHead.x - GRID_SIZE;
  } else if (direction === 'up') {
    newHead.y = newHead.y - GRID_SIZE;
  } else if (direction === 'down') {
    newHead.y = newHead.y + GRID_SIZE;
  }

  if (newHead.x >= CANVAS_SIZE) newHead.x = 0;
  if (newHead.x < 0) newHead.x = CANVAS_SIZE - GRID_SIZE;
  if (newHead.y >= CANVAS_SIZE) newHead.y = 0;
  if (newHead.y < 0) newHead.y = CANVAS_SIZE - GRID_SIZE;

  snake.unshift(newHead);

  var ateSomething = false;
  var doubleActive = gameMode === 'carnival' && carnivalDoubleScoreEndTime > 0 && carnivalTickNow < carnivalDoubleScoreEndTime;

  // Check the 6 apples - eat one, remove it, spawn a new one so total stays 6
  for (var a = 0; a < foodItems.length; a++) {
    if (newHead.x === foodItems[a].x && newHead.y === foodItems[a].y) {
      var eaten = foodItems[a];
      if (eaten.type === FOOD_GOLDEN) {
        var base = 3;
        if (gameMode === 'carnival') { scoreForRainTrigger += base; score += doubleActive ? base * 2 : base; carnivalOnComboEat(carnivalTickNow, false); } else { score += base; }
        if (isExtendedHardMode() && !carnivalNoLengthGainThisTick) {
          var tail = snake[snake.length - 1];
          snake.push({ x: tail.x, y: tail.y });
          snake.push({ x: tail.x, y: tail.y });
        }
      } else if (eaten.type === FOOD_BLUE) {
        slowEffectEndTime = Date.now() + SPEED_EFFECT_DURATION_MS;
      } else if (eaten.type === FOOD_GREEN) {
        fastEffectEndTime = Date.now() + SPEED_EFFECT_DURATION_MS;
      } else {
        var baseRed = 1;
        if (gameMode === 'carnival') { scoreForRainTrigger += baseRed; score += doubleActive ? baseRed * 2 : baseRed; carnivalOnComboEat(carnivalTickNow, false); } else { score += baseRed; }
        if (!(gameMode === 'carnival' && carnivalNoLengthGainThisTick)) {
          var tail = snake[snake.length - 1];
          snake.push({ x: tail.x, y: tail.y });
        }
      }
      ateSomething = true;
      var eatenPos = { x: eaten.x, y: eaten.y };
      foodItems.splice(a, 1);
      if (!eaten.rainApple) spawnOneFood(eatenPos, gameMode === 'carnival' || gameMode === 'hard'); // Replace normal apples; rain apples are not replaced
      break;
    }
  }

  // Check bomb(s) - do not end game; -10 points, respawn that bomb. Hard: 3 bombs. Carnival: 8 bombs. Ignored during Apple Rain/invincibility or sprint invincible.
  if (gameMode === 'easy') {
    if (!sprintInvincibleThisTick && bomb && newHead.x === bomb.x && newHead.y === bomb.y) {
      score = score - 10;
      if (score < 0) score = 0;
      var oldBomb = { x: bomb.x, y: bomb.y };
      spawnBomb(oldBomb);
      ateSomething = true;
    }
  } else if (!carnivalIgnoreBombsThisTick) {
    for (var b = 0; b < bombs.length; b++) {
      if (newHead.x === bombs[b].x && newHead.y === bombs[b].y) {
        var bombPenalty = gameMode === 'carnival' ? 5 : 10;
        if (gameMode === 'carnival') bombPenalty = doubleActive ? bombPenalty * 2 : bombPenalty;
        score = score - (gameMode === 'carnival' ? bombPenalty : 10);
        if (score < 0) score = 0;
        var oldPos = { x: bombs[b].x, y: bombs[b].y };
        bombs.splice(b, 1);
        var nextExpiry = gameMode === 'carnival'
          ? BOMB_EXPIRY_MS_CARNIVAL
          : BOMB_EXPIRY_MS_HARD[hardModeNextExpiryIndex % 3];
        if (gameMode === 'carnival') {
          carnivalModeNextExpiryIndex++;
        } else {
          hardModeNextExpiryIndex++;
        }
        spawnOneBombHard(oldPos, nextExpiry);
        ateSomething = true;
        break;
      }
    }
  }
  if (gameMode !== 'easy') {
    for (var s = 0; s < stars.length; s++) {
      if (newHead.x === stars[s].x && newHead.y === stars[s].y) {
        var starBase = 10;
        if (gameMode === 'carnival') { scoreForRainTrigger += starBase; score += doubleActive ? starBase * 2 : starBase; carnivalOnComboEat(carnivalTickNow, true); } else { score += starBase; }
        stars.splice(s, 1);
        ateSomething = true;
        break;
      }
    }
    for (var h = 0; h < hearts.length; h++) {
      if (newHead.x === hearts[h].x && newHead.y === hearts[h].y) {
        var heartPenalty = gameMode === 'carnival' ? 10 : 5;
        var removeCount = Math.min(heartPenalty, snake.length - MIN_SNAKE_LENGTH);
        for (var r = 0; r < removeCount; r++) snake.pop();
        hearts.splice(h, 1);
        ateSomething = true;
        break;
      }
    }
  }

  if (gameMode === 'carnival' && pinkSquare && newHead.x === pinkSquare.x && newHead.y === pinkSquare.y) {
    pinkSquare = null;
    carnivalInvincibilityEndTime = carnivalTickNow + PINK_INVINCIBILITY_MS;
    ateSomething = true;
  }

  for (var pu = 0; pu < purpleSquares.length; pu++) {
    if (purpleSquares[pu].x === newHead.x && purpleSquares[pu].y === newHead.y) {
      carnivalDoubleScoreEndTime = carnivalTickNow + PURPLE_DOUBLE_SCORE_MS;
      purpleSquares.splice(pu, 1);
      ateSomething = true;
      break;
    }
  }

  if (gameMode === 'carnival') {
    for (var z = 0; z < bombZones.length; z++) {
      var zone = bombZones[z];
      if (carnivalTickNow >= zone.endTime) continue;
      if (!carnivalIgnoreBombsThisTick) {
        for (var zb = 0; zb < zone.bombs.length; zb++) {
          if (newHead.x === zone.bombs[zb].x && newHead.y === zone.bombs[zb].y) {
            var zoneBombPenalty = doubleActive ? 10 : 5;
            score -= zoneBombPenalty;
            if (score < 0) score = 0;
            zone.bombs.splice(zb, 1);
            ateSomething = true;
            break;
          }
        }
        for (var oi = 0; oi < zone.outerCells.length; oi++) {
          if (newHead.x === zone.outerCells[oi].x && newHead.y === zone.outerCells[oi].y) {
            var outerPenalty = doubleActive ? 4 : 2;
            score -= outerPenalty;
            if (score < 0) score = 0;
            break;
          }
        }
        for (var ci = 0; ci < zone.coreCells.length; ci++) {
          if (newHead.x === zone.coreCells[ci].x && newHead.y === zone.coreCells[ci].y) {
            var corePenalty = doubleActive ? 8 : 4;
            score -= corePenalty;
            if (score < 0) score = 0;
            break;
          }
        }
      }
      if (zone.star && (carnivalTickNow - zone.star.spawnTime < BOMB_ZONE_CORE_ITEMS_MS) && newHead.x === zone.star.x && newHead.y === zone.star.y) {
        var zoneStarBase = 10;
        scoreForRainTrigger += zoneStarBase;
        score += doubleActive ? zoneStarBase * 2 : zoneStarBase;
        carnivalOnComboEat(carnivalTickNow, false);
        zone.star = null;
        ateSomething = true;
      }
      if (zone.heart && (carnivalTickNow - zone.heart.spawnTime < BOMB_ZONE_CORE_ITEMS_MS) && newHead.x === zone.heart.x && newHead.y === zone.heart.y) {
        var removeCount = Math.min(10, snake.length - MIN_SNAKE_LENGTH);
        for (var rr = 0; rr < removeCount; rr++) snake.pop();
        zone.heart = null;
        ateSomething = true;
      }
      for (var ai = zone.apples.length - 1; ai >= 0; ai--) {
        if (newHead.x === zone.apples[ai].x && newHead.y === zone.apples[ai].y) {
          var zoneAppleBase = 3;
          scoreForRainTrigger += zoneAppleBase;
          score += doubleActive ? zoneAppleBase * 2 : zoneAppleBase;
          carnivalOnComboEat(carnivalTickNow, false);
          if (!carnivalNoLengthGainThisTick) {
            var tail = snake[snake.length - 1];
            snake.push({ x: tail.x, y: tail.y });
            snake.push({ x: tail.x, y: tail.y });
          }
          zone.apples.splice(ai, 1);
          ateSomething = true;
          break;
        }
      }
    }
  }

  if (!ateSomething || carnivalNoLengthGainThisTick) {
    snake.pop();
  }

  if (score !== lastDisplayedScore) {
    scoreDisplay.textContent = score;
    lastDisplayedScore = score;
  }
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;
  }
}

// ========== SELF COLLISION ONLY (wrap-around mode: no wall death) ==========
// If the head is on the same cell as any body segment, the snake hit itself.
// During Carnival Apple Rain or pink invincibility: ignore self-collision (no game over).
function checkCollision() {
  if (gameMode === 'carnival' && carnivalAppleRainActive) return false;
  if (gameMode === 'carnival' && carnivalInvincibilityEndTime > 0 && Date.now() < carnivalInvincibilityEndTime) return false;
  if (sprintInvincibleEndTime > 0 && Date.now() < sprintInvincibleEndTime) return false;
  var head = snake[0];
  for (var i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  return false;
}

// Current speed in ms (decreases every 5 points for faster gameplay)
function getCurrentGameSpeed() {
  var bonus = Math.floor(score / 5) * SPEED_BONUS_MS_PER_5_POINTS;
  var speed = BASE_GAME_SPEED - bonus;
  return speed < MIN_GAME_SPEED ? MIN_GAME_SPEED : speed;
}

// Effective speed: blue = 50% (2x interval), green = 150% (interval/1.5). Sprint = 150% for 2s (or 3s invincible when 3 charges). No cooldown.
// Carnival Apple Rain: 1.5x speed (same as green apple) for the duration of the rain.
// Carnival pink invincibility: ignore slow effect (no slowdown during invincibility).
// Pass optional now (ms) to avoid repeated Date.now() in the same tick.
function getEffectiveSpeed(now) {
  if (now === undefined) now = Date.now();
  var base = getCurrentGameSpeed();
  var effective = base;
  var carnivalInvincible = gameMode === 'carnival' && carnivalInvincibilityEndTime > 0 && now < carnivalInvincibilityEndTime;
  if (slowEffectEndTime && now < slowEffectEndTime && !carnivalInvincible) effective = Math.min(400, base * 2);
  if (fastEffectEndTime && now < fastEffectEndTime) effective = Math.max(50, effective / 1.5);
  if (gameMode === 'carnival' && carnivalAppleRainActive) effective = Math.max(50, effective / 1.5);
  if (sprintEndTime && now >= sprintEndTime) sprintEndTime = null;
  if (sprintInvincibleEndTime && now >= sprintInvincibleEndTime) sprintInvincibleEndTime = 0;
  if (sprintEndTime && now < sprintEndTime) effective = Math.max(50, effective / 1.5);
  if (sprintInvincibleEndTime && now < sprintInvincibleEndTime) effective = Math.max(50, effective / 1.5);
  return effective;
}

function updateSprintCharges(now) {
  var inSprint = (sprintEndTime > 0 && now < sprintEndTime) || (sprintInvincibleEndTime > 0 && now < sprintInvincibleEndTime);
  if (!inSprint && sprintCharges < 3) {
    sprintChargeProgress += (now - lastSprintChargeTime);
    lastSprintChargeTime = now;
    while (sprintChargeProgress >= SPRINT_CHARGE_MS && sprintCharges < 3) {
      sprintChargeProgress -= SPRINT_CHARGE_MS;
      sprintCharges++;
    }
  } else if (inSprint) {
    lastSprintChargeTime = now;
  }
}

// Update sprint charge bar (3 cells). Call each tick with same now as getEffectiveSpeed.
function updateSprintUI(now) {
  var bar = document.getElementById('sprintChargeBar');
  if (!bar) return;
  var i, cell, fill;
  for (i = 0; i < 3; i++) {
    cell = document.getElementById('sprintCharge' + i);
    fill = document.getElementById('sprintChargeFill' + i);
    if (!cell || !fill) continue;
    cell.classList.remove('full', 'ultimate');
    if (i < sprintCharges) {
      cell.classList.add('full');
      fill.style.height = '100%';
    } else if (i === sprintCharges && sprintCharges < 3) {
      var pct = Math.min(100, (sprintChargeProgress / SPRINT_CHARGE_MS) * 100);
      fill.style.height = pct + '%';
    } else {
      fill.style.height = '0%';
    }
  }
  var invActive = sprintInvincibleEndTime > 0 && now < sprintInvincibleEndTime;
  for (i = 0; i < 3; i++) {
    cell = document.getElementById('sprintCharge' + i);
    if (cell && invActive) cell.classList.add('ultimate');
  }
}

// Stop the game, save high score to localStorage, show Game Over message
function gameOver() {
  isGameRunning = false;
  isPaused = false;
  pausedMessage.classList.add('hidden');
  updateSkillReadyNotice();
  if (gameTimeoutId !== null) {
    clearTimeout(gameTimeoutId);
    gameTimeoutId = null;
  }
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;
  }
  try {
    localStorage.setItem('snakeHighScore', String(highScore));
  } catch (e) {}
  finalScoreDisplay.textContent = score;
  gameOverMessage.classList.remove('hidden');
}

// Runs each tick: if paused only redraw; else move, expiration checks, collision, draw, schedule next tick.
// Single timestamp per tick reduces Date.now() calls and improves responsiveness.
function gameLoop() {
  if (!isGameRunning) return;

  var now = Date.now();
  gameTickNow = now;
  sprintInvincibleThisTick = (sprintInvincibleEndTime > 0 && now < sprintInvincibleEndTime);

  if (isPaused) {
    draw(now);
    updateSprintUI(now);
    updateMagnetUI(now);
    updateSkillReadyNotice(now);
    if (gameMode === 'carnival' && carnivalAppleRainActive) updateAppleRainOverlay(now);
    gameTimeoutId = setTimeout(gameLoop, getEffectiveSpeed(now));
    return;
  }

  if (gameMode === 'carnival') {
    updateCarnivalAppleRain(now);
    carnivalIgnoreBombsThisTick = carnivalAppleRainActive || (carnivalInvincibilityEndTime > 0 && now < carnivalInvincibilityEndTime) || sprintInvincibleThisTick;
    carnivalNoLengthGainThisTick = carnivalAppleRainActive;
    carnivalTickNow = now;
    updateCarnivalBombZone(now);
    updateCarnivalPinkSquare(now);
    updateCarnivalPurpleSquares(now);
  } else {
    carnivalIgnoreBombsThisTick = sprintInvincibleThisTick;
    carnivalNoLengthGainThisTick = false;
  }

  updateSprintCharges(now);
  updateMagnetGrant(now);
  updateMagnetUI(now);
  updateSkillReadyNotice(now);

  moveSnake();

  checkAppleExpiration(now);
  if (isExtendedHardMode()) {
    checkBombExpiration(now);
    updateStarHard(now);
  }

  if (checkCollision()) {
    gameOver();
    return;
  }

  draw(now);
  updateSprintUI(now);
  updateMagnetUI(now);
  updateSkillReadyNotice(now);
  if (gameMode === 'carnival' && carnivalAppleRainActive) updateAppleRainOverlay(now);
  gameTimeoutId = setTimeout(gameLoop, getEffectiveSpeed(now));
}

// ========== RESTART LOGIC (continued) ==========
// Clears any existing timeout so "Start Game" restarts cleanly, then inits and starts a new game.
function startGame() {
  if (gameTimeoutId !== null) {
    clearTimeout(gameTimeoutId);
    gameTimeoutId = null;
  }
  isGameRunning = false;
  isPaused = false;

  isGameRunning = true;
  initGame();
  gameTimeoutId = setTimeout(gameLoop, getEffectiveSpeed(Date.now()));
}

// ========== PREVENT REVERSING INTO ITSELF ==========
// Allow Arrow Keys and WASD (W=Up, S=Down, A=Left, D=Right). When both are held, WASD takes priority.
// We only allow a new direction if it isn't the opposite of the current direction.
// Space: single press = sprint (2s), double-tap = pause/resume.

function applyDirectionFromKeys() {
  var wasdDir = null;
  if (keysPressed.has('KeyW')) wasdDir = 'up';
  else if (keysPressed.has('KeyS')) wasdDir = 'down';
  else if (keysPressed.has('KeyA')) wasdDir = 'left';
  else if (keysPressed.has('KeyD')) wasdDir = 'right';

  var arrowDir = null;
  if (keysPressed.has('ArrowUp')) arrowDir = 'up';
  else if (keysPressed.has('ArrowDown')) arrowDir = 'down';
  else if (keysPressed.has('ArrowLeft')) arrowDir = 'left';
  else if (keysPressed.has('ArrowRight')) arrowDir = 'right';

  var desired = wasdDir !== null ? wasdDir : arrowDir;
  if (desired === undefined) return;

  if (desired === 'up' && direction !== 'down') nextDirection = 'up';
  else if (desired === 'down' && direction !== 'up') nextDirection = 'down';
  else if (desired === 'left' && direction !== 'right') nextDirection = 'left';
  else if (desired === 'right' && direction !== 'left') nextDirection = 'right';
}

document.addEventListener('keydown', function(event) {
  if (event.code === 'Enter') {
    event.preventDefault();
    startGame();
    return;
  }
  if (event.code === 'KeyM') {
    event.preventDefault();
    if (isGameRunning && !isPaused && magnetCount >= 1) activateMagnet();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    var now = Date.now();
    if (isGameRunning && lastSpacePressTime > 0 && (now - lastSpacePressTime) < DOUBLE_SPACE_MS) {
      lastSpacePressTime = 0;
      isPaused = !isPaused;
      if (isPaused) {
        pausedMessage.classList.remove('hidden');
      } else {
        pausedMessage.classList.add('hidden');
      }
      return;
    }
    lastSpacePressTime = now;
    if (isGameRunning && !isPaused) {
      if (sprintCharges >= 3) {
        sprintInvincibleEndTime = now + SPRINT_INVINCIBLE_MS;
        sprintCharges = 0;
        sprintChargeProgress = 0;
        lastSprintChargeTime = now;
      } else if (sprintCharges >= 1) {
        sprintEndTime = now + SPRINT_DURATION_MS;
        sprintCharges--;
        lastSprintChargeTime = now;
      }
    }
    return;
  }

  if (!isGameRunning || isPaused) {
    return;
  }

  var isDirectionKey = event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
      event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
      event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD';
  if (isDirectionKey) {
    event.preventDefault();
    keysPressed.add(event.code);
    applyDirectionFromKeys();
  }
});

document.addEventListener('keyup', function(event) {
  var isDirectionKey = event.code === 'ArrowUp' || event.code === 'ArrowDown' ||
      event.code === 'ArrowLeft' || event.code === 'ArrowRight' ||
      event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD';
  if (isDirectionKey) {
    keysPressed.delete(event.code);
    if (isGameRunning && !isPaused) applyDirectionFromKeys();
  }
});

// When Start Game button is clicked, start (or restart) the game
startButton.addEventListener('click', startGame);

// Mode selection: switch between Easy (default), Hard, and Carnival. Refresh board when not running.
easyModeBtn.addEventListener('click', function() {
  if (isGameRunning) return;
  gameMode = 'easy';
  easyModeBtn.classList.add('mode-btn-selected');
  hardModeBtn.classList.remove('mode-btn-selected');
  carnivalModeBtn.classList.remove('mode-btn-selected');
  initGame();
});

hardModeBtn.addEventListener('click', function() {
  if (isGameRunning) return;
  gameMode = 'hard';
  hardModeBtn.classList.add('mode-btn-selected');
  easyModeBtn.classList.remove('mode-btn-selected');
  carnivalModeBtn.classList.remove('mode-btn-selected');
  initGame();
});

carnivalModeBtn.addEventListener('click', function() {
  if (isGameRunning) return;
  gameMode = 'carnival';
  carnivalModeBtn.classList.add('mode-btn-selected');
  easyModeBtn.classList.remove('mode-btn-selected');
  hardModeBtn.classList.remove('mode-btn-selected');
  initGame();
});

function openHandbook() {
  if (handbookOverlay) handbookOverlay.classList.remove('hidden');
}
function closeHandbook() {
  if (handbookOverlay) handbookOverlay.classList.add('hidden');
}

if (handbookBtn) handbookBtn.addEventListener('click', openHandbook);
if (handbookClose) handbookClose.addEventListener('click', closeHandbook);
if (handbookOverlay) {
  handbookOverlay.addEventListener('click', function(e) {
    if (e.target === handbookOverlay) closeHandbook();
  });
}

// Load high score from localStorage on page load
try {
  var saved = localStorage.getItem('snakeHighScore');
  if (saved !== null) {
    highScore = parseInt(saved, 10) || 0;
  }
} catch (e) {}

// Draw the initial state when the page loads (game not running yet)
initGame();
