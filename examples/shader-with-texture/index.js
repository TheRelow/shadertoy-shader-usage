import { createShader, createProgram, vertexShaderSource } from "../../baseCode/shaders.js";

// Reference - https://www.shadertoy.com/view/ldccW4

const canvas = document.querySelector("canvas");
const gl = canvas.getContext('webgl');

const fragmentShaderSource = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float symbolSize;

float rand(float seed) {
  return step(0.5, fract(sin(seed * 12.9898) * 43758.5453));
}

float text(vec2 fragCoord) {
  vec2 uv = mod(fragCoord, symbolSize) / symbolSize;
  vec2 block = fragCoord / symbolSize - uv; // px
  uv /= 16.0;

  uv.x += rand(floor(iTime + block.x * 1238.0 / (block.y + 1.0) * 123.0)) / 16.0;
  uv.y = 4.0 / 16.0 - uv.y;

  return texture2D(iChannel0, uv).r;
}

vec3 rain(vec2 fragCoord) {
  fragCoord.x -= mod(fragCoord.x, symbolSize);
  float offset = sin(fragCoord.x * 15.0);
  float speed = cos(fragCoord.x * 3.0) * 0.15 + 0.3;
  float y = fract(fragCoord.y / iResolution.y + iTime * speed + offset);

  float intensity = smoothstep(250.0, 0.0, length(fragCoord.xy - iMouse.xy)) * 6.0 + 1.0;

  return vec3(0.0, 0.373, 1.0) / (y * 20.0) * intensity;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  gl_FragColor = vec4(text(fragCoord) * rain(fragCoord), 1.0);
}
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
const mouseUniformLocation = gl.getUniformLocation(program, 'iMouse');
const texture0Location = gl.getUniformLocation(program, 'iChannel0');
const texture1Location = gl.getUniformLocation(program, 'iChannel1');
const symbolSizeLocation = gl.getUniformLocation(program, 'symbolSize'); // Новое uniform'ы для размера символов

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
  -1.0, -1.0,
  1.0, -1.0,
  -1.0,  1.0,
  1.0,  1.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

function resizeCanvasToDisplaySize(canvas) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function loadTexture(url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // голубой цвет, пока текстура загружается
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, image);

    // Настройка фильтрации текстуры
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };

  image.src = url;
  return texture;
}

const texture0 = loadTexture('letters.png');
const texture1 = loadTexture('noise.png');

let isPaused = false;
let lastRenderTime = 0;
let pausedTime = 0;
let mouseX = -1000; // Инициализируем координаты мыши вне экрана
let mouseY = -1000;
const symbolSize = 22.0; // Начальный размер символов

/**
 * Функция render - отвечает за отрисовку каждого кадра.
 * @param {number} time - Текущее время в миллисекундах.
 */
function render(time) {
  if (!isPaused) {
    const deltaTime = time - lastRenderTime;
    pausedTime += deltaTime * 0.001; // Накопленное время в секундах
  }

  lastRenderTime = time;

  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const size = 2;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  // Обновляем uniform'ы шейдера
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(timeUniformLocation, pausedTime);
  gl.uniform2f(mouseUniformLocation, mouseX, mouseY); // Передаем позицию мыши
  gl.uniform1f(symbolSizeLocation, symbolSize); // Передаем размер символов

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.uniform1i(texture0Location, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.uniform1i(texture1Location, 1);

  const primitiveType = gl.TRIANGLE_STRIP;
  const offsetPosition = 0;
  const count = 4;
  gl.drawArrays(primitiveType, offsetPosition, count);

  requestAnimationFrame(render);
}

// Начинаем анимацию
requestAnimationFrame(render);

// Обновляем координаты мыши при движении
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = canvas.height - (event.clientY - rect.top);
});

// Когда мышь выходит за пределы канваса, задаем координаты за пределами экрана
canvas.addEventListener('mouseleave', () => {
  mouseX = -1000;
  mouseY = -1000;
});

// Когда мышь снова входит в канвас, восстанавливаем координаты мыши
canvas.addEventListener('mouseenter', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = canvas.height - (event.clientY - rect.top);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    isPaused = !isPaused;
  }
});