import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FlowCanvas({ mode = "grid" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const count = 850;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * 2.4;
      positions[offset + 1] = (Math.random() - 0.5) * 1.8;
      positions[offset + 2] = 0;
      sizes[index] = Math.random() * 2.5 + 0.7;
      phases[index] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColor: {
          value: new THREE.Color(mode === "compass" ? "#D9A400" : "#E1432B"),
        },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform vec2 uPointer;
        void main() {
          vec3 nextPosition = position;
          nextPosition.x += sin(uTime * 0.32 + aPhase + position.y * 3.0) * 0.035;
          nextPosition.y += cos(uTime * 0.24 + aPhase + position.x * 2.0) * 0.025;
          float distanceToPointer = distance(nextPosition.xy, uPointer);
          nextPosition.xy += normalize(nextPosition.xy - uPointer) * max(0.0, 0.16 - distanceToPointer) * 0.12;
          gl_Position = vec4(nextPosition, 1.0);
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          if (distanceFromCenter > 0.5) discard;
          gl_FragColor = vec4(uColor, 0.16 * (1.0 - distanceFromCenter * 2.0));
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    const pointer = new THREE.Vector2();
    const startTime = performance.now();
    let animationFrame;

    function handlePointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      material.uniforms.uPointer.value.lerp(pointer, 0.15);
    }

    function resize() {
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
      material.uniforms.uTime.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("resize", resize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode]);

  return <div ref={containerRef} className="flow-canvas" aria-hidden="true" />;
}
