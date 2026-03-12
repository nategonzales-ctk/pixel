// ── Playdate behavior ──
// Pets visit to play together. Multiple play styles + multi-pet gatherings.
// Play styles: chase, ball, dance
// Gatherings: 2-5 random pets appear for a group hangout

window.BEHAVIOR_REGISTRY = window.BEHAVIOR_REGISTRY || [];

// ── Multi-buddy system ──
// Each buddy: { pet, x, y, targetX, targetY, canvas, ctx, zoneEl }
let _buddies = [];
let _playdateActive = false;
let _playdatePhase = 'none'; // none | entering | playing | leaving
let _playdateTimer = 0;
let _nextPlaydate = 0;
let _playdateStyle = 'chase'; // chase | ball | dance

// ── Ball state (for ball play style) ──
let _ballX = 0, _ballY = 0;
let _ballVX = 0, _ballVY = 0;
let _ballActive = false;
let _ballLastHitter = -1; // index in _buddies (-1 = main pet)
let _ballHitCooldown = 0;

// ── Chase state ──
let _chaseTarget = 0;
let _chaseSwapTime = 0;

// ── Dance state ──
let _danceAngle = 0;
let _danceCenterX = 0, _danceCenterY = 0;

const PLAY_DURATION = 20000;

// ── Mouse intercept state ──
let _mouseInterceptState = 'none'; // none | scatter | gather | freeze
let _mouseInterceptTimer = 0;
let _lastMouseSpeed = 0;
let _prevMouseX = 0, _prevMouseY = 0;
let _mouseNearPlaydate = false;
let _freezeTriggered = false;

const MSGS_ARRIVE_SINGLE = [
  'Oh! A friend came to play! 🥰',
  'Yay! A playmate! 🎉',
  'Hey buddy! Let\'s play! 💜',
  'A visitor! How exciting! ✨',
];
const MSGS_ARRIVE_GROUP = [
  'Wow! Everyone\'s here! 🎉🎉',
  'It\'s a party! All my friends! 🥳',
  'A pet gathering! How fun! ✨✨',
  'The whole gang is here! 💜💜',
];
const MSGS_CHASE = [
  'Wheee! Catch me! 🏃', 'Tag, you\'re it! 😆',
  'Can\'t catch me! 💫', 'This is so fun! 🌟', 'Race you! 🎵',
];
const MSGS_BALL = [
  'Nice shot! 🏐', 'I got it! ⚽', 'Over here! 🏀',
  'Bump! Set! Spike! 🏐', 'Great pass! ⭐', 'Whoa, nice save! 💫',
];
const MSGS_DANCE = [
  'Let\'s dance! 💃', 'Spin spin spin! 🌀', 'Groove time! 🎶',
  'Look at us go! ✨', 'Dancing together! 🎵', 'Whirl~ 💫',
];
const MSGS_SCATTER = [
  'Eek! A giant hand! 😱', 'Scatter!! 🏃💨', 'Whoa! Run! 😲',
  'Aaah! 👀', 'Everyone hide! 💨',
];
const MSGS_GATHER = [
  'Ooh, who\'s this? 👀', 'Wanna play with us? 🥰',
  'A new friend? ✨', 'Come join! 💜', 'Hey there! 😊',
];
const MSGS_FREEZE = [
  '...we weren\'t doing anything! 😅', 'Caught us! 😳',
  '*freeze* 🧊', 'Act natural... 👀', 'Uhh... hi! 😬',
];
const MSGS_LEAVE = [
  'Bye bye friends! See you later! 👋',
  'That was fun! Come back soon! 💜',
  'Aww, leaving already? Bye! 🥺',
  'See ya next time! ✨',
  'Great playing with you all! 🌟',
];

