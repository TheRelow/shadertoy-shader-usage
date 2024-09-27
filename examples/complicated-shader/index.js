import { createShader, createProgram, vertexShaderSource, loadTexture } from "../../baseCode/shaders.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext('webgl');

const fragmentShaderSource = `
precision mediump float;
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iChannel0;

float isFilled(vec2 st) {
    return sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123;
}

void main() {
    // float cellSize = 64.0;
    // vec2 st = gl_FragCoord.xy / cellSize;
    // vec2 nc = fract(st);
    // vec2 np = floor(mod(gl_FragCoord.xy, cellSize));
    // vec2 idx = floor(st);
    // float isPx = texture2D(iChannel0, vec2(0.5,0.) + (nc / 8.)).r;
    //
    // // vec3 color = vec3(step(0.5, fract(isFilled(idx))));
    // //
    // // color *= 1.0 - smoothstep(0.0, 200.0, length(gl_FragCoord.xy - iMouse.xy)) * 0.6;
    //
    // if (isPx > 0.5) {
    //   gl_FragColor = vec4(0., 1., 1., isPx);
    // } else {
    //   gl_FragColor = vec4(0.,0.,0., 1.0);
    // }
    
    vec2 uv = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
    
    if (uv.x > 512. || uv.y > 512.) {
      gl_FragColor = vec4(0.);
    } else {
      gl_FragColor = texture2D(iChannel0, uv / 512.);
    }
}
`;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
const mouseUniformLocation = gl.getUniformLocation(program, 'iMouse');
const texture0Location = gl.getUniformLocation(program, "iChannel0");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
  -1.0, -1.0,
  1.0, -1.0,
  -1.0,  1.0,
  1.0,  1.0,
];
// const positions = [
//   -.3, -.3,
//   .3, -.3,
//   -.3,  .3,
//   .3,  .3,
// ];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

const texture0 = loadTexture('texture.png', gl)

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

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.uniform1i(texture0Location, 0);

  const primitiveType = gl.TRIANGLE_STRIP;
  const offsetPosition = 0;
  const count = 4;
  gl.drawArrays(primitiveType, offsetPosition, count);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);