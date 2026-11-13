import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export type HairStyleType = "fade" | "afro" | "buzz" | "braids" | "waves";
export type FacialHairType = "none" | "stubble" | "goatee" | "beard";

export interface PlayerLikenessPreset {
  skinHex: number;
  hairStyle: HairStyleType;
  facialHair: FacialHairType;
  heightScale: number;
  buildScale: number;
  hairHex?: number;
  headband?: boolean;
  sleeveArm?: "R" | "L" | "none";
}

export const LIKENESS_PRESETS: Record<string, PlayerLikenessPreset> = {
  Jordan: { skinHex: 0x6f4324, hairStyle: "buzz", facialHair: "goatee", heightScale: 1.0, buildScale: 1.02, sleeveArm: "L" },
  Bryant: { skinHex: 0x7c4a27, hairStyle: "buzz", facialHair: "goatee", heightScale: 1.0, buildScale: 0.98, sleeveArm: "R" },
  James: { skinHex: 0x693f21, hairStyle: "fade", facialHair: "beard", heightScale: 1.05, buildScale: 1.12, headband: true, sleeveArm: "R" },
  Curry: { skinHex: 0xd9a16c, hairStyle: "fade", facialHair: "goatee", heightScale: 0.96, buildScale: 0.94, sleeveArm: "R" },
  Durant: { skinHex: 0x704223, hairStyle: "buzz", facialHair: "beard", heightScale: 1.08, buildScale: 0.93, sleeveArm: "none" },
  "O'Neal": { skinHex: 0x5d3519, hairStyle: "buzz", facialHair: "goatee", heightScale: 1.1, buildScale: 1.22, sleeveArm: "none" },
  Bird: { skinHex: 0xf1c27d, hairStyle: "waves", facialHair: "stubble", heightScale: 1.04, buildScale: 1.0, sleeveArm: "none" },
  Magic: { skinHex: 0x7b4a26, hairStyle: "fade", facialHair: "stubble", heightScale: 1.04, buildScale: 1.03, sleeveArm: "none" },
  Barkley: { skinHex: 0x6e4223, hairStyle: "buzz", facialHair: "goatee", heightScale: 1.0, buildScale: 1.16, sleeveArm: "none" },
  Pippen: { skinHex: 0x62391d, hairStyle: "fade", facialHair: "goatee", heightScale: 1.03, buildScale: 1.0, sleeveArm: "none" },
  Johnson: { skinHex: 0x8d5524, hairStyle: "fade", facialHair: "stubble", heightScale: 0.98, buildScale: 0.98, sleeveArm: "R" },
  Miller: { skinHex: 0xc68642, hairStyle: "waves", facialHair: "none", heightScale: 1.01, buildScale: 0.97, sleeveArm: "R" },
  Davis: { skinHex: 0x6c4022, hairStyle: "braids", facialHair: "beard", heightScale: 1.06, buildScale: 1.08, sleeveArm: "R" },
  Thompson: { skinHex: 0xcf945b, hairStyle: "afro", facialHair: "beard", heightScale: 1.04, buildScale: 1.02, headband: true, sleeveArm: "none" },
};

export function getLikenessPreset(name: string, idx: number): PlayerLikenessPreset {
  if (LIKENESS_PRESETS[name]) return LIKENESS_PRESETS[name];
  const skins = [0x8d5524, 0xc68642, 0xf1c27d, 0x5c3818, 0xe0ac69];
  const styles: HairStyleType[] = ["fade", "afro", "buzz", "braids", "waves"];
  const facials: FacialHairType[] = ["none", "stubble", "goatee", "beard"];
  return {
    skinHex: skins[idx % skins.length],
    hairStyle: styles[idx % styles.length],
    facialHair: facials[idx % facials.length],
    heightScale: 0.97 + (idx % 4) * 0.025,
    buildScale: 0.96 + (idx % 3) * 0.04,
    sleeveArm: idx % 2 === 0 ? "R" : "none",
  };
}

/**
 * Generates procedural micro-weave + cloth wrinkle bump texture for NBA jerseys & shorts.
 */