function _pickMsg(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── DOM creation for each buddy ──
function _createBuddyDOM(index) {
  const id = `buddy-zone-${index}`;
  let zone = document.getElementById(id);
  if (!zone) {
    zone = document.createElement('div');
    zone.id = id;
    zone.className = 'buddy-zone';
    document.body.appendChild(zone);

    const wrap = document.createElement('div');
    wrap.className = 'buddy-wrap';
    zone.appendChild(wrap);

    const cvs = document.createElement('canvas');
    cvs.className = 'buddy-canvas';
    cvs.width = 160; cvs.height = 160;
    wrap.appendChild(cvs);

    const shadow = document.createElement('div');
    shadow.className = 'buddy-shadow';
    zone.appendChild(shadow);

    const name = document.createElement('div');
    name.className = 'buddy-name';
    zone.appendChild(name);
  }
  return zone;
}

function _pickBuddyPets(count) {
  const reg = window.PET_REGISTRY || [];
  if (reg.length < 2) return [];
  const others = reg.filter(p => p.id !== currentPetType);
  // Shuffle and take count
  const shuffled = others.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function _pickPlayStyle() {
  const styles = ['chase', 'ball', 'dance'];
  return styles[Math.floor(Math.random() * styles.length)];
}

// ── Start a playdate ──
function _playdateStart() {
  const reg = window.PET_REGISTRY || [];
  if (reg.length < 2) return;

  // Decide how many buddies: weighted random (1 most common, more = rarer)
  const roll = Math.random();
  let buddyCount;
  if (roll < 0.45)      buddyCount = 1;
  else if (roll < 0.72) buddyCount = 2;
  else if (roll < 0.88) buddyCount = 3;
  else if (roll < 0.96) buddyCount = 4;
  else                   buddyCount = Math.min(5, reg.length - 1);

  const pets = _pickBuddyPets(buddyCount);
  if (pets.length === 0) return;

  _playdateStyle = _pickPlayStyle();
  // Ball needs at least 1 buddy, dance looks better with 2+
  if (_playdateStyle === 'dance' && pets.length < 2 && reg.length > 2) {
    _playdateStyle = Math.random() < 0.5 ? 'chase' : 'ball';
  }

  _playdateActive = true;
  _playdatePhase = 'entering';

  const w = Math.min(window.innerWidth, displayW);
  const h = Math.min(window.innerHeight, displayH);

  _buddies = pets.map((pet, i) => {
    const zone = _createBuddyDOM(i);
    zone.style.display = '';
    zone.classList.remove('buddy-leaving');
    zone.classList.add('buddy-entering');

    // Name tag
    const nameEl = zone.querySelector('.buddy-name');
    if (nameEl) {
      nameEl.textContent = '✦ ' + pet.name.toUpperCase() + ' ✦';
      nameEl.style.color = pet.accentColor;
      nameEl.style.textShadow = '0 0 8px ' + pet.accentColor;
    }

    // Enter from random edges
    const edge = Math.floor(Math.random() * 4);
    let sx, sy;
    switch (edge) {
      case 0: sx = -180 - i * 60; sy = 120 + Math.random() * (h - PET_H - 180); break;
      case 1: sx = w + 20 + i * 60; sy = 120 + Math.random() * (h - PET_H - 180); break;
      case 2: sx = 80 + Math.random() * (w - PET_W - 160); sy = -200 - i * 60; break;
      case 3: sx = 80 + Math.random() * (w - PET_W - 160); sy = h + 20 + i * 60; break;
    }

    // Spread targets around the main pet
    const angle = (i / pets.length) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 160 + Math.random() * 60;
    let tx = petX + Math.cos(angle) * dist;
    let ty = petY + Math.sin(angle) * dist;
    tx = Math.max(30, Math.min(w - PET_W - 30, tx));
    ty = Math.max(100, Math.min(h - PET_H - 30, ty));

    const cvs = zone.querySelector('.buddy-canvas');
    return {
      pet, x: sx, y: sy, targetX: tx, targetY: ty,
      canvas: cvs, ctx: cvs.getContext('2d'), zoneEl: zone,
    };
  });

  _playdateTimer = Date.now() + 3500;

  // Arrival message
  const msgs = _buddies.length > 1 ? MSGS_ARRIVE_GROUP : MSGS_ARRIVE_SINGLE;
  showBubble(_pickMsg(msgs), 4000, true);
  setMood('excited', 4000);
}

// ── Start playing phase ──
function _playdateStartPlaying() {
  _playdatePhase = 'playing';
  _playdateTimer = Date.now() + PLAY_DURATION;

  const w = Math.min(window.innerWidth, displayW);
  const h = Math.min(window.innerHeight, displayH);

  if (_playdateStyle === 'chase') {
    _chaseTarget = 0;
    _chaseSwapTime = Date.now() + 3000;
    petIsRunning = true;
    behaviorMood = 'excited';
    petSpeedMult = 2.5;
    pickRunTarget();

  } else if (_playdateStyle === 'ball') {
    // Spawn ball in the center between pets
    _ballX = (petX + (_buddies[0]?.x || petX)) / 2 + PET_W / 2;
    _ballY = (petY + (_buddies[0]?.y || petY)) / 2 + PET_H / 2;
    _ballVX = (Math.random() - 0.5) * 8;
    _ballVY = -5 - Math.random() * 3;
    _ballActive = true;
    _ballLastHitter = -1;
    _ballHitCooldown = 0;
    petIsRunning = true;
    behaviorMood = 'excited';
    petSpeedMult = 2;

  } else if (_playdateStyle === 'dance') {
    _danceAngle = 0;
    _danceCenterX = w / 2;
    _danceCenterY = h / 2;
    behaviorMood = 'happy';
    petSpeedMult = 1.5;
  }
}

// ── Update chase play ──
function _updateChasePlay(now, w, h) {
  if (now >= _chaseSwapTime) {
    _chaseTarget = (_chaseTarget + 1) % (_buddies.length + 1);
    _chaseSwapTime = now + 2500 + Math.random() * 2000;
    if (Math.random() < 0.35) showBubble(_pickMsg(MSGS_CHASE), 2500, true);
  }

  if (_chaseTarget === 0) {
    // Buddies chase main pet
    _buddies.forEach(b => {
      b.targetX = petX + (Math.random() - 0.5) * 80;
      b.targetY = petY + (Math.random() - 0.5) * 80;
    });
    if (!petIsRunning) {
      petIsRunning = true; behaviorMood = 'excited'; petSpeedMult = 2.5;
    }
    const pdx = petTargetX - petX, pdy = petTargetY - petY;
    if (Math.sqrt(pdx * pdx + pdy * pdy) < 80) pickRunTarget();
  } else {
    // Main pet chases a specific buddy
    const target = _buddies[(_chaseTarget - 1) % _buddies.length];
    petTargetX = target.x;
    petTargetY = target.y;
    petIsRunning = true; behaviorMood = 'excited'; petSpeedMult = 2.5;

    // Target buddy runs away, others wander
    _buddies.forEach((b, i) => {
      if (i === (_chaseTarget - 1) % _buddies.length) {
        const angle = Math.atan2(b.y - petY, b.x - petX);
        b.targetX = b.x + Math.cos(angle) * (180 + Math.random() * 120);
        b.targetY = b.y + Math.sin(angle) * (180 + Math.random() * 120);
      } else {
        // Others wander nearby
        if (Math.random() < 0.02) {
          b.targetX = b.x + (Math.random() - 0.5) * 200;
          b.targetY = b.y + (Math.random() - 0.5) * 200;
        }
      }
      b.targetX = Math.max(30, Math.min(w - PET_W - 30, b.targetX));
      b.targetY = Math.max(100, Math.min(h - PET_H - 30, b.targetY));
    });
  }
}

// ── Update ball play ──
function _updateBallPlay(now, w, h) {
  // Ball physics
  _ballVY += 0.15; // gravity
  _ballX += _ballVX;
  _ballY += _ballVY;

  // Bounce off walls
  if (_ballX < 20) { _ballX = 20; _ballVX = Math.abs(_ballVX) * 0.8; }
  if (_ballX > w - 20) { _ballX = w - 20; _ballVX = -Math.abs(_ballVX) * 0.8; }
  // Floor bounce
  if (_ballY > h - 60) {
    _ballY = h - 60;
    _ballVY = -Math.abs(_ballVY) * 0.7;
    if (Math.abs(_ballVY) < 1) _ballVY = -4; // keep it alive
  }
  // Ceiling
  if (_ballY < 40) { _ballY = 40; _ballVY = Math.abs(_ballVY) * 0.5; }

  // All participants: find who's closest and should hit
  const allPets = [
    { x: petX + PET_W / 2, y: petY + PET_H / 2, idx: -1 },
    ..._buddies.map((b, i) => ({ x: b.x + PET_W / 2, y: b.y + PET_H / 2, idx: i })),
  ];

  // Move pets toward ball
  const ballTarget = { x: _ballX - PET_W / 2, y: _ballY - PET_H / 2 + 40 };

  // Find closest pet to ball
  let closestDist = Infinity, closestIdx = -1;
  allPets.forEach(p => {
    const dx = _ballX - p.x, dy = _ballY - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < closestDist) { closestDist = d; closestIdx = p.idx; }
  });

  // Direct the closest pet toward ball, others space out
  if (closestIdx === -1) {
    // Main pet goes for ball
    petTargetX = ballTarget.x;
    petTargetY = ballTarget.y;
    petIsRunning = true; petSpeedMult = 2;
  } else {
    // A buddy goes for ball — others spread out on the "court"
    if (Math.random() < 0.03) {
      petTargetX = w / 2 + (Math.random() - 0.5) * 300;
      petTargetY = h / 2 + (Math.random() - 0.5) * 200;
    }
    petIsRunning = true; petSpeedMult = 1.5;
  }

  _buddies.forEach((b, i) => {
    if (i === closestIdx) {
      b.targetX = ballTarget.x;
      b.targetY = ballTarget.y;
    } else {
      // Position on their side
      if (Math.random() < 0.03) {
        b.targetX = b.x + (Math.random() - 0.5) * 250;
        b.targetY = b.y + (Math.random() - 0.5) * 150;
      }
    }
    b.targetX = Math.max(30, Math.min(w - PET_W - 30, b.targetX));
    b.targetY = Math.max(100, Math.min(h - PET_H - 30, b.targetY));
  });

  // Hit detection — pet bumps the ball
  if (now > _ballHitCooldown) {
    allPets.forEach(p => {
      const dx = _ballX - p.x, dy = _ballY - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90 && p.idx !== _ballLastHitter) {
        // Hit! Launch ball toward a random other pet
        const others = allPets.filter(o => o.idx !== p.idx);
        const target = others[Math.floor(Math.random() * others.length)];
        const tAngle = Math.atan2(target.y - _ballY, target.x - _ballX);
        const power = 6 + Math.random() * 4;
        _ballVX = Math.cos(tAngle) * power;
        _ballVY = Math.sin(tAngle) * power - 4;
        _ballLastHitter = p.idx;
        _ballHitCooldown = now + 600;
        if (Math.random() < 0.3) showBubble(_pickMsg(MSGS_BALL), 2000, true);
      }
    });
  }
}

