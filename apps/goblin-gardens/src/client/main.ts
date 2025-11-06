import * as THREE from 'three';
import { navigateTo } from '@devvit/client';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  IncrementBy5Response,
  GetColorMapResponse,
  UpdateColorMapResponse,
  ColorMap
} from '../shared/types/api';

const titleElement = document.getElementById('title') as HTMLHeadingElement;
const counterValueElement = document.getElementById('counter-value') as HTMLSpanElement;
// Buttons have been removed; interactions now happen on the planet mesh.

// Color Grid Elements
const colorGridScreen = document.getElementById('color-grid-screen') as HTMLDivElement;
const colorGridElement = document.getElementById('color-grid') as HTMLDivElement;
const gridTitle = document.getElementById('grid-title') as HTMLHeadingElement;
const continueButton = document.getElementById('continue-button') as HTMLButtonElement;
const mainApp = document.getElementById('main-app') as HTMLDivElement;

let currentColorMap: ColorMap = [];

const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');
const demoButton = document.getElementById('demo-button');
const pileDemoButton = document.getElementById('pile-demo-button');

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

// Demo toggle functionality
demoButton?.addEventListener('click', async () => {
  const mainApp = document.getElementById('main-app');
  const demoRoot = document.getElementById('demo-root');

  if (mainApp && demoRoot) {
    mainApp.classList.add('hidden');
    demoRoot.style.display = 'block';

    // Dynamically import React and the demo app
    const { createRoot } = await import('react-dom/client');
    const { DemoApp } = await import('./DemoApp');
    const { createElement } = await import('react');

    const root = createRoot(demoRoot);
    root.render(createElement(DemoApp, {
      onClose: () => {
        root.unmount();
        demoRoot.style.display = 'none';
        mainApp.classList.remove('hidden');
      }
    }));
  }
});

// Pile Demo toggle functionality
pileDemoButton?.addEventListener('click', async () => {
  const mainApp = document.getElementById('main-app');
  const demoRoot = document.getElementById('demo-root');

  if (mainApp && demoRoot) {
    mainApp.classList.add('hidden');
    demoRoot.style.display = 'block';

    // Dynamically import React and the pile demo
    const { createRoot } = await import('react-dom/client');
    const { PileDemo } = await import('./PileDemo');
    const { createElement } = await import('react');

    const root = createRoot(demoRoot);
    root.render(createElement(PileDemo, {
      onClose: () => {
        root.unmount();
        demoRoot.style.display = 'none';
        mainApp.classList.remove('hidden');
      }
    }));
  }
});

let currentPostId: string | null = null;

// Color Grid Functions
async function fetchColorMap(): Promise<void> {
  try {
    const response = await fetch('/api/color-map');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as GetColorMapResponse;
    if (data.type === 'getColorMap') {
      currentColorMap = data.colorMap;
      gridTitle.textContent = `${data.username}'s Color Map`;
      renderColorGrid();
    }
  } catch (err) {
    console.error('Error fetching color map:', err);
  }
}

function renderColorGrid(): void {
  colorGridElement.innerHTML = '';

  currentColorMap.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      const cell = document.createElement('div');
      cell.className = 'color-cell';
      cell.style.backgroundColor = color;
      cell.dataset.row = rowIndex.toString();
      cell.dataset.col = colIndex.toString();

      cell.addEventListener('click', () => void handleCellClick(rowIndex, colIndex));

      colorGridElement.appendChild(cell);
    });
  });
}

async function handleCellClick(row: number, col: number): Promise<void> {
  try {
    const response = await fetch('/api/color-map/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as UpdateColorMapResponse;

    if (data.type === 'updateColorMap') {
      currentColorMap = data.colorMap;
      // Update only the clicked cell for smooth animation
      const cells = colorGridElement.querySelectorAll('.color-cell');
      const cellIndex = row * currentColorMap[0].length + col;
      const cell = cells[cellIndex] as HTMLDivElement;
      if (cell) {
        cell.style.backgroundColor = data.newColor;
      }
    }
  } catch (err) {
    console.error('Error updating color map:', err);
  }
}

function showMainApp(): void {
  colorGridScreen.style.display = 'none';
  mainApp.style.display = 'block';
  void fetchInitialCount();
  animate();
}

continueButton.addEventListener('click', showMainApp);

async function fetchInitialCount(): Promise<void> {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as InitResponse;
    if (data.type === 'init') {
      counterValueElement.textContent = data.count.toString();
      currentPostId = data.postId;
      titleElement.textContent = `Hey ${data.username} 👋`;
    } else {
      counterValueElement.textContent = 'Error';
    }
  } catch (err) {
    console.error('Error fetching initial count:', err);
    counterValueElement.textContent = 'Error';
  }
}

