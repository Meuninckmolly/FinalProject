/* ---------------------------------------------------------------
   DAYDREAM DRIFT: an interactive p5.js poster

   Built from the class toolkit
   - UI:        createSlider(), createColorPicker(), createButton(), each read with .value()
   - Structure: loops, push(), pop(), translate(), rotate(), and % (wrap-around, alternating, every Nth)
   - Shapes:    rect(), ellipse(), line(), arc(), bezier(), with fill(), stroke(), strokeWeight()
   - Export:    saveCanvas() from the Save button or the S key
   - Restart:   mousePressed() on the poster starts a new drawing

   noise() is used where things should feel smooth and natural:
   drifting clouds, flowing ribbons, the breathing of the ring.
   random() is used where things should feel jumpy: sparkle flicker and film grain.

   Soft glow without blur: stacks of large, nearly transparent ellipses.
   No text() on purpose. The poster is all drawing.

   Controls, in order
   colors:  sky, haze, ring colour A, ring colour B
   sliders: flow speed, clouds, ribbons, ring size
   buttons: New drawing, Pause, Save PNG
---------------------------------------------------------------- */

const W = 900, H = 1200;
const LAT = 40;                         // latitude for the daylight data
const INK = '#2f2050';
const PAPER = '#fffaf2';

let skyPick, hazePick, ringPickA, ringPickB;
let speedSlider, cloudSlider, ribbonSlider, ringSlider;
let newBtn, pauseBtn, saveBtn;

let seed = 1108;
let t = 0;                              // animation time in seconds
let days = [];                          // one entry per day: { n, hours, delta }
let hMin = 0, hMax = 1;
let blobs = [], ribbons = [], bokehs = [], stars = [], sprites = [];

/* ---------- setup ---------- */

function setup() {
  pixelDensity(1);
  const cnv = createCanvas(W, H);
  if (document.getElementById('stage')) cnv.parent('stage');
  frameRate(30);
  buildDays();
  makeControls();
  newDrawing(1108);
}

// If a slot with this id exists on the page the control is placed there;
// otherwise p5 puts it under the canvas.
function place(el, id, slot) {
  el.id(id);
  if (document.getElementById(slot)) el.parent(slot);
}

function refresh() {
  if (!isLooping()) redraw();            // keep controls live while paused
}

function makeControls() {
  skyPick = createColorPicker('#ffcdb8');
  hazePick = createColorPicker('#b9a6f2');
  ringPickA = createColorPicker('#ff6f91');
  ringPickB = createColorPicker('#ffc233');
  place(skyPick, 'ctl-sky', 'slot-sky');
  place(hazePick, 'ctl-haze', 'slot-haze');
  place(ringPickA, 'ctl-ringA', 'slot-ringA');
  place(ringPickB, 'ctl-ringB', 'slot-ringB');

  speedSlider = createSlider(0, 3, 1, 0.05);
  cloudSlider = createSlider(4, 40, 18, 1);
  ribbonSlider = createSlider(20, 160, 80, 1);
  ringSlider = createSlider(0.6, 1.25, 1, 0.01);
  place(speedSlider, 'ctl-speed', 'slot-speed');
  place(cloudSlider, 'ctl-clouds', 'slot-clouds');
  place(ribbonSlider, 'ctl-ribbons', 'slot-ribbons');
  place(ringSlider, 'ctl-ringsize', 'slot-ringsize');

  [skyPick, hazePick, ringPickA, ringPickB, speedSlider, cloudSlider, ribbonSlider, ringSlider]
    .forEach(c => c.input(refresh));

  newBtn = createButton('New drawing');
  pauseBtn = createButton('Pause');
  saveBtn = createButton('Save PNG');
  place(newBtn, 'btn-new', 'slot-buttons');
  place(pauseBtn, 'btn-pause', 'slot-buttons');
  place(saveBtn, 'btn-save', 'slot-buttons');
  newBtn.mousePressed(() => newDrawing());
  pauseBtn.mousePressed(togglePause);
  saveBtn.mousePressed(savePoster);
}

function togglePause() {
  if (isLooping()) { noLoop(); pauseBtn.html('Play'); }
  else { loop(); pauseBtn.html('Pause'); }
}

function savePoster() {
  saveCanvas('daydream-drift', 'png');
}

/* ---------- interaction ---------- */

// Click the poster for a new drawing. Clicks on the controls are ignored.
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) newDrawing();
}

// Press S to save.
function keyPressed() {
  if (key === 's' || key === 'S') savePoster();
}

/* ---------- data: hours of daylight for every day of the year ---------- */