// ── Update dance play ──
function _updateDancePlay(now, w, h) {
  _danceAngle += 0.018;
  const totalPets = _buddies.length + 1;
  const radius = 100 + totalPets * 25;

  // Main pet position in the circle
  const mainAngle = _danceAngle;
  petTargetX = _danceCenterX + Math.cos(mainAngle) * radius - PET_W / 2;
  petTargetY = _danceCenterY + Math.sin(mainAngle) * radius - PET_H / 2;
  petTargetX = Math.max(30, Math.min(w - PET_W - 30, petTargetX));
  petTargetY = Math.max(100, Math.min(h - PET_H - 30, petTargetY));
  petSpeedMult = 1.5;
  behaviorMood = 'happy';

  // Buddies in circle
  _buddies.forEach((b, i) => {
    const bAngle = _danceAngle + ((i + 1) / totalPets) * Math.PI * 2;
    b.targetX = _danceCenterX + Math.cos(bAngle) * radius - PET_W / 2;
    b.targetY = _danceCenterY + Math.sin(bAngle) * radius - PET_H / 2;
    b.targetX = Math.max(30, Math.min(w - PET_W - 30, b.targetX));
    b.targetY = Math.max(100, Math.min(h - PET_H - 30, b.targetY));
  });

  // Periodic pulse — shrink and expand the circle
  const pulse = Math.sin(now / 800) * 20;
  _buddies.forEach(b => {
    b.targetX += (b.targetX - _danceCenterX) * pulse / radius * 0.3;
    b.targetY += (b.targetY - _danceCenterY) * pulse / radius * 0.3;
  });

  if (Math.random() < 0.005) showBubble(_pickMsg(MSGS_DANCE), 2500, true);
}