export function createJerseyFabricBumpTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, 256, 256);
    // Athletic breathable mesh weave
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        g.fillStyle = (x + y) % 8 === 0 ? "#a4a4a4" : "#5e5e5e";
        g.fillRect(x, y, 2, 2);
      }
    }
    // Subtle diagonal drape & fabric wrinkle folds
    g.strokeStyle = "rgba(220,220,220,0.22)";
    g.lineWidth = 5;
    for (let i = -2; i < 6; i++) {
      g.beginPath();
      g.moveTo(0, i * 48);
      g.bezierCurveTo(84, i * 48 + 18, 172, i * 48 - 16, 256, i * 48 + 10);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/**
 * Generates radial contact-shadow texture so grounded players anchor firmly to the hardwood.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.56)");
    grad.addColorStop(0.55, "rgba(0, 0, 0, 0.24)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a PBR Skin MeshPhysicalMaterial enhanced via onBeforeCompile with warm
 * dermal subsurface scattering (SSS) wrap illumination and dynamic exertion sweat sheen.
 */
export function createSubsurfaceSkinMaterial(skinHex: number): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: skinHex,
    roughness: 0.56,
    metalness: 0.01,
    sheen: 0.28,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(0xff9e7d),
    clearcoat: 0.08,
    clearcoatRoughness: 0.16,
  });

  mat.userData.uSweat = { value: 0.12 };
  mat.userData.uSssTint = { value: new THREE.Color(0xd95638) };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSweat = mat.userData.uSweat;
    shader.uniforms.uSssTint = mat.userData.uSssTint;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWorldPosSSS;
        varying vec3 vWorldNormSSS;`
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vec4 wpSSS = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wpSSS = instanceMatrix * wpSSS;
        #endif
        wpSSS = modelMatrix * wpSSS;
        vWorldPosSSS = wpSSS.xyz;
        vWorldNormSSS = normalize(mat3(modelMatrix) * objectNormal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uSweat;
        uniform vec3 uSssTint;
        varying vec3 vWorldPosSSS;
        varying vec3 vWorldNormSSS;`
      )
      .replace(
        "#include <dithering_fragment>",
        `
        vec3 sssViewDir = normalize(cameraPosition - vWorldPosSSS);
        vec3 sssNorm = normalize(vWorldNormSSS);
        float rimWrap = pow(1.0 - max(0.0, dot(sssViewDir, sssNorm)), 2.2);
        float upBounce = clamp(sssNorm.y * 0.5 + 0.5, 0.0, 1.0);
        // Warm dermal subsurface bleed on grazing arena light edges
        gl_FragColor.rgb += uSssTint * (rimWrap * 0.14 + upBounce * 0.045) * diffuseColor.rgb;
        // Sweat specular micro-bead gleam on exertion
        float sweatSpec = pow(max(0.0, dot(reflect(-vec3(0.18, 0.95, 0.22), sssNorm), sssViewDir)), 28.0);
        gl_FragColor.rgb += vec3(1.0, 0.96, 0.9) * sweatSpec * (0.08 + uSweat * 0.34);
        #include <dithering_fragment>`
      );
  };
  mat.customProgramCacheKey = () => "nba2k-sss-sweat-skin-v1";
  return mat;
}

export function updateSkinExertion(mat: THREE.Material | undefined, exertion01: number): void {
  if (!mat) return;
  const phys = mat as THREE.MeshPhysicalMaterial;
  const clamped = Math.max(0, Math.min(1, exertion01));
  if (typeof phys.clearcoat === "number") {
    phys.clearcoat = 0.08 + clamped * 0.52;
    phys.clearcoatRoughness = 0.24 - clamped * 0.11;
    phys.roughness = 0.56 - clamped * 0.14;
  }
  if (phys.userData?.uSweat) {
    phys.userData.uSweat.value = clamped;
  }
}

/**
 * Creates a PBR Jersey / Shorts MeshPhysicalMaterial with cloth sheen, weave bump,
 * and subtle sprint-driven cloth ripple.
 */
