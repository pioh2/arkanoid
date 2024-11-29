let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;
let PADDLE_WIDTH = Math.floor(CANVAS_WIDTH * 0.15);
let PADDLE_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.02);
let BALL_RADIUS = Math.floor(CANVAS_HEIGHT * 0.015);
let BLOCK_WIDTH = Math.floor(CANVAS_WIDTH * 0.08);
let BLOCK_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.03);
let BLOCK_PADDING = Math.floor(CANVAS_WIDTH * 0.01);
const BLOCK_ROWS = 5;
const BLOCK_COLS = 8;

window.addEventListener("resize", () => {
  CANVAS_WIDTH = window.innerWidth;
  CANVAS_HEIGHT = window.innerHeight;
  PADDLE_WIDTH = Math.floor(CANVAS_WIDTH * 0.15);
  PADDLE_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.02);
  BALL_RADIUS = Math.floor(CANVAS_HEIGHT * 0.015);
  BLOCK_WIDTH = Math.floor(CANVAS_WIDTH * 0.08);
  BLOCK_HEIGHT = Math.floor(CANVAS_HEIGHT * 0.03);
  BLOCK_PADDING = Math.floor(CANVAS_WIDTH * 0.01);

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