// ── Mouse intercept detection ──
function _isMouseNearPets() {
  const mx = mouseX, my = mouseY;
  const threshold = 150;
  // Check near main pet
  const dx0 = mx - (petX + PET_W / 2), dy0 = my - (petY + PET_H / 2);
  if (Math.sqrt(dx0 * dx0 + dy0 * dy0) < threshold) return true;
  // Check near buddies
  for (const b of _buddies) {
    const dx = mx - (b.x + PET_W / 2), dy = my - (b.y + PET_H / 2);
    if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
  }
  return false;
}

function _updateMouseIntercept(now, w, h) {
  if (_playdatePhase !== 'playing') {
    _mouseInterceptState = 'none';
    return;
  }

  // Track mouse speed
  const mdx = mouseX - _prevMouseX, mdy = mouseY - _prevMouseY;
  _lastMouseSpeed = Math.sqrt(mdx * mdx + mdy * mdy);
  _prevMouseX = mouseX; _prevMouseY = mouseY;

  const nearPets = _isMouseNearPets();
  const wasNear = _mouseNearPlaydate;
  _mouseNearPlaydate = nearPets;

  // If in a reaction state, wait for timer
  if (_mouseInterceptState !== 'none' && now < _mouseInterceptTimer) {
    if (_mouseInterceptState === 'scatter') {
      // Pets flee from mouse
      _buddies.forEach(b => {
        const angle = Math.atan2(b.y + PET_H / 2 - mouseY, b.x + PET_W / 2 - mouseX);
        b.targetX = b.x + Math.cos(angle) * 300;
        b.targetY = b.y + Math.sin(angle) * 300;
        b.targetX = Math.max(30, Math.min(w - PET_W - 30, b.targetX));
        b.targetY = Math.max(100, Math.min(h - PET_H - 30, b.targetY));
      });
      // Main pet also flees
      const pa = Math.atan2(petY + PET_H / 2 - mouseY, petX + PET_W / 2 - mouseX);
      petTargetX = Math.max(30, Math.min(w - PET_W - 30, petX + Math.cos(pa) * 300));
      petTargetY = Math.max(100, Math.min(h - PET_H - 30, petY + Math.sin(pa) * 300));
      petSpeedMult = 4;
      behaviorMood = 'scared';
    } else if (_mouseInterceptState === 'gather') {
      // Pets gather around cursor
      const total = _buddies.length + 1;
      _buddies.forEach((b, i) => {
        const angle = ((i + 1) / total) * Math.PI * 2 + now * 0.001;
        b.targetX = mouseX + Math.cos(angle) * 120 - PET_W / 2;
        b.targetY = mouseY + Math.sin(angle) * 120 - PET_H / 2;
        b.targetX = Math.max(30, Math.min(w - PET_W - 30, b.targetX));
        b.targetY = Math.max(100, Math.min(h - PET_H - 30, b.targetY));
      });
      const mainAngle = (0 / total) * Math.PI * 2 + now * 0.001;
      petTargetX = Math.max(30, Math.min(w - PET_W - 30, mouseX + Math.cos(mainAngle) * 120 - PET_W / 2));
      petTargetY = Math.max(100, Math.min(h - PET_H - 30, mouseY + Math.sin(mainAngle) * 120 - PET_H / 2));
      petSpeedMult = 1.5;
      behaviorMood = 'love';
    } else if (_mouseInterceptState === 'freeze') {
      // Everyone stops moving — targets = current position
      _buddies.forEach(b => { b.targetX = b.x; b.targetY = b.y; });
      petTargetX = petX; petTargetY = petY;
      petSpeedMult = 0.5;
      behaviorMood = 'surprised';
    }
    return; // Skip normal play logic
  }

  // Reset after reaction ends
  if (_mouseInterceptState !== 'none' && now >= _mouseInterceptTimer) {
    _mouseInterceptState = 'none';
    _freezeTriggered = false;
    behaviorMood = 'excited';
    petSpeedMult = 2;
    // Extend play time a bit to compensate for interruption
    _playdateTimer = Math.max(_playdateTimer, now + 5000);
    return;
  }

  // Detect new intercepts
  if (nearPets && !wasNear) {
    if (_lastMouseSpeed > 25) {
      // Fast mouse = scatter!
      _mouseInterceptState = 'scatter';
      _mouseInterceptTimer = now + 2500;
      showBubble(_pickMsg(MSGS_SCATTER), 2500, true);
      setMood('scared', 2500);
      petIsRunning = true;
    } else {
      // Slow approach = gather curiously
      _mouseInterceptState = 'gather';
      _mouseInterceptTimer = now + 4000;
      showBubble(_pickMsg(MSGS_GATHER), 3500, true);
      setMood('love', 4000);
    }
  }
}

