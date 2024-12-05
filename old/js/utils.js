let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;
let PADDLE_WIDTH = Math.floor(CANVAS_WIDTH * 0.15);
let PADDLE_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.02);
let BALL_RADIUS = Math.floor(CANVAS_HEIGHT * 0.008);
let BLOCK_SIZE = Math.floor(CANVAS_WIDTH * 0.015);
let BLOCK_PADDING = Math.floor(CANVAS_WIDTH * 0.005);
let BLOCK_ROWS = 12;
let BLOCK_COLS = 24;

const TRIANGLE_ROTATIONS = [0, 60, 120, 180, 240, 300];

window.addEventListener("resize", () => {
  CANVAS_WIDTH = window.innerWidth;
  CANVAS_HEIGHT = window.innerHeight;
  PADDLE_WIDTH = Math.floor(CANVAS_WIDTH * 0.15);
  PADDLE_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.02);
  BALL_RADIUS = Math.floor(CANVAS_HEIGHT * 0.008);
  BLOCK_SIZE = Math.floor(CANVAS_WIDTH * 0.015);
  BLOCK_PADDING = Math.floor(CANVAS_WIDTH * 0.005);

  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }
});

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

function getBlockColor(hits) {
  const colors = ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#00ffff"];
  return colors[hits] || colors[0];
}

function rotatePoint(x, y, cx, cy, angle) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const nx = cos * (x - cx) + sin * (y - cy) + cx;
  const ny = cos * (y - cy) - sin * (x - cx) + cy;
  return { x: nx, y: ny };
}

function getTrianglePoints(x, y, size, rotation) {
  const height = (size * Math.sqrt(3)) / 2;
  const points = [
    { x: x, y: y - height / 2 },
    { x: x - size / 2, y: y + height / 2 },
    { x: x + size / 2, y: y + height / 2 },
  ];

  const center = { x, y };
  return points.map((p) => rotatePoint(p.x, p.y, center.x, center.y, rotation));
}

function pointInTriangle(px, py, triangle) {
  function sign(p1x, p1y, p2x, p2y, p3x, p3y) {
    return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
  }

  const v1 = triangle[0];
  const v2 = triangle[1];
  const v3 = triangle[2];

  const d1 = sign(px, py, v1.x, v1.y, v2.x, v2.y);
  const d2 = sign(px, py, v2.x, v2.y, v3.x, v3.y);
  const d3 = sign(px, py, v3.x, v3.y, v1.x, v1.y);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

function getNormal(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: -dy / length,
    y: dx / length,
  };
}
