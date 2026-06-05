import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, PerspectiveCamera, Points, RawShaderMaterial, Scene, WebGLRenderer } from "https://esm.sh/three@0.136.0"
import { TWEEN } from "https://esm.sh/three@0.136.0/examples/jsm/libs/tween.module.min.js"



const canvas = document.querySelector(".galaxy-canvas")

if (!canvas) {
  throw new Error("Galaxy canvas element was not found.")
}

// ------------------------ //
// SETUP

const count = 128 ** 2

const scene = new Scene()

const getCanvasSize = () => {
  const bounds = canvas.getBoundingClientRect()
  return {
    width: Math.max(bounds.width, 1),
    height: Math.max(bounds.height, 1),
  }
}

const size = getCanvasSize()
const camera = new PerspectiveCamera(
  60, size.width / size.height, 0.1, 100
)
camera.position.set(0, 1.8, 3.1)

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setClearColor(0x000000, 0)
renderer.setSize(size.width, size.height, false)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



// ------------------------ //
// STAR ALPHA TEXTURE

const ctx = document.createElement("canvas").getContext("2d")
ctx.canvas.width = ctx.canvas.height = 32

ctx.fillStyle = "#000"
ctx.fillRect(0, 0, 32, 32)

let grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
grd.addColorStop(0.0, "#fff")
grd.addColorStop(1.0, "#000")
ctx.fillStyle = grd
ctx.beginPath(); ctx.rect(15, 0, 2, 32); ctx.fill()
ctx.beginPath(); ctx.rect(0, 15, 32, 2); ctx.fill()

grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
grd.addColorStop(0.1, "#ffff")
grd.addColorStop(0.6, "#0000")
ctx.fillStyle = grd
ctx.fillRect(0, 0, 32, 32)

const alphaMap = new CanvasTexture(ctx.canvas)



// ------------------------ //
// GALAXY

const galaxyGeometry = new BufferGeometry()

const galaxyPosition = new Float32Array(count * 3)
const galaxySeed = new Float32Array(count * 3)
const galaxySize = new Float32Array(count)

for (let i = 0; i < count; i++) {
  galaxyPosition[i * 3] = i / count
  galaxySeed[i * 3 + 0] = Math.random()
  galaxySeed[i * 3 + 1] = Math.random()
  galaxySeed[i * 3 + 2] = Math.random()
  galaxySize[i] = Math.random() * 2 + 0.5
}

galaxyGeometry.setAttribute(
  "position", new BufferAttribute(galaxyPosition, 3)
)
galaxyGeometry.setAttribute(
  "size", new BufferAttribute(galaxySize, 1)
)
galaxyGeometry.setAttribute(
  "seed", new BufferAttribute(galaxySeed, 3)
)



// ------------------------ //
// PLANET TARGET (for galaxy→planet morph)

const planetRadius = 1.0

const galaxyTargetPosition = new Float32Array(count * 3)
const galaxyTargetColor = new Float32Array(count * 3)

// Procedural continent noise on a sphere
function continentNoise(theta, phi) {
  return (
    Math.sin(theta * 1.5 + 0.3) * Math.cos(phi * 2.0 + 1.7) * 0.40 +
    Math.sin(theta * 3.7 + 2.1) * Math.cos(phi * 2.3 + 4.2) * 0.25 +
    Math.sin(theta * 7.2 + 5.3) * Math.sin(phi * 5.1 + 3.9) * 0.15 +
    Math.cos(theta * 11.0 - phi * 8.0 + 1.1) * 0.10 +
    Math.sin((theta + phi) * 4.3 + 6.7) * 0.10
  )
}
const coastlineThreshold = 0.0
const coastlineWidth = 0.18