// ── Click during playdate = freeze ──
document.addEventListener('click', () => {
  if (!_playdateActive || _playdatePhase !== 'playing') return;
  if (_mouseInterceptState === 'freeze') return;
  if (!_isMouseNearPets()) return;
  _mouseInterceptState = 'freeze';
  _mouseInterceptTimer = Date.now() + 2000;
  _freezeTriggered = true;
  showBubble(_pickMsg(MSGS_FREEZE), 2500, true);
  setMood('surprised', 2500);
  petIsRunning = false;
});

// ── Start leaving ──
function _playdateStartLeaving() {
  _playdatePhase = 'leaving';
  _ballActive = false;
  _playdateTimer = Date.now() + 4000;

  const w = Math.min(window.innerWidth, displayW);
  const h = Math.min(window.innerHeight, displayH);

  _buddies.forEach((b, i) => {
    b.zoneEl.classList.remove('buddy-entering');
    b.zoneEl.classList.add('buddy-leaving');
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: b.targetX = -200 - i * 50; b.targetY = b.y; break;
      case 1: b.targetX = w + 50 + i * 50; b.targetY = b.y; break;
      case 2: b.targetX = b.x; b.targetY = -250 - i * 50; break;
      case 3: b.targetX = b.x; b.targetY = h + 50 + i * 50; break;
    }
  });

  petIsRunning = false;
  petSpeedMult = 1;
  behaviorMood = null;

  showBubble(_pickMsg(MSGS_LEAVE), 5000, true);
  setMood('love', 4000);
}

