let stars = [];
let circleSize = 0;
let expanding = true;
let startTime;
let song;
let fft;
let visualizerStarted = false;
let smoothedWaveforms = [[], [], []];
let currentWaveformIndex = 0; // Index to switch between waveforms
let currentVisualizer = 0;
let visualizerSwitchInterval = 1; // Number of frames before switching visualizers







function preload() {
  song = loadSound('http://localhost:8070/p5/sswag.mp3'); // Make sure this path is correct
}

function setup() {
  createCanvas(1200, 800);
  for (let i = 0; i < 800; i++) {
    stars[i] = new Star();
  }
  startTime = millis();
  fft = new p5.FFT(); // Initialize the FFT object
  song.play(); // Play the song
  amplitude = new p5.Amplitude();
}




function draw() {
  background(0);
  let bassEnergy = fft.getEnergy("bass"); // Get the bass energy to determine shaking
  

  // Get the current volume level (amplitude) of the sound
  let level = amplitude.getLevel();
  
  // Map the amplitude to a range for the visualizer switch interval
  // The map function is used to invert the relationship (louder = faster switching)
  let minInterval = 1; // Switch every frame at maximum volume
  let maxInterval = 20; // Switch every 60 frames at minimum volume
  visualizerSwitchInterval = floor(map(level, 0, 0.2, maxInterval, minInterval));

  // Ensure that the interval does not go below the minimum
  visualizerSwitchInterval = max(visualizerSwitchInterval, minInterval);

  // Calculate the hover effect using sine functions
  let hoverX = sin(millis() / 1000) * 2; // Hover X range of 2 pixels
  let hoverY = cos(millis() / 1000) * 2; // Hover Y range of 2 pixels

  translate(width / 2 + hoverX, height / 2 + hoverY);

  stars.forEach(star => {
    star.update();
    star.show();
  });

  let elapsedTime = millis() - startTime;

  if (expanding) {
    if (elapsedTime < 4000) { // Before 4 seconds
      circleSize += 2;
    } else {
      expanding = false; // Stop expanding
      visualizerStarted = true; // Start the visualizer after 4 seconds
    }
  }

  // Draw a large black circle to mask stars inside the neon circle
  fill(0);
  noStroke();
  ellipse(0, 0, circleSize, circleSize);

  // Gradient effect on the outer circle after 4 seconds
  if (visualizerStarted) {
    let gradientDiameter = circleSize + 40; // Slightly larger to ensure it covers the black circle
    for (let i = gradientDiameter; i > 0; i -= 4) {
      let alpha = map(i, gradientDiameter, 0, 0, 100); // Fade the color
      stroke(255, 192, 203, alpha);
      strokeWeight(2);
      ellipse(0, 0, i, i);
    }
  }

  // Shake effect based on bass energy
  let shakeIntensity = map(bassEnergy, 1, 255, 0, 1); // Reduced shake intensity
  let shakeX = random(-shakeIntensity, shakeIntensity);
  let shakeY = random(-shakeIntensity, shakeIntensity);

  // Draw neon circle that shakes with bass and hovers
  noFill();
  stroke(255, 192, 203);
  strokeWeight(4);
  ellipse(shakeX, shakeY, circleSize, circleSize);

  if (visualizerStarted) {
    drawFrequencyBands();
  }
}


function drawFrequencyBands() {
  let waveform = fft.waveform(); // Get the waveform data from the FFT

  // Determine which visualizer to use based on frame count
  if (frameCount % visualizerSwitchInterval === 0) {
    currentVisualizer = (currentVisualizer + 1) % 3; // Cycle through 0, 1, 2
  }

  noFill();
  stroke(255, 192, 203); // Pink color for the visualizer
  strokeWeight(2);

  // Draw the visualizer based on the currentVisualizer value
  if (currentVisualizer === 0) {
   // Starfield visualizer
beginShape(POINTS); // Use POINTS to draw individual points
stroke(255, 192, 203); // Pink color for the visualizer
strokeWeight(1); // Bigger points for visibility

for (let i = 0; i < waveform.length; i++) {
  let angle = map(i, 0, waveform.length, 0, TWO_PI);
  let r = map(abs(waveform[i]), 0, 1, circleSize * 0.05, circleSize * 0.2); // Use absolute value for radius
  let x = r * cos(angle);
  let y = r * sin(angle);
  point(x, y); // Draw points instead of lines
}
endShape();


    endShape(CLOSE);
  } else if (currentVisualizer === 1) {
    // Ripple visualizer
let rippleCount = 5; // Number of ripples
for (let i = 0; i < rippleCount; i++) {
  let index = floor(map(i, 0, rippleCount, 0, waveform.length));
  let amp = waveform[index]; // Amplitude for the current index
  let alpha = map(abs(amp), 0, 1, 50, 255); // Opacity based on amplitude
  let rippleRadius = map(abs(amp), 0, 1, circleSize * 0.1, circleSize * 0.5);

  // Draw ripple
  noFill();
  stroke(255, 192, 203, alpha); // Pink color with alpha for the visualizer
  strokeWeight(2);
  ellipse(0, 0, rippleRadius * i * 2, rippleRadius * i * 2);
}

    endShape(CLOSE);
  } else {
    // Starburst visualizer
beginShape();
stroke(255, 192, 203); // Pink color for the visualizer
strokeWeight(2);
for (let i = 0; i < waveform.length; i++) {
  let angle = map(i, 0, waveform.length, 0, TWO_PI);
  let amp = waveform[i]; // Get the current amplitude
  let innerRadius = circleSize * 0.4; // Inner radius of the starburst
  let outerRadius = map(amp, -1, 1, circleSize * 0.4, circleSize * 0.5); // Outer radius changes with the amplitude
  
  // Calculate the inner and outer points
  let innerX = innerRadius * cos(angle);
  let innerY = innerRadius * sin(angle);
  let outerX = outerRadius * cos(angle);
  let outerY = outerRadius * sin(angle);
  
  // Draw lines from the inner to the outer points
  line(innerX, innerY, outerX, outerY);
}
endShape();
  }
}



class Star {
  constructor() {
    this.x = random(-width, width);
    this.y = random(-height, height);
    this.z = random(width);
    this.pz = this.z;
  }

  update() {
    this.z = this.z - 20;
    if (this.z < 1) {
      this.z = width;
      this.x = random(-width, width);
      this.y = random(-height, height);
      this.pz = this.z;
    }
  }

  show() {
    fill(255);
    noStroke();

    let sx = map(this.x / this.z, 0, 1, 0, width);
    let sy = map(this.y / this.z, 0, 1, 0, height);

    let r = map(this.z, 0, width, 16, 0);
    ellipse(sx, sy, r, r);

    let px = map(this.x / this.pz, 0, 1, 0, width);
    let py = map(this.y / this.pz, 0, 1, 0, height);

    this.pz = this.z;

    stroke(255);
    line(px, py, sx, sy);
  }
}