export function createJerseyClothMaterial(
  colorHex: number,
  sheenHex: number,
  bumpMap: THREE.Texture,
  isShorts = false
): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: isShorts ? 0.62 : 0.56,
    metalness: 0.02,
    bumpMap,
    bumpScale: 0.008,
    sheen: 0.85,
    sheenRoughness: 0.44,
    sheenColor: new THREE.Color(sheenHex),
  });
  mat.userData.uClothTime = { value: 0 };
  mat.userData.uClothSpeed = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uClothTime = mat.userData.uClothTime;
    shader.uniforms.uClothSpeed = mat.userData.uClothSpeed;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uClothTime;
        uniform float uClothSpeed;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float hemMask = smoothstep(0.28, -0.22, position.y);
        float flutter = sin(position.x * 16.0 + uClothTime * 10.5) * cos(position.z * 14.0 + uClothTime * 8.0);
        transformed.z += flutter * hemMask * uClothSpeed * 0.011;
        transformed.x += flutter * hemMask * uClothSpeed * 0.006;`
      );
  };
  mat.customProgramCacheKey = () => "nba2k-jersey-cloth-v1";
  return mat;
}

/**
 * Builds layered strand/card-based hair geometry on top of headGroup rather than a single cap primitive.
 */
export function buildStrandHairGroup(
  style: HairStyleType,
  hairHex = 0x151210
): THREE.Group {
  const group = new THREE.Group();
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: hairHex,
    roughness: 0.64,
    metalness: 0.02,
    sheen: 0.48,
    sheenRoughness: 0.52,
    sheenColor: new THREE.Color(0x3a322d),
  });

  if (style === "buzz") {
    const base = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    base.position.set(0, 0.015, -0.012);
    group.add(base);
    return group;
  }

  if (style === "fade") {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    cap.position.set(0, 0.02, -0.012);
    group.add(cap);
    // Layered textured fade curls on top crown
    const tuftGeo = new THREE.SphereGeometry(0.028, 8, 6);
    for (let ix = -3; ix <= 3; ix++) {
      for (let iz = -3; iz <= 2; iz++) {
        if (ix * ix + iz * iz > 11) continue;
        const tuft = new THREE.Mesh(tuftGeo, hairMat);
        tuft.position.set(ix * 0.025, 0.128 + ((Math.abs(ix + iz) % 2) * 0.008), iz * 0.024 - 0.008);
        tuft.scale.set(1.0, 0.85, 1.0);
        group.add(tuft);
      }
    }
    return group;
  }

  if (style === "afro") {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.145, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    core.position.set(0, 0.028, -0.016);
    group.add(core);
    const curlGeo = new THREE.DodecahedronGeometry(0.036, 0);
    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(1 - (i + 0.5) / 28);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.136;
      const curl = new THREE.Mesh(curlGeo, hairMat);
      curl.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        0.03 + r * Math.cos(phi),
        -0.016 + r * Math.sin(phi) * Math.sin(theta)
      );
      if (curl.position.y > 0.02) group.add(curl);
    }
    return group;
  }

  if (style === "braids") {
    const scalp = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    scalp.position.set(0, 0.016, -0.012);
    group.add(scalp);
    // 7 distinct braided rows sweeping front-to-back with hanging tips
    const strandGeo = new THREE.CapsuleGeometry(0.016, 0.16, 4, 8);
    const tipGeo = new THREE.CapsuleGeometry(0.013, 0.07, 4, 6);
    for (let row = -3; row <= 3; row++) {
      const rx = row * 0.032;
      const strand = new THREE.Mesh(strandGeo, hairMat);
      strand.position.set(rx, 0.115 - Math.abs(row) * 0.012, -0.025);
      strand.rotation.x = Math.PI * 0.44;
      group.add(strand);
      const tip = new THREE.Mesh(tipGeo, hairMat);
      tip.position.set(rx * 1.05, 0.035, -0.135);
      tip.rotation.x = 0.35;
      group.add(tip);
    }
    return group;
  }

  // "waves" — layered swept hair cards
  const waveBase = new THREE.Mesh(
    new THREE.SphereGeometry(0.136, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.54),
    hairMat
  );
  waveBase.position.set(0, 0.02, -0.015);
  group.add(waveBase);
  const cardGeo = new THREE.CapsuleGeometry(0.024, 0.13, 4, 8);
  for (let i = -2; i <= 2; i++) {
    const card = new THREE.Mesh(cardGeo, hairMat);
    card.position.set(i * 0.04, 0.125 - Math.abs(i) * 0.01, -0.018);
    card.rotation.x = Math.PI * 0.48;
    card.rotation.z = i * 0.14;
    group.add(card);
  }
  return group;
}

export interface FacialRig {
  browL: THREE.Mesh;
  browR: THREE.Mesh;
  lidL: THREE.Mesh;
  lidR: THREE.Mesh;
  jaw: THREE.Group;
  mouthInner: THREE.Mesh;
  blinkTimer: number;
}

export function attachFacialExpressionRig(
  headGroup: THREE.Group,
  skinMat: THREE.Material,
  hairHex: number,
  facialHair: FacialHairType
): FacialRig {
  const browMat = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.85 });
  const browGeo = new THREE.BoxGeometry(0.04, 0.011, 0.016);
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(0.044, 0.046, 0.122);
  const browR = new THREE.Mesh(browGeo, browMat);
  browR.position.set(-0.044, 0.046, 0.122);
  headGroup.add(browL, browR);

  // Eyelids for natural blink + squint
  const lidGeo = new THREE.SphereGeometry(0.019, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const lidL = new THREE.Mesh(lidGeo, skinMat);
  lidL.position.set(0.044, 0.02, 0.118);
  lidL.scale.set(1, 0.15, 1);
  const lidR = new THREE.Mesh(lidGeo, skinMat);
  lidR.position.set(-0.044, 0.02, 0.118);
  lidR.scale.set(1, 0.15, 1);
  headGroup.add(lidL, lidR);

  // Articulated jaw + mouth blendshape rig for lip sync & celebrations
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.052, 0.088);
  headGroup.add(jaw);

  const lipMat = new THREE.MeshStandardMaterial({ color: 0x5c2b24, roughness: 0.55 });
  const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.01, 0.02), lipMat);
  upperLip.position.set(0, 0.008, 0.032);
  jaw.add(upperLip);

  const mouthInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.012, 0.018),
    new THREE.MeshBasicMaterial({ color: 0x220808 })
  );
  mouthInner.position.set(0, 0, 0.029);
  mouthInner.scale.set(1, 0.2, 1);
  jaw.add(mouthInner);

  const chinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), skinMat);
  chinMesh.scale.set(1.0, 0.72, 0.85);
  chinMesh.position.set(0, -0.018, 0.006);
  jaw.add(chinMesh);

  if (facialHair !== "none") {
    const beardMat = new THREE.MeshStandardMaterial({
      color: hairHex,
      roughness: 0.9,
    });
    if (facialHair === "goatee" || facialHair === "beard") {
      const goatee = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.038, 0.034), beardMat);
      goatee.position.set(0, -0.015, 0.024);
      jaw.add(goatee);
    }
    if (facialHair === "beard" || facialHair === "stubble") {
      const jawBeard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.095, facialHair === "beard" ? 0.058 : 0.038, 14, 1, false, -Math.PI * 0.42, Math.PI * 0.84),
        beardMat
      );
      jawBeard.position.set(0, -0.005, -0.01);
      jaw.add(jawBeard);
    }
  }

  return {
    browL,
    browR,
    lidL,
    lidR,
    jaw,
    mouthInner,
    blinkTimer: Math.random() * 4,
  };
}

export function updateFacialExpression(
  rig: FacialRig | undefined,
  dt: number,
  params: {
    timeSec: number;
    isSpeaking: boolean;
    hype: number;
    exertion: number;
    isDefending: boolean;
  }
): void {
  if (!rig) return;
  const { timeSec, isSpeaking, hype, exertion, isDefending } = params;

  // Periodic natural eye blink every ~3.4s
  rig.blinkTimer -= dt;
  let lidScaleY = 0.12;
  if (rig.blinkTimer <= 0) {
    if (rig.blinkTimer > -0.14) {
      lidScaleY = 1.0;
    } else {
      rig.blinkTimer = 2.6 + Math.random() * 2.2;
    }
  }
  rig.lidL.scale.y = lidScaleY;
  rig.lidR.scale.y = lidScaleY;

  // Eyebrow expression: furrowed lock-in on defense/exertion, lifted on hype/dunk
  const browTilt = isDefending ? 0.22 : hype > 0.2 ? -0.18 : exertion * 0.14;
  rig.browL.rotation.z = -browTilt;
  rig.browR.rotation.z = browTilt;
  rig.browL.position.y = 0.046 + hype * 0.008;
  rig.browR.position.y = 0.046 + hype * 0.008;

  // Lip sync & celebration mouth morph
  let openAmt = 0.15;
  if (isSpeaking) {
    const syllable = Math.abs(Math.sin(timeSec * 16.5) * Math.cos(timeSec * 7.3));
    openAmt = 0.25 + syllable * 1.45;
  } else if (hype > 0.15) {
    openAmt = 0.7 + hype * 1.1;
  } else if (exertion > 0.55) {
    // Heavy breathing mouth parting when fatigued
    openAmt = 0.22 + Math.max(0, Math.sin(timeSec * 5.2)) * 0.45 * exertion;
  }

  rig.mouthInner.scale.y = openAmt;
  rig.mouthInner.scale.x = hype > 0.2 ? 1.25 : isSpeaking ? 0.92 + Math.sin(timeSec * 12) * 0.14 : 1.0;
  rig.jaw.position.y = -0.052 - openAmt * 0.011;
}

/**
 * Vertex-animated deformable nylon basketball net with realistic damped swish physics.
 */
export interface DeformableNet {
  mesh: THREE.Mesh;
  restPos: Float32Array;
  swishTimer: number;
  swishEnergy: number;
}

export function createDeformableNet(rimRadius: number): DeformableNet {
  const radialSegs = 16;
  const heightSegs = 6;
  const height = 0.45;
  const geo = new THREE.CylinderGeometry(rimRadius * 0.96, 0.115, height, radialSegs, heightSegs, true);
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  // Taper waist realistically like an NBA braided nylon net
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const u = (height * 0.5 - y) / height; // 0 at top rim, 1 at bottom
    const pinch = 1 - Math.sin(u * Math.PI) * 0.14;
    posAttr.setXYZ(i, x * pinch, y, z * pinch);
  }
  posAttr.needsUpdate = true;
  geo.computeVertexNormals();

  const restPos = new Float32Array(posAttr.array as Float32Array);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.72,
    metalness: 0.02,
    wireframe: true,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return {
    mesh,
    restPos,
    swishTimer: 0,
    swishEnergy: 0,
  };
}

export function triggerNetSwish(net: DeformableNet | undefined, energy = 1.0): void {
  if (!net) return;
  net.swishEnergy = Math.max(net.swishEnergy, energy);
  net.swishTimer = 0;
}

export function stepDeformableNet(net: DeformableNet, dt: number): void {
  if (net.swishEnergy <= 0.005) return;
  net.swishTimer += dt;
  net.swishEnergy = Math.max(0, net.swishEnergy - dt * 0.95);
  const posAttr = net.mesh.geometry.attributes.position as THREE.BufferAttribute;
  const rest = net.restPos;
  const t = net.swishTimer;
  const amp = net.swishEnergy;

  for (let i = 0; i < posAttr.count; i++) {
    const rx = rest[i * 3];
    const ry = rest[i * 3 + 1];
    const rz = rest[i * 3 + 2];
    const u = Math.max(0, Math.min(1, (0.225 - ry) / 0.45)); // 0 pinned to rim, 1 bottom
    const pin = u * u;
    const radialWave = Math.sin(t * 16.0 - u * 4.2) * 0.11 * amp * pin;
    const whipUp = Math.max(0, Math.sin(t * 11.5 - u * 2.5)) * 0.14 * amp * pin;
    const len = Math.max(0.01, Math.hypot(rx, rz));
    posAttr.setXYZ(
      i,
      rx + (rx / len) * radialWave,
      ry + whipUp,
      rz + (rz / len) * radialWave
    );
  }
  posAttr.needsUpdate = true;
}

const BroadcastPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1.07 },
    uSaturation: { value: 1.1 },
    uWarmth: { value: 0.035 },
    uMotionBlur: { value: 0.0 },
    uVignette: { value: 0.24 },
    uFocusBlur: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uWarmth;
    uniform float uMotionBlur;
    uniform float uVignette;
    uniform float uFocusBlur;
    varying vec2 vUv;

    void main() {
      vec2 centerVec = vUv - 0.5;
      float radialDist = length(centerVec);

      // Subtle velocity radial motion blur + cinematic replay outer-edge DOF softness
      float blurAmt = uMotionBlur * radialDist * 0.018 + uFocusBlur * smoothstep(0.18, 0.72, radialDist) * 0.0045;
      vec4 col = texture2D(tDiffuse, vUv);
      if (blurAmt > 0.0002) {
        vec2 dir = radialDist > 0.001 ? normalize(centerVec) * blurAmt : vec2(0.0);
        col += texture2D(tDiffuse, vUv - dir);
        col += texture2D(tDiffuse, vUv + dir);
        col += texture2D(tDiffuse, vUv - dir * 2.0);
        col += texture2D(tDiffuse, vUv + dir * 2.0);
        col *= 0.2;
      }

      // 2K Arena Broadcast Color Grading (warm highlights, rich hardwood contrast, subtle shadow lift)
      vec3 rgb = (col.rgb - 0.5) * uContrast + 0.5;
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, uSaturation);
      rgb.r += uWarmth * smoothstep(0.35, 0.95, luma);
      rgb.b -= uWarmth * 0.35 * smoothstep(0.35, 0.95, luma);

      // Broadcast lens vignette
      float vig = smoothstep(0.35, 1.05, radialDist);
      rgb *= (1.0 - vig * uVignette);

      gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), col.a);
    }
  `,
};