for (let i = 0; i < count; i++) {
  const u = galaxySeed[i * 3]
  const v = galaxySeed[i * 3 + 1]
  const w = galaxySeed[i * 3 + 2]

  const theta = u * Math.PI * 2
  const phi = Math.acos(2 * v - 1)

  // No terrain noise — smooth sphere
  const r = planetRadius

  galaxyTargetPosition[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
  galaxyTargetPosition[i * 3 + 1] = r * Math.cos(phi)
  galaxyTargetPosition[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

  // Continent-based coloring: white coastline on dark globe
  const nv = continentNoise(theta, phi)
  const distToCoast = Math.abs(nv - coastlineThreshold)

  if (distToCoast < coastlineWidth) {
    // Coastline — bright white
    galaxyTargetColor[i * 3]     = 1.0
    galaxyTargetColor[i * 3 + 1] = 1.0
    galaxyTargetColor[i * 3 + 2] = 1.0
  } else if (nv > coastlineThreshold + coastlineWidth) {
    // Land — faint blue-green
    galaxyTargetColor[i * 3]     = 0.04 + w * 0.04
    galaxyTargetColor[i * 3 + 1] = 0.10 + w * 0.06
    galaxyTargetColor[i * 3 + 2] = 0.06 + w * 0.04
  } else {
    // Ocean — very dark blue, slightly visible
    galaxyTargetColor[i * 3]     = 0.01 + w * 0.02
    galaxyTargetColor[i * 3 + 1] = 0.01 + w * 0.02
    galaxyTargetColor[i * 3 + 2] = 0.06 + w * 0.04
  }
}

galaxyGeometry.setAttribute(
  "aTargetPosition", new BufferAttribute(galaxyTargetPosition, 3)
)
galaxyGeometry.setAttribute(
  "aTargetColor", new BufferAttribute(galaxyTargetColor, 3)
)



// ------------------------ //
// GALAXY MATERIAL

const innColor = new Color("#f40")
const outColor = new Color("#a7f")

const morphUniform = { value: 0 }
const planetRotUniform = { value: 0 }

const galaxyMaterial = new RawShaderMaterial({

  uniforms: {
    uTime: { value: 0 },
    uSize: { value: renderer.getPixelRatio() },
    uBranches: { value: 2 },
    uRadius: { value: 0 },
    uSpin: { value: Math.PI * 0.25 },
    uRandomness: { value: 0 },
    uAlphaMap: { value: alphaMap },
    uColorInn: { value: innColor },
    uColorOut: { value: outColor },
    uMorphProgress: morphUniform,
    uPlanetRotation: planetRotUniform,
  },

  vertexShader:
`
precision highp float;

attribute vec3 position;
attribute float size;
attribute vec3 seed;
attribute vec3 aTargetPosition;
attribute vec3 aTargetColor;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float uTime;
uniform float uSize;
uniform float uBranches;
uniform float uRadius;
uniform float uSpin;
uniform float uRandomness;
uniform float uMorphProgress;
uniform float uPlanetRotation;

varying float vDistance;
varying vec3 vTargetColor;
varying float vMorphProgress;

#define PI  3.14159265359
#define PI2 6.28318530718

#include <random, scatter>



void main() {

  vec3 p = position;
  float st = sqrt(p.x);
  float qt = p.x * p.x;
  float mt = mix(st, qt, p.x);

  // Offset positions by spin (farther wider) and branch num
  float angle = qt * uSpin * (2.0 - sqrt(1.0 - qt));
  float branchOffset = (PI2 / uBranches) * floor(seed.x * uBranches);
  p.x = position.x * cos(angle + branchOffset) * uRadius;
  p.z = position.x * sin(angle + branchOffset) * uRadius;

  // Scatter positions & scale down by Y-axis
  p += scatter(seed) * random(seed.zx) * uRandomness * mt;
  p.y *= 0.5 + qt * 0.5;

  // Rotate (center faster)
  vec3 temp = p;
  float ac = cos(-uTime * (2.0 - st) * 0.5);
  float as = sin(-uTime * (2.0 - st) * 0.5);
  p.x = temp.x * ac - temp.z * as;
  p.z = temp.x * as + temp.z * ac;

  // === MORPH: galaxy → planet ===
  float morphT = uMorphProgress;
  float twistAngle = (1.0 - morphT) * length(p) * 8.0 * morphT;
  float cTwist = cos(twistAngle);
  float sTwist = sin(twistAngle);
  vec3 twisted = p;
  twisted.x = p.x * cTwist - p.z * sTwist;
  twisted.z = p.x * sTwist + p.z * cTwist;

  // Planet self-rotation (counter-clockwise around Y)
  float pr = uPlanetRotation * morphT;
  float cpr = cos(pr);
  float spr = sin(pr);
  vec3 rotatedTarget = vec3(
    aTargetPosition.x * cpr - aTargetPosition.z * spr,
    aTargetPosition.y,
    aTargetPosition.x * spr + aTargetPosition.z * cpr
  );

  p = mix(twisted, rotatedTarget, morphT);

  vTargetColor = aTargetColor;
  vMorphProgress = morphT;
  // === END MORPH ===

  vDistance = mt;

  vec4 mvp = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvp;
  float galaxyPtSize = (10.0 * size * uSize) / -mvp.z;
  float planetPtSize = (10.0 * uSize) / -mvp.z;
  gl_PointSize = mix(galaxyPtSize, planetPtSize, morphT);
}
`,

  fragmentShader:
`
precision highp float;

uniform vec3 uColorInn;
uniform vec3 uColorOut;
uniform sampler2D uAlphaMap;

varying float vDistance;
varying vec3 vTargetColor;
varying float vMorphProgress;

#define PI  3.14159265359



void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a = texture2D(uAlphaMap, uv).g;
  if (a < 0.1) discard;

  vec3 color = mix(uColorInn, uColorOut, vDistance);
  float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
  color = max(color, vec3(c));

  // Morph to planet color
  color = mix(color, vTargetColor, vMorphProgress);

  gl_FragColor = vec4(color, a);
}
`,

  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: AdditiveBlending,
})



const galaxy = new Points(galaxyGeometry, galaxyMaterial)
galaxy.material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <random, scatter>", shaderUtils)
}
scene.add(galaxy)
galaxy.position.set(0, 1, 0)

// ------------------------ //
// UNIVERSE

const universeGeometry = new BufferGeometry()

const universePosition = new Float32Array(count * 3 / 2)
const universeSeed = new Float32Array(count * 3 / 2)
const universeSize = new Float32Array(count / 2)

for (let i = 0; i < count / 2; i++) {
  universeSeed[i * 3 + 0] = Math.random()
  universeSeed[i * 3 + 1] = Math.random()
  universeSeed[i * 3 + 2] = Math.random()
  universeSize[i] = Math.random() * 2 + 0.5
}

universeGeometry.setAttribute(
  "position", new BufferAttribute(universePosition, 3)
)
universeGeometry.setAttribute(
  "seed", new BufferAttribute(universeSeed, 3)
)
universeGeometry.setAttribute(
  "size", new BufferAttribute(universeSize, 1)
)



// ------------------------ //
// RING TARGET (for universe→ring morph)

const uniCount = count / 2
const universeTargetPosition = new Float32Array(uniCount * 3)
const universeTargetColor = new Float32Array(uniCount * 3)
const ringInner = 1.08
const ringOuter = 1.35
const ringTilt = 0.5
const ringThickness = 0.12

for (let i = 0; i < uniCount; i++) {
  const u = universeSeed[i * 3]
  const v = universeSeed[i * 3 + 1]
  const w = universeSeed[i * 3 + 2]

  // Ring: bright blue-white disc
  const angle = u * Math.PI * 2
  const radius = ringInner + v * (ringOuter - ringInner)
  const thickness = (w - 0.5) * ringThickness

  const x = radius * Math.cos(angle)
  const z = radius * Math.sin(angle)

  universeTargetPosition[i * 3]     = x * Math.cos(ringTilt) - thickness * Math.sin(ringTilt)
  universeTargetPosition[i * 3 + 1] = x * Math.sin(ringTilt) + thickness * Math.cos(ringTilt)
  universeTargetPosition[i * 3 + 2] = z

  const brightness = 0.4 + 0.6 * Math.max(0, 1.0 - (radius - ringInner) / (ringOuter - ringInner))
  universeTargetColor[i * 3]     = 0.8 * brightness
  universeTargetColor[i * 3 + 1] = 0.8 * brightness
  universeTargetColor[i * 3 + 2] = 1.0 * brightness
}

universeGeometry.setAttribute(
  "aTargetPosition", new BufferAttribute(universeTargetPosition, 3)
)
universeGeometry.setAttribute(
  "aTargetColor", new BufferAttribute(universeTargetColor, 3)
)



const universeMaterial = new RawShaderMaterial({

  uniforms: {
    uTime: { value: 0 },
    uSize: galaxyMaterial.uniforms.uSize,
    uRadius: galaxyMaterial.uniforms.uRadius,
    uAlphaMap: galaxyMaterial.uniforms.uAlphaMap,
    uMorphProgress: morphUniform,
    uPlanetRotation: planetRotUniform,
  },

  vertexShader:
`
precision highp float;

attribute vec3 seed;
attribute float size;
attribute vec3 aTargetPosition;
attribute vec3 aTargetColor;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float uTime;
uniform float uSize;
uniform float uRadius;
uniform float uMorphProgress;
uniform float uPlanetRotation;

varying vec3 vTargetColor;
varying float vMorphProgress;

#define PI  3.14159265359
#define PI2 6.28318530718

#include <random, scatter>

// Universe size factor
const float r = 3.0;
// Scale universe sphere
const vec3 s = vec3(2.1, 1.3, 2.1);



void main() {

  vec3 p = scatter(seed) * r * s;

  // Sweep to center
  float q = random(seed.zx);
  for (int i = 0; i < 3; i++) q *= q;
  p *= q;

  // Sweep to surface
  float l = length(p) / (s.x * r);
  p = l < 0.001 ? (p / l) : p;

  // Rotate (center faster)
  vec3 temp = p;
  float ql = 1.0 - l;
  for (int i = 0; i < 3; i++) ql *= ql;
  float ac = cos(-uTime * ql);
  float as = sin(-uTime * ql);
  p.x = temp.x * ac - temp.z * as;
  p.z = temp.x * as + temp.z * ac;

  // === MORPH: universe → ring ===
  float morphT = uMorphProgress;
  float pr = uPlanetRotation * morphT;
  float cpr = cos(pr);
  float spr = sin(pr);
  vec3 rotatedTarget = vec3(
    aTargetPosition.x * cpr - aTargetPosition.z * spr,
    aTargetPosition.y,
    aTargetPosition.x * spr + aTargetPosition.z * cpr
  );
  p = mix(p, rotatedTarget, morphT);
  vTargetColor = aTargetColor;
  vMorphProgress = morphT;
  // === END MORPH ===

  vec4 mvp = modelViewMatrix * vec4(p * uRadius, 1.0);
  gl_Position = projectionMatrix * mvp;

  // Scale up core stars
  l = (2.0 - l) * (2.0 - l);

  float uniPtSize = (r * size * uSize * l) / -mvp.z;
  float ringPtSize = (8.0 * uSize) / -mvp.z;
  gl_PointSize = mix(uniPtSize, ringPtSize, morphT);
}
`,

  fragmentShader:
`
precision highp float;

uniform sampler2D uAlphaMap;

varying vec3 vTargetColor;
varying float vMorphProgress;

#define PI 3.14159265359

void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a = texture2D(uAlphaMap, uv).g;
  if (a < 0.1) discard;

  vec3 color = mix(vec3(1.0), vTargetColor, vMorphProgress);
  float alpha = mix(a, a * 0.6, vMorphProgress);

  gl_FragColor = vec4(color, alpha);
}
`,

  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: AdditiveBlending,
})



const universe = new Points(universeGeometry, universeMaterial)
universe.material.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <random, scatter>", shaderUtils)
}
scene.add(universe)
universe.position.set(0, 1, 0)


