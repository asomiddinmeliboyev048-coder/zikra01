"use client";

import { useEffect, useRef } from "react";

type Mood = "idle" | "speaking" | "thinking" | "amused" | "surprised" | "playful-angry" | "skeptical";
type Props = { speaking: boolean; listening: boolean; voiceLevel: number; mood: Mood; ready: boolean; error?: string };

declare global {
  interface Window { THREE?: any; }
}

export default function Ziyo3DCharacter({ speaking, listening, voiceLevel, mood, ready, error }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const liveRef = useRef({ speaking, listening, voiceLevel, mood });
  liveRef.current = { speaking, listening, voiceLevel, mood };

  useEffect(() => {
    const host = mountRef.current;
    const THREE = window.THREE;
    if (!ready || !host || !THREE) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 2.45, 9.2);
    camera.lookAt(0, 1.85, 0);

    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else renderer.outputEncoding = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe8fffb, 0x203c45, 2.05));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(-3.5, 6, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(0x27d6b2, 2.2, 12);
    rim.position.set(3.5, 3.4, -2);
    scene.add(rim);
    const fill = new THREE.PointLight(0xa9c8ff, 1.1, 12);
    fill.position.set(-4, 1.5, 3);
    scene.add(fill);

    const character = new THREE.Group();
    scene.add(character);
    const body = new THREE.Group();
    character.add(body);
    const head = new THREE.Group();
    head.position.set(0, 2.52, 0.08);
    character.add(head);

    const mat = (color: number, roughness = 0.78, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const fur = mat(0xfff4e9, 0.86);
    const furLight = mat(0xffffff, 0.8);
    const innerEar = mat(0xf2a9ad, 0.75);
    const green = mat(0x087d6d, 0.52);
    const greenLight = mat(0x20c6a3, 0.42, 0.08);
    const dark = mat(0x102a36, 0.42);
    const eyeWhite = mat(0xffffff, 0.2);
    const iris = mat(0x168c70, 0.24);
    const pupil = mat(0x071b20, 0.12);
    const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const noseMat = mat(0xf18e9b, 0.42);
    const mouthMat = mat(0x5d2835, 0.62);
    const tongueMat = mat(0xf08d9b, 0.58);
    const gold = mat(0xe8c77b, 0.3, 0.62);

    function sphere(parent: any, name: string, position: number[], scale: number[], material: any, segments = 32) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(16, Math.floor(segments * 0.7))), material);
      mesh.name = name;
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function cylinder(parent: any, name: string, position: number[], radiusTop: number, radiusBottom: number, height: number, material: any, rotationZ = 0) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24), material);
      mesh.name = name;
      mesh.position.set(position[0], position[1], position[2]);
      mesh.rotation.z = rotationZ;
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }

    // Rounded hoodie torso, sleeves and paws.
    sphere(body, "hoodie-body", [0, 0.93, 0], [0.88, 0.98, 0.62], green);
    sphere(body, "hood-back", [0, 1.45, -0.28], [0.78, 0.75, 0.42], dark);
    sphere(body, "hood-inner", [0, 1.49, 0.03], [0.56, 0.53, 0.12], greenLight);
    sphere(body, "hoodie-pocket", [0, 0.62, 0.57], [0.43, 0.22, 0.09], dark);
    sphere(body, "logo-disc", [0, 1.02, 0.625], [0.18, 0.18, 0.045], gold);
    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.025), furLight);
    logo.position.set(0, 1.02, 0.672);
    logo.rotation.z = -0.72;
    body.add(logo);
    const arms: any[] = [];
    [-1, 1].forEach((side) => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.72, 1.28, 0.02);
      arm.rotation.z = side * -0.38;
      body.add(arm);
      cylinder(arm, "hoodie-sleeve", [side * 0.17, -0.29, 0], 0.2, 0.24, 0.72, green, side * -0.08);
      sphere(arm, "paw", [side * 0.2, -0.72, 0.02], [0.19, 0.2, 0.18], fur);
      arms.push(arm);
    });
    [-1, 1].forEach((side) => {
      cylinder(body, "leg", [side * 0.32, -0.03, 0], 0.24, 0.28, 0.64, green);
      sphere(body, "foot", [side * 0.32, -0.38, 0.13], [0.29, 0.16, 0.36], fur);
    });

    // A fluffy curved tail, built as a smooth 3D tube.
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.58, 0.35, -0.38),
      new THREE.Vector3(1.02, 0.1, -0.48),
      new THREE.Vector3(1.23, 0.45, -0.48),
      new THREE.Vector3(1.12, 0.86, -0.4),
      new THREE.Vector3(0.88, 0.9, -0.28),
    ]);
    const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 36, 0.17, 12, false), fur);
    tail.castShadow = true;
    body.add(tail);
    sphere(body, "tail-tip", [0.88, 0.9, -0.28], [0.18, 0.2, 0.18], furLight);

    // Oversized soft kitten head and upright ears.
    sphere(head, "head", [0, 0, 0], [1.08, 0.98, 0.88], fur);
    [-1, 1].forEach((side) => {
      const ear = new THREE.Group();
      ear.position.set(side * 0.73, 0.72, -0.02);
      ear.rotation.z = side * -0.22;
      head.add(ear);
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.94, 36), fur);
      outer.position.y = 0.28;
      outer.scale.set(1, 1, 0.62);
      outer.castShadow = true;
      ear.add(outer);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 32), innerEar);
      inner.position.set(0, 0.31, 0.17);
      inner.scale.set(1, 1, 0.25);
      ear.add(inner);
    });

    // Face: cheeks, muzzle, button nose, expressive eyes and brows.
    sphere(head, "left-muzzle", [-0.22, -0.34, 0.76], [0.39, 0.27, 0.2], furLight);
    sphere(head, "right-muzzle", [0.22, -0.34, 0.76], [0.39, 0.27, 0.2], furLight);
    sphere(head, "nose", [0, -0.22, 0.96], [0.12, 0.085, 0.075], noseMat);
    const eyes: any[] = [];
    [-1, 1].forEach((side) => {
      const eye = new THREE.Group();
      eye.position.set(side * 0.42, 0.13, 0.77);
      head.add(eye);
      sphere(eye, "eye-white", [0, 0, 0], [0.235, 0.29, 0.12], eyeWhite);
      sphere(eye, "iris", [side * 0.015, -0.015, 0.105], [0.145, 0.19, 0.065], iris);
      sphere(eye, "pupil", [side * 0.015, -0.005, 0.157], [0.083, 0.13, 0.035], pupil);
      sphere(eye, "eye-glint", [-0.035, 0.07, 0.19], [0.045, 0.055, 0.022], shine, 20);
      eyes.push(eye);
      const brow = sphere(head, "brow", [side * 0.43, 0.49, 0.79], [0.22, 0.045, 0.055], mat(0x5b514e, 0.85));
      brow.rotation.z = side * -0.12;
    });
    const mouth = sphere(head, "mouth", [0, -0.48, 0.91], [0.18, 0.11, 0.055], mouthMat);
    sphere(head, "tongue", [0, -0.545, 0.955], [0.105, 0.045, 0.018], tongueMat);

    // Zikra-green headphones and a soft curved headband.
    const bandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.86, 0.12, -0.12),
      new THREE.Vector3(-0.82, 0.82, -0.08),
      new THREE.Vector3(-0.42, 1.13, -0.04),
      new THREE.Vector3(0, 1.2, -0.02),
      new THREE.Vector3(0.42, 1.13, -0.04),
      new THREE.Vector3(0.82, 0.82, -0.08),
      new THREE.Vector3(0.86, 0.12, -0.12),
    ]);
    const band = new THREE.Mesh(new THREE.TubeGeometry(bandCurve, 48, 0.075, 12, false), greenLight);
    band.castShadow = true;
    head.add(band);
    [-1, 1].forEach((side) => {
      sphere(head, "headphone-cup", [side * 0.91, -0.03, 0.05], [0.18, 0.28, 0.2], dark);
      sphere(head, "headphone-ring", [side * 0.93, -0.03, 0.18], [0.13, 0.22, 0.07], greenLight);
    });

    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.45, 64), new THREE.MeshBasicMaterial({ color: 0x31d3b0, transparent: true, opacity: 0.075 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.53, -0.5);
    scene.add(floor);

    const clock = new THREE.Clock();
    let frame = 0;
    let width = 0;
    let height = 0;
    let blinkUntil = 0;
    let nextBlink = 1.7;
    const resize = () => {
      if (!host) return;
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host);
    resize();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const state = liveRef.current;
      const activeMood = state.mood;
      body.position.y = Math.sin(time * 1.9) * 0.035;
      body.rotation.z = Math.sin(time * 0.8) * 0.012;
      head.rotation.y = (state.listening ? Math.sin(time * 1.5) * 0.075 : Math.sin(time * 0.75) * 0.025);
      head.rotation.z = activeMood === "thinking" ? Math.sin(time * 1.7) * 0.075 : state.speaking ? Math.sin(time * 6) * 0.018 : Math.sin(time * 0.9) * 0.012;
      head.rotation.x = state.speaking ? Math.sin(time * 7.5) * 0.018 : 0;
      arms[0].rotation.z = -0.38 + Math.sin(time * 1.3) * 0.025;
      arms[1].rotation.z = 0.38 + Math.sin(time * 1.3 + 0.8) * 0.025;
      tail.rotation.x = Math.sin(time * 2.2) * 0.11;
      tail.rotation.z = Math.sin(time * 2.8) * 0.16;

      if (time > nextBlink) {
        blinkUntil = time + 0.13;
        nextBlink = time + 2.8 + Math.random() * 2.4;
      }
      const blinking = time < blinkUntil;
      eyes.forEach((eye) => { eye.scale.y = blinking ? 0.08 : 1; });
      const mouthOpen = state.speaking ? 0.2 + Math.min(1, Math.max(0, state.voiceLevel)) * 1.35 : activeMood === "amused" ? 0.32 : activeMood === "surprised" ? 0.65 : 0.08;
      mouth.scale.y = mouthOpen;
      mouth.scale.x = state.speaking ? 0.18 + Math.min(1, state.voiceLevel) * 0.035 : 0.18;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      scene.traverse((object: any) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material: any) => material.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [ready]);

  const label = speaking ? "Ziyo gapiryapti" : listening ? "Sizni tinglayapman" : mood === "thinking" ? "O‘ylayapman…" : "Sizning AI ustozingiz";
  return (
    <div className={"ziyo-three-character ziyo-three-" + (speaking ? "speaking" : listening ? "listening" : mood)} role="img" aria-label={label}>
      <div className="ziyo-three-halo"/>
      <div ref={mountRef} className="ziyo-three-canvas"/>
      {!ready && <div className="ziyo-three-loading"><span/>Ziyo 3D sahnasi yuklanmoqda…</div>}
      {ready && !window.THREE && <div className="ziyo-three-loading">3D modul yuklanmadi. Sahifani yangilang.</div>}
      <div className="ziyo-three-status"><i/>{label}</div>
    </div>
  );
}
