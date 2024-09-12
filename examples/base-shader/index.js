const canvas = document.querySelector("canvas");
const gl = canvas.getContext('webgl');

const vertexShaderSource = `
      attribute vec4 aPosition;
      void main() {
        gl_Position = aPosition;
      }
    `;

const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;

      void main() {
        vec2 uv = -1.0 + 2.0 * gl_FragCoord.xy / iResolution.xy;
        uv.x *= iResolution.x / iResolution.y;
        vec3 color = vec3(0.0);

        for (int i = 0; i < 128; i++) {
          float pha = sin(float(i) * 546.13 + 1.0) * 0.5 + 0.5;
          float siz = pow(sin(float(i) * 651.74 + 5.0) * 0.5 + 0.5, 4.0);
          float pox = sin(float(i) * 321.55 + 4.1) * iResolution.x / iResolution.y;
          float rad = 0.1 + 0.5 * siz + sin(pha + siz) / 4.0;
          vec2 pos = vec2(pox + sin(iTime / 15. + pha + siz), -1.0 - rad + (2.0 + 2.0 * rad) * mod(pha + 0.3 * (iTime / 7.) * (0.2 + 0.8 * siz), 1.0));
          float dis = length(uv - pos);
          vec3 col = mix(vec3(0.194 * sin(iTime / 6.0) + 0.3, 0.2, 0.3 * pha), vec3(1.1 * sin(iTime / 9.0) + 0.3, 0.2 * pha, 0.4), 0.5 + 0.5 * sin(float(i)));
          float f = length(uv - pos) / rad;
          f = sqrt(clamp(1.0 + (sin((iTime) * siz) * 0.5) * f, 0.0, 1.0));
          color += col.zyx * (1.0 - smoothstep(rad * 0.15, rad, dis));
        }
        color *= sqrt(1.5 - 0.5 * length(uv));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');

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

  const primitiveType = gl.TRIANGLE_STRIP;
  const offsetPosition = 0;
  const count = 4;
  gl.drawArrays(primitiveType, offsetPosition, count);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);