async function updateCounter(action: 'increment' | 'decrement' | 'increment-by-5'): Promise<void> {
  if (!currentPostId) return;
  try {
    const response = await fetch(`/api/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as IncrementResponse | DecrementResponse | IncrementBy5Response;
    counterValueElement.textContent = data.count.toString();
  } catch (err) {
    console.error(`Error ${action}ing count:`, err);
  }
}

// Button event listeners removed – handled via planet click.

const canvas = document.getElementById('bg') as HTMLCanvasElement;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio ?? 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

camera.lookAt(0, 0, 0);

renderer.render(scene, camera);

// Resize handler
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = '';

const earthTexture = textureLoader.load('/earth_atmos_2048.jpg');
const earthNormalMap = textureLoader.load('/earth_normal_2048.jpg');
const earthSpecularMap = textureLoader.load('/earth_specular_2048.jpg');

earthTexture.encoding = THREE.sRGBEncoding;
earthNormalMap.encoding = THREE.LinearEncoding;
earthSpecularMap.encoding = THREE.LinearEncoding;

const earthGeo = new THREE.SphereGeometry(10, 64, 64);
const earthMat = new THREE.MeshPhongMaterial({
  map: earthTexture,
  normalMap: earthNormalMap,
  specularMap: earthSpecularMap,
  shininess: 5,
});
const earthSphere = new THREE.Mesh(earthGeo, earthMat);

const planetGroup = new THREE.Group();
planetGroup.add(earthSphere);
scene.add(planetGroup);

// Create a second sphere for decrementing (red sphere)
const decrementGeo = new THREE.SphereGeometry(5, 32, 32);
const decrementMat = new THREE.MeshPhongMaterial({
  color: 0xff3333,
  emissive: 0x330000,
  shininess: 10,
});
const decrementSphere = new THREE.Mesh(decrementGeo, decrementMat);
decrementSphere.position.set(-25, 0, 0);

const decrementGroup = new THREE.Group();
decrementGroup.add(decrementSphere);
scene.add(decrementGroup);

// Create a third sphere for incrementing by 5 (blue sphere with orbital motion)
const incrementBy5Geo = new THREE.SphereGeometry(3, 24, 24);
const incrementBy5Mat = new THREE.MeshPhongMaterial({
  color: 0x3366ff,
  emissive: 0x000033,
  shininess: 15,
});
const incrementBy5Sphere = new THREE.Mesh(incrementBy5Geo, incrementBy5Mat);

// Position it to orbit around the earth sphere
const orbitRadius = 18;
const incrementBy5Group = new THREE.Group();
incrementBy5Sphere.position.set(orbitRadius, 0, 0);
incrementBy5Group.add(incrementBy5Sphere);
incrementBy5Group.position.copy(planetGroup.position);
scene.add(incrementBy5Group);

function addStar(): void {
  const starGeo = new THREE.SphereGeometry(0.25, 24, 24);
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(starGeo, starMat);

  const x = THREE.MathUtils.randFloatSpread(200);
  const y = THREE.MathUtils.randFloatSpread(200);
  const z = THREE.MathUtils.randFloatSpread(200);
  star.position.set(x, y, z);
  scene.add(star);
}
Array.from({ length: 200 }).forEach(addStar);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let scaleVelocity = 0;
let decrementScaleVelocity = 0;
let incrementBy5ScaleVelocity = 0;

function handleClick(event: PointerEvent): void {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check for earth sphere (increment)
  const earthIntersects = raycaster.intersectObject(earthSphere);
  if (earthIntersects.length > 0) {
    // Start gentle bounce
    scaleVelocity = 0.05;
    void updateCounter('increment');
    return;
  }

  // Check for decrement sphere
  const decrementIntersects = raycaster.intersectObject(decrementSphere);
  if (decrementIntersects.length > 0) {
    // Start gentle bounce
    decrementScaleVelocity = 0.05;
    void updateCounter('decrement');
    return;
  }

  // Check for increment by 5 sphere (blue orbiting sphere)
  const incrementBy5Intersects = raycaster.intersectObject(incrementBy5Sphere);
  if (incrementBy5Intersects.length > 0) {
    // Start gentle bounce
    incrementBy5ScaleVelocity = 0.05;
    void updateCounter('increment-by-5');
    return;
  }
}

window.addEventListener('pointerdown', handleClick);

function animate(): void {
  requestAnimationFrame(animate);

  planetGroup.rotation.y += 0.0025;
  planetGroup.rotation.x += 0.001;

  decrementGroup.rotation.y -= 0.003;
  decrementGroup.rotation.x -= 0.0015;

  // Orbit the blue sphere around the earth sphere (faster orbit)
  incrementBy5Group.rotation.y += 0.01;
  incrementBy5Group.rotation.x += 0.005;

  // Animate earth sphere bounce
  if (scaleVelocity !== 0) {
    const newScale = planetGroup.scale.x + scaleVelocity;
    planetGroup.scale.set(newScale, newScale, newScale);

    if (newScale >= 1.2) scaleVelocity = -0.04;
    if (newScale <= 1) {
      planetGroup.scale.set(1, 1, 1);
      scaleVelocity = 0;
    }
  }

  // Animate decrement sphere bounce
  if (decrementScaleVelocity !== 0) {
    const newScale = decrementGroup.scale.x + decrementScaleVelocity;
    decrementGroup.scale.set(newScale, newScale, newScale);

    if (newScale >= 1.2) decrementScaleVelocity = -0.04;
    if (newScale <= 1) {
      decrementGroup.scale.set(1, 1, 1);
      decrementScaleVelocity = 0;
    }
  }

  // Animate increment by 5 sphere bounce
  if (incrementBy5ScaleVelocity !== 0) {
    const currentScale = incrementBy5Sphere.scale.x;
    const newScale = currentScale + incrementBy5ScaleVelocity;
    incrementBy5Sphere.scale.set(newScale, newScale, newScale);

    if (newScale >= 1.3) incrementBy5ScaleVelocity = -0.05;
    if (newScale <= 1) {
      incrementBy5Sphere.scale.set(1, 1, 1);
      incrementBy5ScaleVelocity = 0;
    }
  }

  renderer.render(scene, camera);
}

// Initialize by launching PileDemo directly
(async () => {
  const colorGridScreen = document.getElementById('color-grid-screen');
  const mainApp = document.getElementById('main-app');
  const demoRoot = document.getElementById('demo-root');

  // Hide other screens
  if (colorGridScreen) colorGridScreen.style.display = 'none';
  if (mainApp) mainApp.style.display = 'none';
  if (demoRoot) demoRoot.style.display = 'block';

  // Fetch username from API
  let username = 'Guest';
  try {
    const response = await fetch('/api/init');
    if (response.ok) {
      const data = (await response.json()) as InitResponse;
      if (data.type === 'init') {
        username = data.username;
      }
    }
  } catch (err) {
    console.error('Error fetching username:', err);
  }

  // Dynamically import React and the pile demo
  const { createRoot } = await import('react-dom/client');
  const { PileDemo } = await import('./PileDemo');
  const { createElement } = await import('react');

  const root = createRoot(demoRoot);
  root.render(createElement(PileDemo, {
    onClose: () => {
      // When closing PileDemo, go back to color grid
      root.unmount();
      if (demoRoot) demoRoot.style.display = 'none';
      if (colorGridScreen) colorGridScreen.style.display = 'block';
      void fetchColorMap();
    },
    level: 1,
    username: username
  }));
})();