const u = galaxyMaterial.uniforms



// ------------------------ //
// ANIMATION

new TWEEN.Tween({
  radius: 0,
  spin: 0,
  randomness: 0,
  rotate: 0,
}).to({
  radius: 1.618,
  spin: Math.PI * 2,
  randomness: 0.5,
  rotate: Math.PI * 4,
})
.duration(3000)
.easing(TWEEN.Easing.Cubic.InOut)
.onUpdate(({ radius, spin, randomness, rotate }) => {
  u.uRadius.value = radius
  u.uSpin.value = spin
  u.uRandomness.value = randomness

  galaxy.rotation.y = rotate
  universe.rotation.y = rotate / 3
})
.start()



// ------------------------ //
// LOOPER

const t = 0.001
renderer.setAnimationLoop(() => {
  galaxyMaterial.uniforms.uTime.value += t / 2
  universeMaterial.uniforms.uTime.value += t / 3
  planetRotUniform.value += t * 0.35
  TWEEN.update()
  renderer.render(scene, camera)
})



// ------------------------ //
// HELPERS

addEventListener("resize", () => {
  const size = getCanvasSize()
  camera.aspect = size.width / size.height
  camera.updateProjectionMatrix()
  renderer.setSize(size.width, size.height, false)
})

const shaderUtils =
`
float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 scatter (vec3 seed) {
  float u = random(seed.xy);
  float v = random(seed.yz);
  float theta = u * 6.28318530718;
  float phi = acos(2.0 * v - 1.0);

  float sinTheta = sin(theta);
  float cosTheta = cos(theta);
  float sinPhi = sin(phi);
  float cosPhi = cos(phi);

  float x = sinPhi * cosTheta;
  float y = sinPhi * sinTheta;
  float z = cosPhi;

  return vec3(x, y, z);
}
`