function buildDays() {
  days = [];
  for (let n = 1; n <= 365; n++) {
    const decl = radians(-23.44) * cos((TAU / 365) * (n + 10));   // solar declination
    const x = -tan(radians(LAT)) * tan(decl);
    days.push({ n, hours: (24 / PI) * acos(constrain(x, -1, 1)) });
  }
  for (let i = 0; i < days.length; i++) {
    const next = days[(i + 1) % days.length].hours;               // % wraps Dec 31 back to Jan 1
    days[i].delta = (next - days[i].hours) * 60;                  // minutes gained or lost tomorrow
  }
  hMin = days[0].hours; hMax = days[0].hours;
  for (let i = 0; i < days.length; i++) {
    hMin = min(hMin, days[i].hours);
    hMax = max(hMax, days[i].hours);
  }
}

/* ---------- everything that depends on the seed ---------- */

function newDrawing(forced) {
  seed = forced || ((floor(millis()) + frameCount * 7) % 9000) + 1;
  randomSeed(seed);
  noiseSeed(seed);

  blobs = [];
  for (let i = 0; i < 40; i++) {
    blobs.push({
      x: random(-100, W + 100), y: random(-100, H + 100),
      r: random(150, 380), a: random(6, 12), ph: random(TAU)
    });
  }

  ribbons = [];
  for (let i = 0; i < 160; i++) {
    ribbons.push({
      x: random(-60, W + 60), y: random(-60, H + 60),
      len: random(30, 80), w: random(0.8, 2.6),
      speed: random(0.04, 0.12), ph: random(),
      seed: random() < 0.32, sr: random(1.6, 4.6)
    });
  }

  bokehs = [];
  for (let i = 0; i < 44; i++) {
    const depth = floor(random(3));                               // 0 far, 1 middle, 2 near
    bokehs.push({
      depth,
      x: random(W), y: random(H),
      r: [random(8, 22), random(18, 42), random(44, 95)][depth],
      v: [6, 12, 22][depth],                                      // nearer circles drift faster
      soft: [0.15, 0.45, 0.9][depth],                             // nearer circles are blurrier
      a: [random(34, 50), random(20, 32), random(10, 16)][depth],
      ph: random(TAU)
    });
  }

  stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: random(40, W - 40), y: random(H), r: random(6, 16), v: random(5, 14),
      f: random(0.5, 1.4), ph: random(TAU), rot: random(TAU),
      c: random() < 0.7 ? PAPER : '#ffe27a'
    });
  }

  sprites = [];
  for (let i = 0; i < 6; i++) {
    sprites.push({ rr: random(30, 95), sp: random(0.2, 0.6) * (random() < 0.5 ? -1 : 1), ph: random(TAU), r: random(16, 34) });
  }

  if (!isLooping()) redraw();
}

/* ---------- draw ---------- */

function draw() {
  t += speedSlider.value() * min(deltaTime, 50) / 1000;

  // read the controls once per frame
  const col = {
    sky: skyPick.value(),
    haze: hazePick.value(),
    a: ringPickA.value(),
    b: ringPickB.value()
  };

  drawSky(col);
  drawHaze(col);
  drawRibbons(col);
  drawBokeh(0, col);
  drawBokeh(1, col);
  drawRing(col);
  drawBokeh(2, col);
  drawStars();
  drawGrain();
}

// Sky colour, then a stack of bands that fade in the haze colour toward the bottom.
function drawSky(col) {
  background(col.sky);
  noStroke();
  const bands = 32, bh = H / bands;
  for (let i = 0; i < bands; i++) {
    fill(col.haze, map(i, 0, bands - 1, 0, 190));
    rect(0, i * bh, W, bh + 1);
  }
}

// Clouds: each one is a stack of 10 nearly transparent ellipses, so the edge fades out softly.
function drawHaze(col) {
  const n = cloudSlider.value();
  noStroke();
  for (let i = 0; i < n; i++) {
    const b = blobs[i];
    const x = b.x + (noise(i * 7.1, t * 0.06) - 0.5) * 320;       // noise: smooth drifting
    const y = b.y + (noise(i * 3.3 + 50, t * 0.06) - 0.5) * 320;
    const r = b.r * (0.92 + 0.14 * sin(t * 0.35 + b.ph));
    const c = [col.haze, col.haze, '#ffffff', col.a][i % 4];       // % picks the cloud colour
    const a = i % 4 === 3 ? b.a * 0.5 : b.a;
    for (let k = 0; k < 10; k++) {
      const d = 2 * r * (1 - k / 10);
      fill(c, a);
      ellipse(x, y, d, d);
    }
  }
}

