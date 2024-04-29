let inputURL, inputX, inputY, inputRotation, inputScale, inputProgress;
let points = [];
let bg, arrow;
let s = 2.359;
let x = 253;
let y = 848;
let r = 0.28225;
let w = 2024;
let h = 1024;
let editMode = false;
let fakeDataMode = false;
let isGettingData = false;
let currentPosition;
let totalLength;

let instructions = {
  "data": [
    {
      "instruction": "TURN RIGHT ONTO THE ROAD",
      "x": -112699,
      "y": -15421.2,
      "done": false
    },
    {
      "instruction": "TURN RIGHT ONTO THE ROAD",
      "x": -112642,
      "y": -15425.3,
      "done": false
    },
    {
      "instruction": "EXIT RIGHT",
      "x": -112449,
      "y": -15290.2,
      "done": false
    },
    {
      "instruction": "KEEP STRAIGHT AND THEN TURN RIGHT",
      "x": -111983,
      "y": -15678.6,
      "done": false
    },
    {
      "instruction": "EXIT RIGHT",
      "x": -111700,
      "y": -15836.2,
      "done": false
    },
    {
      "instruction": "STAY LEFT",
      "x": -111587,
      "y": -15899.1,
      "done": false
    },
    {
      "instruction": "EXIT RIGHT",
      "x": -111885,
      "y": -16718.7,
      "done": false
    },
    {
      "instruction": "TURN RIGHT",
      "x": -111998,
      "y": -17035.3
    },
    {
      "instruction": "YOU HAVE REACHED YOUR DESTINATION",
      "x": -111948,
      "y": -17118.2,
      "done": false
    },
  ]
}

function preload() {
  bg = loadImage("map_square.png");
  arrow = loadImage("arrow.png");
  points = loadJSON("data.json");

}

function setup() {
  let oldPoints = { ...points };
  points = [];
  for (let i = 0; i < Object.keys(oldPoints).length; i = i + 20) {
    points.push({ x: oldPoints[i].x, z: oldPoints[i].z, heading: oldPoints[i].heading });
  }
  points.push({ x: oldPoints[Object.keys(oldPoints).length - 1].x, z: oldPoints[Object.keys(oldPoints).length - 1].z, heading: oldPoints[Object.keys(oldPoints).length - 1].heading });
  print("Path shortened from " + Object.keys(oldPoints).length, "to " + Object.keys(points).length)
  totalLength = lengthOfPoints(points);
  pixelDensity(1);
  let c = createCanvas(windowWidth, windowHeight);
  c.parent("sketch");
  inputURL = createInput();
  inputURL.value("https://truck.outlandnish.com/api/ets2/telemetry");
  inputURL.position(100, 50);
  inputURL.size(500);

  inputScale = createSlider(0, 255);
  inputScale.value(s * 255 / 5);
  inputScale.position(100, 100);
  inputScale.size(500);

  inputX = createSlider(0, width);
  inputX.value(x);
  inputX.position(100, 150);
  inputX.size(500);

  inputY = createSlider(0, height);
  inputY.value(y);
  inputY.position(100, 200);
  inputY.size(500);

  inputRotation = createSlider(0, 511);
  inputRotation.value(r * 512 / (2 * Math.PI));
  inputRotation.position(100, 250);
  inputRotation.size(500);

  inputProgress = createSlider(0, 255);
  inputProgress.value(0);
  inputProgress.position(100, 300);
  inputProgress.size(500);

  if (!fakeDataMode) {
    getData();

  }
  currentPosition = createVector(points[0].x, points[0].z, points[0].heading);
  // getData();
}

