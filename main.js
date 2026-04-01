import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa1d2b8);
scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// ─── Orbit Controls ──────────────────────────────────────────────────────────
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.screenSpacePanning = false;
orbitControls.minDistance = 1;
orbitControls.maxDistance = 100;
orbitControls.maxPolarAngle = Math.PI / 2;

// ─── WASD + Q/E Controls ─────────────────────────────────────────────────────
const keys = { w: false, a: false, s: false, d: false };
const wasdSpeed = 0.1;
const ROTATE_STEP = THREE.MathUtils.degToRad(36); // 36° per Q/E press

// Track which rotation keys have already been acted on (fire-once per keydown)
const rotateConsumed = { q: false, e: false };

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = true;

  // Q — rotate view 36° to the left (yaw camera around its own Y axis)
  if (key === 'q' && !rotateConsumed.q) {
    rotateConsumed.q = true;
    rotateCamera(ROTATE_STEP);
  }
  // E — rotate view 36° to the right
  if (key === 'e' && !rotateConsumed.e) {
    rotateConsumed.e = true;
    rotateCamera(-ROTATE_STEP);
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = false;
  if (key === 'q') rotateConsumed.q = false;
  if (key === 'e') rotateConsumed.e = false;
});

/**
 * Rotate the camera around the world Y axis by `angle` radians,
 * pivoting about the OrbitControls target so the look-at point is preserved.
 */
function rotateCamera(angle) {
  const offset = new THREE.Vector3().subVectors(camera.position, orbitControls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  camera.position.copy(orbitControls.target).add(offset);
  camera.lookAt(orbitControls.target);
  orbitControls.update();
}

function applyWASD() {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  right.crossVectors(forward, camera.up).normalize();

  if (keys.w) {
    camera.position.addScaledVector(forward, wasdSpeed);
    orbitControls.target.addScaledVector(forward, wasdSpeed);
  }
  if (keys.s) {
    camera.position.addScaledVector(forward, -wasdSpeed);
    orbitControls.target.addScaledVector(forward, -wasdSpeed);
  }
  if (keys.a) {
    camera.position.addScaledVector(right, -wasdSpeed);
    orbitControls.target.addScaledVector(right, -wasdSpeed);
  }
  if (keys.d) {
    camera.position.addScaledVector(right, wasdSpeed);
    orbitControls.target.addScaledVector(right, wasdSpeed);
  }
}

// ─── Loaders ─────────────────────────────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
/*const alphaMap01 = new THREE.TextureLoader().load('https://raw.githubusercontent.com/510home/Cardozo-3JS-Boilerplate/edit/texture-test/textures/bars.jpg');
    barmaterial.alphaMap01 = alphaMap01;
    barmaterial.alphaMap01.magFilter = THREE.NearestFilter;
    barmaterial.alphaMap01.wrapT = THREE.RepeatWrapping;
    barmaterial.alphaMap01.repeat.y = 1;

//------ Sphere animated texture  ---------
*/
    const ball = new THREE.SphereGeometry( 4, 24, 24);
    const barmaterial = new THREE.MeshStandardMaterial({ color: "#ce15f6" });

    const sphere = new THREE.Mesh(ball, barmaterial);
    sphere.position.set(0, 2, -0.5);
    scene.add(sphere);
    

//------------------------------------------------
// ─── Lighting ────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// ─── Floor Plane (5m × 3m, lying flat) ───────────────────────────────────────
const planeGeo = new THREE.PlaneGeometry(5, 3);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0x2c2c3e,
  roughness: 0.8,
  metalness: 0.1,
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2; // rotate to be horizontal
plane.receiveShadow = true;
scene.add(plane);

// ─── Grid Helper (8 × 4 units, placed on top of plane at y = 0) ──────────────
// THREE.GridHelper(size, divisions) — we want an 8×4 grid.
// GridHelper is always square, so we create an 8-unit grid with 8 divisions
// (1-unit cells) and scale z to compress it to 4 units.
const gridHelper = new THREE.GridHelper(8, 8, 0x444466, 0x333355);
gridHelper.position.y = 0.001; // just above the plane to avoid z-fighting
gridHelper.scale.set(1, 1, 0.5); // compress Z: 8 * 0.5 = 4 units deep
scene.add(gridHelper);

// ─── Helper: make a colored cube ─────────────────────────────────────────────
function makeCube(color, x, y, z) {
  const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ─── Cubes ───────────────────────────────────────────────────────────────────
const yellowCube = makeCube(0xffdd00,  5,  0.125,  2);   // yellow  x=5,  z= 2
const redCube1   = makeCube(0xff2222,  5,  0.125, -2);   // red     x=5,  z=-2
const orangeCube = makeCube(0xff8800, -5,  0.125,  2);   // orange  x=-5, z= 2
const redCube2   = makeCube(0xff2222, -5,  0.125, -2);   // red     x=-5, z=-2

// ─── Resize Handler ──────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animation Loop ──────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  applyWASD();
  orbitControls.update();

  renderer.render(scene, camera);
}

animate();