// Ribbons: 7 points walk through a flow field, joined by bezier() curves. Drawn twice, wide and faint then thin and bright.
function drawRibbons(col) {
  const n = ribbonSlider.value();
  const z = 7.3 + t * 0.06;                                       // the field evolves, so every ribbon morphs
  noFill();
  for (let i = 0; i < n; i++) {
    const r = ribbons[i];
    const c = [PAPER, col.haze, PAPER, col.b, col.haze][i % 5];

    const pts = [];
    let x = r.x, y = r.y;
    for (let k = 0; k <= 6; k++) {
      const a = noise(x * 0.0021, y * 0.0021, z) * TAU * 2.2;
      pts.push({ x, y, dx: cos(a), dy: sin(a) });
      x += cos(a) * r.len;
      y += sin(a) * r.len;
    }

    stroke(c, 22);
    strokeWeight(r.w * 4.5);
    ribbonCurve(pts, r.len);
    stroke(c, 95);
    strokeWeight(r.w);
    ribbonCurve(pts, r.len);

    noStroke();
    if (i % 4 === 0) {                                            // a bead of light travels along every 4th ribbon
      const u = ((t * r.speed + r.ph) % 1) * 6;
      const j = min(floor(u), 5);
      const bx = lerp(pts[j].x, pts[j + 1].x, u - j);
      const by = lerp(pts[j].y, pts[j + 1].y, u - j);
      fill(PAPER, 45); ellipse(bx, by, 24, 24);
      fill(PAPER, 100); ellipse(bx, by, 12, 12);
      fill(PAPER, 235); ellipse(bx, by, 5, 5);
    }
    if (r.seed) {                                                 // a seed rides the end of the ribbon
      fill(PAPER, 215);
      ellipse(pts[6].x, pts[6].y, r.sr * 2, r.sr * 2);
    }
  }
}

function ribbonCurve(pts, len) {
  for (let k = 0; k < 6; k++) {
    const p = pts[k], q = pts[k + 1];
    bezier(p.x, p.y,
           p.x + p.dx * len * 0.4, p.y + p.dy * len * 0.4,
           q.x - q.dx * len * 0.4, q.y - q.dy * len * 0.4,
           q.x, q.y);
  }
}

// Bokeh in three depths. Far discs have a crisp rim (2 layers), near ones are defocused (9 layers).
function drawBokeh(depth, col) {
  const span = H + 200;
  const layers = [2, 5, 9][depth];
  for (let i = 0; i < bokehs.length; i++) {
    const b = bokehs[i];
    if (b.depth !== depth) continue;
    const x = b.x + sin(t * 0.25 + b.ph) * 22 * (depth + 1);
    const y = ((((b.y - t * b.v) % span) + span) % span) - 100;   // rise slowly, wrap with %
    const rr = b.r * (0.88 + 0.12 * sin(t * 0.8 + b.ph));
    const c = i % 2 === 0 ? PAPER : col.haze;
    noStroke();
    for (let k = 0; k < layers; k++) {
      const d = 2 * rr * (1 - (k * b.soft) / layers);
      fill(c, b.a);
      ellipse(x, y, d, d);
    }
    if (depth < 2) {
      noFill();
      stroke(PAPER, 80);
      strokeWeight(1);
      ellipse(x, y, 2 * rr, 2 * rr);
    }
  }
}