function draw() {
  if (!isGettingData && !fakeDataMode) {
    getData();
  }


  background("#1E1D1D");

  noStroke();
  fill(255, 0, 0);

  //apply transformations for map

  push();
  if (editMode) {
    // x = inputX.value();
    // y = inputY.value();
    // r = inputRotation.value()/512*2*Math.PI;
    // s = 5 * inputScale.value()/255;
  }

  let progress = floor(inputProgress.value() / 255 * (Object.keys(points).length - 1));

  let first = createVector(points[0].x, points[0].z, points[0].heading);

  let centerPoint = createVector(-points[progress].x, -points[progress].z, points[progress].heading);

  if (!fakeDataMode) {
    centerPoint = createVector(-currentPosition.x, -currentPosition.z, currentPosition.heading);
  }
  else {
    currentPosition = createVector(points[progress].x, points[progress].z, points[progress].heading);
    centerPoint = createVector(-currentPosition.x, -currentPosition.y, currentPosition.z);
  }
  translate(width / 2, height / 2);
  rotate(centerPoint.z * PI * 2);
  let closestIndex = nearestPoint();
  let progression = nearestPoint() / (Object.keys(points).length);
  //align map
  push();
  translate(first.x, first.y);
  translate(centerPoint.x, centerPoint.y);
  scale(s);
  rotate(r);
  translate(-x, -y);

  imageMode(CORNER);
  image(bg, 0, 0, 1024, 1024);
  pop();

  push()
  noFill();
  stroke("#CF202E");
  strokeWeight(20);
  beginShape();
  for (let i = 0; i < Object.keys(points).length; i++) {
    let p = createVector(points[i].x, points[i].z);
    p.add(centerPoint);
    vertex(p.x, p.y);
  }

  endShape();
  pop();

  //draw path
  push()
  noFill();
  stroke("#F1AE33");
  strokeWeight(20);
  beginShape();
  for (let i = 0; i < closestIndex; i++) {
    let p = createVector(points[i].x, points[i].z);

    p.add(centerPoint);

    // push();
    // translate(p.x, p.y);
    vertex(p.x, p.y);
    // pop();
  }
  vertex(centerPoint.x + currentPosition.x, centerPoint.z + currentPosition.y)
  endShape();
  pop();

  push()
  instructions.data.forEach((instruction, i) => {
    fill("white")
    let p = createVector(instruction.x, instruction.y);
    p.add(centerPoint);
    circle(p.x, p.y, 10);

  })
  let nearestGPSindex = nearestGPS();
  let closestInstruction = instructions.data[nearestGPSindex]
  let d = dist(closestInstruction.x, closestInstruction.y, currentPosition.x, currentPosition.y);
  if (d < 20) {
    instructions.data[nearestGPSindex].done = true
    if (nearestGPSindex == Object.keys(instructions.data).length - 1) {
      resetProgress()
    }
  }
  fill("red")
  circle(closestInstruction.x + centerPoint.x, closestInstruction.y + centerPoint.y, 10);
  pop()

  pop();

  //draw UI
  let bar = document.getElementById("progressBar");
  bar.style.width = "" + (map(progression, 0, 1, 2, 100)) + "%";
  let distanceP = document.getElementById("distance");
  distanceP.innerHTML = "Distance left: " + Math.round(map(progression, 1, 0, 0, totalLength) * 0.000621371 * 100) / 100 + " miles";
  imageMode(CENTER);
  image(arrow, width / 2, height / 2, 60, 67);
  if (editMode) {
    text("Edit mode on", width / 2, height / 2)
    if (fakeDataMode) {
      text("Fake data mode on", width / 2, height / 2 - 20)
    }
    text("s: " + String(s), width / 2, height / 2 + 20);
    text("x: " + String(x), width / 2, height / 2 + 30);
    text("y: " + String(y), width / 2, height / 2 + 40);
    text("r: " + String(r), width / 2, height / 2 + 50);
    //let inputURL, inputX, inputY, inputRotation, inputScale, inputProgress;
    inputX.show();
    inputY.show();
    inputRotation.show();
    inputScale.show();
    inputProgress.show();
    inputURL.show();
  }
  else {
    inputX.hide();
    inputY.hide();
    inputRotation.hide();
    inputScale.hide();
    inputProgress.hide();
    inputURL.hide();
  }
}

function resetProgress() {
  print("finished")
  instructions.data.forEach((instruction, i) => {
    instruction.done = false

  })

}

function keyPressed() {
  // if (key == 's' || key == 'S') {
  //   const date = new Date();
  //   downloadAsJSON("points" + date.getDate() + ".json");
  // }
  if (key == 'r') {
    resetProgress();
  }
  if (key == 'e') {
    editMode = !editMode;
  }
  if (key == "d") {
    fakeDataMode = !fakeDataMode;
  }
}
function mousePressed() {

}

function getData() {
  // print("fetching data")
  isGettingData = true;
  fetch(inputURL.value())
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      isGettingData = false;
      // print(data);
      currentPosition = data.truck.placement;
    })
    .catch(error => console.error('There was a problem fetching the data:', error));
}

function downloadAsJSON(filename) {

  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(points)], { type: 'text/plain' });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();

}
function lengthOfPoints() {
  let length = 0;
  for (let i = 0; i < Object.keys(points).length - 1; i++) {
    length += dist(points[i].x, points[i].z, points[i + 1].x, points[i + 1].z);
  }
  return length;
}
function nearestPoint() {
  // takes player position and returns nearst point to path
  let min = 100000000;
  let index = -1;
  for (let i = 0; i < points.length; i++) {
    let d = dist(points[i].x, points[i].z, currentPosition.x, currentPosition.z);
    if (d < min) {
      min = d;
      index = i;
    }
  }
  return index;
}

function nearestGPS() {
  let min = 100000000;
  let index = -1;

  instructions.data.forEach((instruction, i) => {
    if (instruction.done) { return }
    let d = dist(instruction.x, instruction.y, currentPosition.x, currentPosition.y);
    if (d < min) {
      min = d;
      index = i;
    }
  })
  return index;
}