// ------------------------ //
// MAGIC BUTTON

const magicBtn = document.createElement('button')
magicBtn.textContent = 'Magic ✦'
magicBtn.className = 'magic-btn'

const btnStyle = document.createElement('style')
btnStyle.textContent = `
.magic-btn {
  display: none;
  background: #fff;
  color: #000;
  border: none;
  padding: 10px 32px;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 20px;
  opacity: 0;
  position: relative;
  z-index: 10;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.magic-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}
.magic-btn:active {
  transform: translateY(0);
}
`
document.head.appendChild(btnStyle)

const headerText = document.querySelector('.header-text')
if (headerText) headerText.appendChild(magicBtn)

// Show button after initial galaxy unfold animation
setTimeout(() => {
  magicBtn.style.display = 'inline-block'
  new TWEEN.Tween({ o: 0 })
    .to({ o: 1 }, 600)
    .easing(TWEEN.Easing.Cubic.Out)
    .onUpdate(({ o }) => { magicBtn.style.opacity = o })
    .start()
}, 3200)

let isMorphed = false

magicBtn.addEventListener('click', () => {
  const target = isMorphed ? 0 : 1
  const start = morphUniform.value

  new TWEEN.Tween({ p: start })
    .to({ p: target }, 2200)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate(({ p }) => { morphUniform.value = p })
    .start()

  isMorphed = !isMorphed
  magicBtn.textContent = isMorphed ? 'Return ✦' : 'Magic ✦'
})