export interface BroadcastComposerPipeline {
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  gradePass: ShaderPass;
  fxaaPass: ShaderPass;
  setSize: (w: number, h: number, pixelRatio: number) => void;
  updateFrame: (params: { speedBlur: number; replayDof: number }) => void;
  dispose: () => void;
}

export function createBroadcastComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
): BroadcastComposerPipeline {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = renderer.getPixelRatio();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.max(1, Math.floor(width / 2)), Math.max(1, Math.floor(height / 2))),
    0.26, // subtle arena spotlight & jumbotron bloom
    0.45,
    0.88
  );
  composer.addPass(bloomPass);

  const gradePass = new ShaderPass(BroadcastPostShader);
  composer.addPass(gradePass);

  const fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.uniforms["resolution"].value.set(1 / Math.max(1, width * pixelRatio), 1 / Math.max(1, height * pixelRatio));
  composer.addPass(fxaaPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return {
    composer,
    bloomPass,
    gradePass,
    fxaaPass,
    setSize: (w: number, h: number, pr: number) => {
      composer.setSize(w, h);
      bloomPass.resolution.set(Math.max(1, Math.floor(w / 2)), Math.max(1, Math.floor(h / 2)));
      fxaaPass.uniforms["resolution"].value.set(1 / Math.max(1, w * pr), 1 / Math.max(1, h * pr));
    },
    updateFrame: ({ speedBlur, replayDof }) => {
      gradePass.uniforms["uMotionBlur"].value = Math.max(0, Math.min(1, speedBlur));
      gradePass.uniforms["uFocusBlur"].value = Math.max(0, Math.min(1, replayDof));
    },
    dispose: () => {
      composer.dispose();
    },
  };
}
