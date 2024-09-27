import * as THREE from "three";
import { lightsShaderMaterial } from "../../shaders/lights.js";

const scene = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const canvas = document.querySelector("canvas");

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);

const geometry = new THREE.PlaneGeometry(3, 3);
const plane = new THREE.Mesh(geometry, lightsShaderMaterial);
scene.add(plane);

function windowResize() {
  const newResolution = new THREE.Vector2(
    window.innerWidth,
    window.innerHeight
  );
  lightsShaderMaterial.uniforms.iResolution.value.copy(newResolution);
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
  requestAnimationFrame(animate);
  lightsShaderMaterial.uniforms.iTime.value += 0.01;
  renderer.render(scene, camera);
}
windowResize();
animate();