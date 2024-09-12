// Reference - https://www.shadertoy.com/view/ldccW4

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
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;

  float text(vec2 fragCoord) {
    vec2 uv = mod(fragCoord.xy, 16.) * 0.0625;
    vec2 block = fragCoord * 0.0625 - uv;
    uv = uv * 0.8 + 0.1; // scale the letters up a bit
    uv += floor(texture2D(iChannel1, block / iResolution.xy + iTime * 0.002).xy * 16.); // randomize letters
    uv *= 0.0625; // bring back into 0-1 range
    uv.x = -uv.x; // flip letters horizontally
    return texture2D(iChannel0, uv).r;
  }

  vec3 rain(vec2 fragCoord) {
    fragCoord.x -= mod(fragCoord.x, 16.);
    float offset = sin(fragCoord.x * 15.);
    float speed = cos(fragCoord.x * 3.) * 0.3 + 0.7;
    float y = fract(fragCoord.y / iResolution.y + iTime * speed + offset);
    return vec3(0.1, 1.0, 0.35) / (y * 20.);
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = mod(fragCoord, 16.0) * 0.0625;
    vec2 block = fragCoord * 0.0625 - uv;
    uv = uv * 0.8 + 0.1;
    uv += floor(texture2D(iChannel1, block / iResolution.xy + iTime * 0.002).xy * 16.0);
    uv *= 0.0625;

    // Инвертируем координаты
    uv.x = 1.0 - uv.x;

    // Комбинируем результат текстуры и \`rain\`
    vec3 rainColor = rain(fragCoord);
    float textColor = texture2D(iChannel0, uv).r;

    gl_FragColor = vec4(textColor * rainColor, 1.0);
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
const texture0Location = gl.getUniformLocation(program, 'iChannel0');
const texture1Location = gl.getUniformLocation(program, 'iChannel1');

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
requestAnimationFrame(render);