import * as THREE from "three";

const scene = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const canvas = document.querySelector("canvas.webglHH");

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);

const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
// Created by inigo quilez - iq/2013 : https://www.shadertoy.com/view/4dl3zn
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Messed up by Weyland

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

const material = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2() },
  },
  vertexShader,
  fragmentShader,
});

const geometry = new THREE.PlaneGeometry(3, 3);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

function windowResize() {
  const newResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );
  material.uniforms.iResolution.value.copy(newResolution);
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value += 0.01;
  renderer.render(scene, camera);
}
windowResize();
animate();