// Data art: 365 spokes, one per day. Spoke length = hours of daylight.
function drawRing(col) {
  const sc = ringSlider.value();
  const cx = W / 2, cy = 718;
  const R0 = 128 * sc, R1 = 262 * sc, RS = 292 * sc;
  const pulse = 1 + 0.07 * sin(t * 0.9);

  // sun glow: stacked ellipses
  noStroke();
  for (let k = 0; k < 14; k++) {
    const d = 2 * 200 * sc * pulse * (1 - k / 14);
    fill('#fff3c4', 16);
    ellipse(cx, cy, d, d);
  }

  // base ring, then a 12-hour ring made of tiny arcs that crawl around
  noFill();
  stroke(PAPER, 215);
  strokeWeight(1.2);
  ellipse(cx, cy, 2 * R0, 2 * R0);
  const r12 = map(12, hMin, hMax, R0 + 6 * sc, R1);
  stroke(INK, 140);
  strokeWeight(1.4);
  for (let i = 0; i < 90; i++) {
    const a0 = i * (TAU / 90) + t * 0.1;
    arc(cx, cy, 2 * r12, 2 * r12, a0, a0 + 0.018);
  }

  // the ring itself: translate to the centre, rotate a little more for every day
  push();
  translate(cx, cy);
  rotate(t * 0.035 - HALF_PI);                                    // Jan 1 starts at the top; the ring turns slowly
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const wave = 1 + 0.035 * sin(t * 1.2 - d.n * 0.07);           // a wave of breathing runs around the ring
    const r = map(d.hours, hMin, hMax, R0 + 6 * sc, R1) * wave;
    const c = d.n % 2 === 0 ? col.a : col.b;                      // % alternates the two ring colours

    stroke(c, 215);
    strokeWeight(1.7);
    line(R0, 0, r, 0);

    noStroke();
    const week = d.n % 7 === 1;                                   // every 7th day gets a bigger orb
    const size = ((week ? 5.5 : 2.4) + map(d.hours, hMin, hMax, 0, week ? 4 : 1.6)) * (1 + 0.18 * sin(t * 2.2 + d.n * 0.35));
    fill(c, week ? 34 : 22);  ellipse(r, 0, size * 6, size * 6);
    fill(c, week ? 60 : 40);  ellipse(r, 0, size * 3.4, size * 3.4);
    fill(c);                  ellipse(r, 0, size * 2.2, size * 2.2);
    if (week) {
      fill(PAPER, 230);
      ellipse(r - size * 0.35, -size * 0.35, size * 0.9, size * 0.9);
    }

    // outer dots: white = minutes gained that day, dark = minutes lost
    const rr = RS + 3 * sin(t * 1.5 + d.n * 0.1);
    const dot = 2 + abs(d.delta) * 2.2;
    if (d.delta >= 0) {
      fill(PAPER, 28);  ellipse(rr, 0, dot * 3.6, dot * 3.6);
      fill(PAPER, 120 + 130 * pow(sin(t * 1.6 + d.n * 0.5), 2));
    } else {
      fill(INK, 205);
    }
    ellipse(rr, 0, dot, dot);

    rotate(TAU / days.length);
  }
  pop();

  // orbit arcs that sweep around the ring, their length follows noise
  noFill();
  strokeWeight(1.6);
  for (let i = 0; i < 5; i++) {
    const r = R1 + (72 + i * 15) * sc;
    const start = t * (0.15 + i * 0.04) + i * 1.3;
    const len = 0.6 + noise(i * 5.5, t * 0.2) * 2.0;
    stroke(PAPER, 170 - i * 22);
    arc(cx, cy, 2 * r, 2 * r, start, start + len);
  }

  // little lights drifting inside the ring
  noStroke();
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    const a = t * s.sp + s.ph;
    const rr = s.rr * sc * (0.8 + 0.2 * sin(t * 0.7 + s.ph * 2));
    const x = cx + cos(a) * rr, y = cy + sin(a * 1.3) * rr * 0.9;
    const c = i % 2 === 0 ? col.a : col.b;
    for (let k = 0; k < 5; k++) {
      const d = s.r * 4.8 * (1 - k / 5);
      fill(c, 26);
      ellipse(x, y, d, d);
    }
    fill(PAPER, 230);
    ellipse(x, y, s.r * 0.9, s.r * 0.9);
  }
}

// Sparkles: four bezier petals rotated with a loop. Smooth twinkle from sin(), jumpy flicker from random().
function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const y = (((s.y - t * s.v) % H) + H) % H;
    const x = s.x + sin(t * 0.4 + s.ph) * 14;
    const k = pow(abs(sin(t * s.f + s.ph)), 3);
    const flick = random() < 0.06 ? random(1.2, 1.7) : 1;         // random: the occasional jump
    const r = s.r * (0.35 + 0.65 * k) * flick;

    push();
    translate(x, y);
    rotate(s.rot + t * 0.1);
    noStroke();
    fill(s.c, 30);
    ellipse(0, 0, r * 2.6, r * 2.6);
    noFill();
    stroke(s.c, 60 + 190 * k);
    strokeWeight(1.6);
    for (let q = 0; q < 4; q++) {
      bezier(0, -r, 0, 0, 0, 0, r, 0);
      rotate(HALF_PI);
    }
    noStroke();
    fill(s.c, 220);
    ellipse(0, 0, r * 0.5, r * 0.5);
    pop();
  }
}

// Film grain: pure random(), new every frame.
function drawGrain() {
  noStroke();
  for (let i = 0; i < 420; i++) {
    fill(random() < 0.5 ? '#ffffff' : INK, random(12, 40));
    rect(random(W), random(H), 1.6, 1.6);
  }
}