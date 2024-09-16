import { createShader, createProgram, vertexShaderSource } from "../../baseCode/shaders.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext('webgl');

const fragmentShaderSource = `
precision mediump float;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

float isFilled(vec2 st) {
    return sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123;
}

void main() {
    vec2 st = (gl_FragCoord.xy / iResolution.xy) * iResolution.xy / 18.0;
    vec2 idx = floor(st);
    float xIdx = idx.x;
    float yIdx = idx.y;

    float patternValue = isFilled(vec2(xIdx, yIdx));
    vec3 color = vec3(step(0.5, fract(patternValue)));

    color *= 1.0 - smoothstep(0.0, 200.0, length(gl_FragCoord.xy - iMouse.xy)) * 0.6;

    gl_FragColor = vec4(color, 1.0);
}
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
const mouseUniformLocation = gl.getUniformLocation(program, 'iMouse');

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

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (event) => {
  // Обновляем позицию мыши относительно канваса
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = canvas.height - (event.clientY - rect.top); // Инвертируем y-координату
});

function render(time) {
  time *= 0.001; // convert time to seconds

  resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const size = 2;          // 2 components per iteration
  const type = gl.FLOAT;   // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(timeUniformLocation, time);
  gl.uniform2f(mouseUniformLocation, mouseX, mouseY); // Передаем позицию мыши

  const primitiveType = gl.TRIANGLE_STRIP;
  const offsetPosition = 0;
  const count = 4;
  gl.drawArrays(primitiveType, offsetPosition, count);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);