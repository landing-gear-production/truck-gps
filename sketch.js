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

// let a, b, c, d;
function preload() {
  bg = loadImage("map_square.png");
  arrow = loadImage("arrow.png");
  points = loadJSON("data.json");

}

function setup() {
  let oldPoints = {...points};
  points = [];
  for (let i = 0; i < Object.keys(oldPoints).length; i = i + 20) {
    points.push({x: oldPoints[i].x, z: oldPoints[i].z, heading: oldPoints[i].heading});
  }
  points.push({x: oldPoints[Object.keys(oldPoints).length-1].x, z: oldPoints[Object.keys(oldPoints).length-1].z, heading: oldPoints[Object.keys(oldPoints).length-1].heading});
  print("Path shortened from " + Object.keys(oldPoints).length, "to " + Object.keys(points).length)
  pixelDensity(1);
  let c = createCanvas(windowWidth, windowHeight);
  c.parent("sketch");
  inputURL = createInput();
  inputURL.value("http://172.26.92.202:25555/api/ets2/telemetry");
  inputURL.position(100, 50);
  inputURL.size(500);

  inputScale = createSlider(0, 255);
  inputScale.value(s*255 / 5);
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
  inputRotation.value(r * 512 / (2*Math.PI) );
  inputRotation.position(100, 250);
  inputRotation.size(500);

  inputProgress = createSlider(0, 255);
  inputProgress.value(0);
  inputProgress.position(100, 300);
  inputProgress.size(500);
  
  if (!fakeDataMode) {
    getData();
    currentPosition = createVector(points[0].x, points[0].z, points[0].heading);
  }
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
  let closestIndex = nearestPoint();
  let progression = nearestPoint() / (Object.keys(points).length);
  push();
    if (editMode) {
      x = inputX.value();
      y = inputY.value();
      r = inputRotation.value()/512*2*Math.PI;
      s = 5 * inputScale.value()/255;
    }
    
    let progress = floor(inputProgress.value()/255 * (Object.keys(points).length-1));
    
    let first = createVector(points[0].x, points[0].z, points[0].heading);
    let centerPoint = createVector(-points[progress].x, -points[progress].z, points[progress].heading);

    if (!fakeDataMode) {
      centerPoint = createVector(-currentPosition.x, -currentPosition.z, currentPosition.heading);
    }
    if (fakeDataMode) {
      currentPosition = centerPoint;
    }
    translate(width/2, height/2);
    rotate(centerPoint.z* PI *2);

    //align map
    push();
      translate(first.x, first.y);
      translate(centerPoint.x, centerPoint.y);
      scale(s);
      rotate(r);
      translate(-x,-y);
      
      imageMode(CORNER);
      image(bg, 0, 0, 1024, 1024);
    pop();

    //draw path
    push()
      noFill();
      stroke("#CF202E");
      strokeWeight(10);
      beginShape();
      for (let i = 0; i < Object.keys(points).length; i++) {
        let p = createVector(points[i].x, points[i].z);
        p.add(centerPoint);
        
        push();
          // translate(p.x, p.y);
          vertex(p.x, p.y);
        pop();
      }
      endShape(); 
    pop();
    // let p = createVector(points[closestIndex].x, points[closestIndex].z);
    // p.add(centerPoint);
    // ellipse(p.x, p.y, 100, 100);
  pop();
  
  //draw UI
  imageMode(CENTER);
  image(arrow, width/2, height/2);
  if (editMode) {
    text("Edit mode on", width/2, height/2)
    if (fakeDataMode) {
      text("Fake data mode on", width/2, height/2 - 20)
    }
    text("s: " +String(s), width/2, height/2 + 20);
    text("x: " +String(x), width/2, height/2 + 30);
    text("y: " +String(y), width/2, height/2 + 40);
    text("r: " +String(r), width/2, height/2 + 50);
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

function keyPressed() {
  // if (key == 's' || key == 'S') {
  //   const date = new Date();
  //   downloadAsJSON("points" + date.getDate() + ".json");
  // }
  if (key == 'e'){
    editMode = !editMode;
  }
  if (key == "d"){
    fakeDataMode = !fakeDataMode;
  }
}
function mousePressed() {
  
}

function getData () {
  print("fetching data")
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
    currentPosition = data.truck.placement;
  })
  .catch(error => console.error('There was a problem fetching the data:', error));
}

function downloadAsJSON (filename) {
  
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(points)], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();

}

function nearestPoint () {
  // takes player position and returns nearst point to path
  let min = 100000000;
  let index = -1;
  for (let i = 0; i < Object.keys(points).length; i++) {
    let d = dist(points[i].x, points[i].z, currentPosition.x, currentPosition.z);
    if (d < min) {
      min = d;
      index = i;
    }
  }
  return index;
}