// ── End playdate ──
function _playdateEnd() {
  _playdatePhase = 'none';
  _playdateActive = false;
  _ballActive = false;
  _buddies.forEach(b => { b.zoneEl.style.display = 'none'; });
  _buddies = [];
  const interval = (bhvCfg.playdateInterval || 10) * 60000;
  _nextPlaydate = Date.now() + interval;
}

// ── Main movement update ──
function _playdateUpdateMovement() {
  if (!_playdateActive) return;

  const now = Date.now();
  const w = Math.min(window.innerWidth, displayW);
  const h = Math.min(window.innerHeight, displayH);

  if (_playdatePhase === 'entering') {
    _buddies.forEach(b => {
      b.x += (b.targetX - b.x) * 0.04;
      b.y += (b.targetY - b.y) * 0.04;
    });
    if (now >= _playdateTimer) _playdateStartPlaying();

  } else if (_playdatePhase === 'playing') {
    // Check mouse intercept first — it can override play logic
    _updateMouseIntercept(now, w, h);

    if (_mouseInterceptState === 'none') {
      // Normal play logic
      if (_playdateStyle === 'chase')  _updateChasePlay(now, w, h);
      else if (_playdateStyle === 'ball')   _updateBallPlay(now, w, h);
      else if (_playdateStyle === 'dance')  _updateDancePlay(now, w, h);
    }

    // Move all buddies toward their targets
    const speed = _mouseInterceptState === 'freeze' ? 0.01
      : _mouseInterceptState === 'scatter' ? 0.1
      : _playdateStyle === 'dance' ? 0.04 : 0.06;
    _buddies.forEach(b => {
      b.x += (b.targetX - b.x) * speed;
      b.y += (b.targetY - b.y) * speed;
    });

    if (now >= _playdateTimer && _mouseInterceptState === 'none') _playdateStartLeaving();

  } else if (_playdatePhase === 'leaving') {
    _buddies.forEach(b => {
      b.x += (b.targetX - b.x) * 0.05;
      b.y += (b.targetY - b.y) * 0.05;
    });
    if (now >= _playdateTimer) _playdateEnd();
  }

  // Clamp during non-leaving phases
  if (_playdatePhase !== 'leaving') {
    _buddies.forEach(b => {
      b.x = Math.max(10, Math.min(w - PET_W - 10, b.x));
      b.y = Math.max(100, Math.min(h - PET_H - 10, b.y));
    });
  }

  // Update DOM positions
  _buddies.forEach(b => {
    b.zoneEl.style.transform = `translate(${Math.round(b.x)}px,${Math.round(b.y)}px)`;
  });
}

