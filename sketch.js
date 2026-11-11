let circles = [];
let squares = [];
let rays = [];
let loops = [];
let details = [];

let artwork;

let blue;
let pink;
let yellow;

let downloadButton;

const PAPER = "#D9C9E8";

const COLORS = [
  "#593833",
  "#d88180",
  "#f7b1b0",
  "#cad182",
  "#73a580",
  "#da627d",
  "#99d98c",
  "#fffbcc"
];

let dotType = "line";
let dotSpacing = 5;

let angles = [15, 75, 0];

let lastUpdate = -999;
let updateInterval = 10;


function setup() {

  createCanvas(900, 1200);
  pixelDensity(1);

  artwork = createGraphics(width, height);
  artwork.pixelDensity(1);

  blue = new Riso("fluorescentpink");
  pink = new Riso("yellow");
  yellow = new Riso("blue");

  generateArt();

  downloadButton = createButton("↓ Download Poster");

  downloadButton.position(20, 20);

  downloadButton.style("font-family", "DM Mono, monospace");
  downloadButton.style("font-size", "12px");
  downloadButton.style("padding", "10px 14px");
  downloadButton.style("border", "1px solid #33415c");
  downloadButton.style("background", "#F4EAF3");
  downloadButton.style("color", "#30394dff");
  downloadButton.style("cursor", "pointer");

  downloadButton.mousePressed(() => {
    saveCanvas("daydream-drift-riso", "png");
  });

}


// GENERATE ART
function generateArt() {

  randomSeed(floor(random(100000)));
  noiseSeed(floor(random(100000)));

  circles = [];
  squares = [];
  rays = [];
  loops = [];
  details = [];

  // CIRCLES
  for (let i = 0; i < 100; i++) {

    circles.push({
      x: random(width),
      y: random(height),
      r: random(8, 65),
      c: random(COLORS),
      alpha: random(120, 205),
      seed: random(1000)
    });

  }

  // SQUARES
  for (let i = 0; i < 65; i++) {

    squares.push({
      x: random(width),
      y: random(height),
      w: random(30, 160),
      h: random(30, 120),
      c: random(COLORS),
      seed: random(1000)
    });

  }

  // RADIAL BURSTS
  for (let i = 0; i < 2; i++) {

    let burst = {
      x: random(200, 700),
      y: random(300, 900),
      count: floor(random(35, 80)),
      rotation: random(TWO_PI),
      lengths: [],
      colors: []
    };

    for (let j = 0; j < burst.count; j++) {

      burst.lengths.push(random(350, 850));
      burst.colors.push(random(COLORS));

    }

    rays.push(burst);

  }

  // CONCENTRIC LOOPS
  for (let i = 0; i < 14; i++) {

    loops.push({
      x: random(width),
      y: random(height),
      size: random(40, 130),
      count: floor(random(8, 20)),
      c: random(COLORS),
      rotation: random(TWO_PI)
    });

  }

  // SMALL DETAILS
  for (let i = 0; i < 80; i++) {

    details.push({
      x: random(width),
      y: random(height),
      size: random(2, 9),
      c: random(COLORS)
    });

  }

  lastUpdate = -999;

}


function draw() {

  artwork.background(255);

  drawGrid(artwork);
  drawSquares(artwork);
  drawRays(artwork);
  drawLoops(artwork);
  drawCircles(artwork);
  drawDetails(artwork);
  drawGrain(artwork);

  if (frameCount - lastUpdate >= updateInterval) {

    applyRiso();

    lastUpdate = frameCount;

  }

  background(PAPER);

  drawRiso();

}


function drawGrid(g) {

  g.push();

  g.noFill();
  g.stroke(80, 65, 120, 35);
  g.strokeWeight(1);

  for (let x = 0; x < width; x += 35) {
    g.line(x, 0, x, height);
  }

  for (let y = 0; y < height; y += 35) {
    g.line(0, y, width, y);
  }

  g.pop();

}


function drawSquares(g) {

  for (let s of squares) {

    let movement =
      noise(s.seed, frameCount * 0.002) * 18;

    g.push();

    g.noStroke();
    g.fill(s.c);

    g.rect(
      s.x,
      s.y + movement,
      s.w,
      s.h
    );

    g.noFill();
    g.stroke(s.c);
    g.strokeWeight(1.2);

    g.rect(
      s.x,
      s.y + movement,
      s.w,
      s.h
    );

    g.pop();

  }

}


function drawRays(g) {

  for (let burst of rays) {

    let rotation =
      burst.rotation + frameCount * 0.0002;

    for (let i = 0; i < burst.count; i++) {

      let angle =
        (TWO_PI / burst.count) * i + rotation;

      let rayLength = burst.lengths[i];

      let x2 =
        burst.x + cos(angle) * rayLength;

      let y2 =
        burst.y + sin(angle) * rayLength;

      g.stroke(burst.colors[i]);
      g.strokeWeight(1);

      g.line(
        burst.x,
        burst.y,
        x2,
        y2
      );

    }

  }

}


function drawLoops(g) {

  for (let l of loops) {

    g.push();

    g.translate(l.x, l.y);

    g.rotate(
      l.rotation + frameCount * 0.001
    );

    g.noFill();

    for (let i = 0; i < l.count; i++) {

      let size = l.size + i * 7;

      g.stroke(l.c);
      g.strokeWeight(1.1);

      g.ellipse(
        0,
        0,
        size,
        size * 0.85
      );

    }

    g.pop();

  }

}


function drawCircles(g) {

  for (let c of circles) {

    let wobble =
      noise(c.seed, frameCount * 0.005) * 15;

    g.push();

    g.noStroke();
    g.fill(c.c);

    g.circle(
      c.x + wobble,
      c.y,
      c.r * 2
    );

    g.noFill();
    g.stroke(c.c);
    g.strokeWeight(1);

    g.circle(
      c.x + wobble,
      c.y,
      c.r * 2
    );

    g.pop();

  }

}


function drawDetails(g) {

  for (let d of details) {

    g.noStroke();
    g.fill(d.c);

    g.circle(
      d.x,
      d.y,
      d.size
    );

  }

}


function drawGrain(g) {

  g.push();

  g.noStroke();

  for (let i = 0; i < 500; i++) {

    let x = (i * 197.3 + 31) % width;
    let y = (i * 113.7 + 17) % height;

    g.fill(i % 2 === 0 ? "#5b335cff" : "#f7caf8ff");

    g.circle(
      x,
      y,
      0.8 + (i % 3) * 0.5
    );

  }

  g.pop();

}



function applyRiso() {

  clearRiso();

  let original = artwork.get();

  let separated = extractMappedChannels(
    original,
    0.1,
    true
  );

  let inks = [
    blue,
    pink,
    yellow
  ];

  for (let i = 0; i < inks.length; i++) {

    let halftoned = halftoneImage(
      separated[i],
      dotType,
      dotSpacing,
      angles[i],
      90
    );

    inks[i].image(halftoned, 0, 0);

  }

}


function mousePressed() {

  if (
    mouseX >= 0 &&
    mouseX <= width &&
    mouseY >= 0 &&
    mouseY <= height
  ) {

    generateArt();

  }

}


function keyPressed() {

  if (key === "s" || key === "S") {

    saveCanvas(
      "daydream-drift-riso",
      "png"
    );

  }

  if (key === "e" || key === "E") {

    exportRiso();

  }

}
