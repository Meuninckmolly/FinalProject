
let circles = [];
let squares = [];
let rays = [];
let loops = [];

let colors = [
  "#caf0f8",
  "#48cae4",
  "#0096c7",
  "#0077b6",
  "#023e8a",
  "#03045e",
  "#ade8f4",
  "#33415c"
];

function setup() {
  createCanvas(900, 1200);
  pixelDensity(2);
  generateArt();
}

function generateArt() {
  randomSeed(floor(random(10000)));
  noiseSeed(floor(random(10000)));

  circles = [];
  squares = [];
  rays = [];
  loops = [];

  for (let i = 0; i < 100; i++) {
    circles.push({
      x: random(width),
      y: random(height),
      r: random(8, 65),
      c: random(colors),
      alpha: random(80, 180)
    });
  }

  for (let i = 0; i < 65; i++) {
    squares.push({
      x: random(width),
      y: random(height),
      w: random(30, 160),
      h: random(30, 120),
      c: random(colors)
    });
  }

  for (let i = 0; i < 0.3; i++) {
    rays.push({
      x: random(200, 700),
      y: random(300, 900),
      count: random(35, 80)
    });
  }

  for (let i = 0; i < 14; i++) {
    loops.push({
      x: random(width),
      y: random(height),
      size: random(40, 130),
      count: floor(random(8, 20)),
      c: random(colors),
      rotation: random(TWO_PI)
    });
  }
}

function draw() {
  background("#D9C9E8");

  drawGrid();

  drawSquares();

  drawRays();

  drawLoops();

  drawCircles();

  drawDetails();

  drawGrain();

}

function drawGrid() {
  stroke(80, 65, 120, 35);
  strokeWeight(1);

  for (let x = 0; x < width; x += 35) {
    line(x, 0, x, height);
  }

  for (let y = 0; y < height; y += 35) {
    line(0, y, width, y);
  }
}

function drawSquares() {
  for (let s of squares) {
    let movement = noise(
      s.x * 0.002,
      s.y * 0.002,
      frameCount * 0.002
    ) * 18;

    noStroke();
    fill(s.c + "55");

    rect(
      s.x,
      s.y + movement,
      s.w,
      s.h
    );

    noFill();
    stroke(s.c);
    strokeWeight(1.2);

    rect(
      s.x,
      s.y + movement,
      s.w,
      s.h
    );
  }
}

function drawRays() {
  for (let burst of rays) {
    let rotation = frameCount * 0.000002;

    for (let i = 0; i < burst.count; i++) {
      let angle =
        (TWO_PI / burst.count) * i + rotation;

      let length = random(350, 850);

      let x2 = burst.x + cos(angle) * length;
      let y2 = burst.y + sin(angle) * length;

      stroke(random(colors));
      strokeWeight(random(0.5, 1.5));
      line(burst.x, burst.y, x2, y2);
    }
  }
}

function drawLoops() {
  for (let l of loops) {
    push();
    translate(l.x, l.y);
    rotate(l.rotation + frameCount * 0.001);

    noFill();

    for (let i = 0; i < l.count; i++) {
      let size = l.size + i * 7;

      stroke(l.c + "99");
      strokeWeight(1.1);

      ellipse(
        0,
        0,
        size,
        size * 0.85
      );
    }

    pop();
  }
}

function drawCircles() {
  for (let c of circles) {
    let wobble = noise(
      c.x * 0.01,
      c.y * 0.01,
      frameCount * 0.005
    ) * 15;

    noStroke();
    fill(c.c + "AA");

    circle(
      c.x + wobble,
      c.y,
      c.r * 2
    );

    noFill();
    stroke(c.c);
    strokeWeight(1);

    circle(
      c.x + wobble,
      c.y,
      c.r * 2
    );
  }
}

function drawDetails() {
  for (let i = 0; i < 80; i++) {
    let x = (i * 127) % width;
    let y = (i * 193) % height;

    let size = 2 + noise(
      i,
      frameCount * 0.02
    ) * 7;

    noStroke();
    fill(random(colors) + "BB");

    circle(x, y, size);
  }
}

function mousePressed() {
  generateArt();
}

function keyPressed() {
  if (key === "s" || key === "S") {
    saveCanvas("abstract-generative-poster", "png");
  }
}

let downloadButton;

function setup() {
  createCanvas(900, 1200);
  pixelDensity(2);
  generateArt();

  downloadButton = createButton("↓ Download Poster");
  downloadButton.position(20, 20);
  downloadButton.mousePressed(() => {
    saveCanvas("my-generative-poster", "png");
  });
}

function drawGrain() {
  loadPixels();

  for (let i = 0; i < pixels.length; i += 4) {
    let grain = random(-22, 22);

    pixels[i] += grain;
    pixels[i + 1] += grain;
    pixels[i + 2] += grain;

    pixels[i + 3] = 255;
  }

  updatePixels();
}