// ── Draw all buddy canvases ──
function _buddyDraw(ts) {
  if (!_playdateActive) return;
  let mood = 'happy';
  if (_playdatePhase === 'playing') {
    if (_mouseInterceptState === 'scatter') mood = 'scared';
    else if (_mouseInterceptState === 'gather') mood = 'love';
    else if (_mouseInterceptState === 'freeze') mood = 'surprised';
    else mood = _playdateStyle === 'dance' ? 'happy' : 'excited';
  }
  _buddies.forEach(b => {
    if (b.ctx) b.pet.draw(b.ctx, ts, mood);
  });
}

// ── Draw ball on particle canvas ──
function _drawPlayBall() {
  if (!_ballActive) return;
  const cvs = document.getElementById('particle-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');

  const x = _ballX, y = _ballY, r = 16;

  // Ball shadow
  ctx.beginPath();
  ctx.ellipse(x, y + r + 10, r * 0.8, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // Ball body
  const g = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, r);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.4, '#ffe066');
  g.addColorStop(1, '#ffaa00');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // Ball shine
  ctx.beginPath();
  ctx.arc(x - 4, y - 5, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();

  // Ball stripes (volleyball look)
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(200,120,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Curved line
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y - r * 0.7);
  ctx.quadraticCurveTo(x, y + r * 0.3, x + r * 0.7, y - r * 0.7);
  ctx.strokeStyle = 'rgba(200,120,0,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ball glow
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  const glow = ctx.createRadialGradient(x, y, r, x, y, r + 6);
  glow.addColorStop(0, 'rgba(255,200,50,0.2)');
  glow.addColorStop(1, 'rgba(255,200,50,0)');
  ctx.fillStyle = glow;
  ctx.fill();
}

// ── Backward compat: keep old variable names working ──
// (config.js references _buddyActive)
Object.defineProperty(window, '_buddyActive', {
  get() { return _playdateActive; },
  set(v) { _playdateActive = v; },
});

// ── Behavior registry entry ──
window.BEHAVIOR_REGISTRY.push({
  id: 'playdate',
  update: function (now) {
    if (!bhvCfg.playdateOn) return;
    if (petIsAsleep || petIsHiding) return;
    if (!_playdateActive && (typeof _followActive !== 'undefined' && _followActive)) return;

    if (_playdateActive) {
      _playdateUpdateMovement();
    } else if (now >= _nextPlaydate && _nextPlaydate > 0) {
      _playdateStart();
    }
  },
});
