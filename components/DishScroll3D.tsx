"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, useGLTF, useProgress } from "@react-three/drei";
import { motion, type MotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Box } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { restaurantConfig } from "@/data/restaurant";
import type { Locale, MenuItem } from "@/types";

const MODEL_URL = "/models/signature-dish.glb";
const DRACO_PATH = "/draco/";

export type DishScroll3DProps = {
  locale: Locale;
  item: MenuItem;
  description: string;
  menuHref: string;
  reservationHref: string;
  menuLabel: string;
  reservationLabel: string;
};

type SceneMotion = {
  rotationX: MotionValue<number>;
  rotationY: MotionValue<number>;
  rotationZ: MotionValue<number>;
  modelScale: MotionValue<number>;
  modelY: MotionValue<number>;
  cameraY: MotionValue<number>;
  cameraZ: MotionValue<number>;
};

export function DishScroll3D({ locale, item, description, menuHref, reservationHref, menuLabel, reservationLabel }: DishScroll3DProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [shouldLoadModel, setShouldLoadModel] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 72, damping: 24, mass: 0.3 });

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => () => useGLTF.clear(MODEL_URL), []);

  const handleModelReady = useCallback(() => setModelReady(true), []);
  const renderActive = inView && pageVisible;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      setWebGLSupported(Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setShouldLoadModel(true);
    }, { rootMargin: "35% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const sceneMotion: SceneMotion = {
    rotationX: useTransform(progress, [0, 0.72, 1], mobile ? [-0.26, -0.12, -0.08] : [-0.3, -0.14, -0.09]),
    rotationY: useTransform(progress, [0, 0.76, 1], [-1.02, -0.08, 0.08]),
    rotationZ: useTransform(progress, [0, 0.76, 1], [0.08, 0.015, 0]),
    modelScale: useTransform(progress, [0, 0.78, 1], mobile ? [1.4, 1.57, 1.62] : [2.72, 3.24, 3.34]),
    modelY: useTransform(progress, [0, 0.75, 1], mobile ? [0.1, 0.76, 0.9] : [-0.18, 0.24, 0.34]),
    cameraY: useTransform(progress, [0, 0.8, 1], mobile ? [3.7, 4.15, 4.05] : [2.55, 3.2, 3.08]),
    cameraZ: useTransform(progress, [0, 0.8, 1], mobile ? [7.65, 6.85, 6.72] : [6.25, 5.18, 5.02]),
  };

  const copyOpacity = useTransform(scrollYProgress, [0, 0.69, 0.84, 1], reduceMotion ? [1, 1, 1, 1] : [0, 0, 1, 1]);
  const copyY = useTransform(scrollYProgress, [0, 0.7, 0.86, 1], reduceMotion ? [0, 0, 0, 0] : [52, 52, 0, -4]);
  const kickerOpacity = useTransform(scrollYProgress, [0, 0.3, 0.54, 1], reduceMotion ? [1, 1, 1, 1] : [0.25, 1, 1, 1]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const title = locale === "ja" ? item.nameJa : item.nameEn;
  const secondaryTitle = locale === "ja" ? item.nameEn : item.nameJa;

  return (
    <section
      className="dish3d-section"
      ref={sectionRef}
      aria-labelledby="dish3d-title"
      data-dish-3d-section
      data-scroll-chapter="3"
      data-model-ready={modelReady ? "true" : "false"}
      data-render-active={renderActive ? "true" : "false"}
      data-reduced-motion={reduceMotion ? "true" : "false"}
    >
      <div className="dish3d-sticky">
        <div className="dish3d-atmosphere" aria-hidden="true"><i /><i /><i /></div>
        <motion.p className="dish3d-kicker" aria-hidden="true" style={{ opacity: kickerOpacity }}>
          {locale === "ja" ? "火から食卓へ" : "From fire to table"}
        </motion.p>
        <div className="dish3d-canvas-shell" role="img" aria-label={locale === "ja" ? `${title}の立体モデル` : `Three-dimensional model of ${title}`}>
          {webGLSupported === false ? (
            <ModelFallback locale={locale} message={locale === "ja" ? "この端末では立体表示を利用できないため、料理写真を表示しています。" : "The 3D presentation is unavailable, so the dish photograph is shown instead."} />
          ) : webGLSupported && shouldLoadModel ? (
            <ModelErrorBoundary fallback={<ModelFallback locale={locale} message={locale === "ja" ? "立体モデルを読み込めないため、料理写真を表示しています。" : "The dish model could not be loaded, so the photograph is shown instead."} />}>
              {!modelReady ? <ModelFallback locale={locale} decorative /> : null}
              <Canvas
                aria-hidden="true"
                camera={{ fov: 34, near: 0.1, far: 100, position: [0, mobile ? 3.7 : 2.55, mobile ? 7.65 : 6.25] }}
                dpr={mobile ? [0.75, 1.1] : [1, 1.5]}
                frameloop={renderActive ? "always" : "never"}
                gl={{ alpha: true, antialias: !mobile, powerPreference: "high-performance" }}
                onCreated={({ gl }) => {
                  gl.outputColorSpace = THREE.SRGBColorSpace;
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.08;
                }}
              >
                <ambientLight color="#ffd7b0" intensity={mobile ? 1.15 : 1.45} />
                <directionalLight color="#ff9b58" intensity={mobile ? 2.4 : 3.4} position={[4, 6, 5]} />
                <spotLight color="#ffd391" intensity={mobile ? 42 : 72} angle={0.48} penumbra={0.82} decay={2} distance={18} position={[-4, 7, 5]} />
                {!mobile ? <spotLight color="#8f2034" intensity={28} angle={0.54} penumbra={0.9} decay={2} distance={16} position={[4, 2, -4]} /> : null}
                <Suspense fallback={null}>
                  <DishModel motionValues={sceneMotion} mobile={mobile} reduceMotion={Boolean(reduceMotion)} onReady={handleModelReady} />
                </Suspense>
                <AdaptiveDpr pixelated={false} />
              </Canvas>
              <ModelLoading locale={locale} ready={modelReady} />
            </ModelErrorBoundary>
          ) : (
            <ModelFallback locale={locale} decorative />
          )}
        </div>

        <motion.div className="dish3d-copy" style={{ opacity: copyOpacity, y: copyY }}>
          <p className="eyebrow">{locale === "ja" ? "サクラのシグネチャー" : "Sakura signature"}</p>
          <p className="dish3d-secondary">{secondaryTitle}</p>
          <h2 id="dish3d-title">{title}</h2>
          <p>{description}</p>
          {item.price ? <div className="dish3d-price"><small>{locale === "ja" ? "税込価格" : "Tax included"}</small><strong>{item.price}</strong></div> : null}
          <div className="dish3d-actions">
            <Link className="button button-gold" href={reservationHref}>{reservationLabel}<ArrowRight aria-hidden="true" /></Link>
            <Link className="button button-outline" href={menuHref}>{menuLabel}</Link>
          </div>
        </motion.div>

        <div className="dish3d-story-progress" aria-hidden="true"><motion.span style={{ scaleX: reduceMotion ? 1 : progressScale }} /></div>
      </div>
    </section>
  );
}

function DishModel({ motionValues, mobile, reduceMotion, onReady }: { motionValues: SceneMotion; mobile: boolean; reduceMotion: boolean; onReady: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const { scene } = useGLTF(MODEL_URL, DRACO_PATH);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = true;
      }
    });
    onReady();
  }, [onReady, scene]);

  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const smoothDelta = Math.min(delta, 0.05);
    const rotationX = reduceMotion ? (mobile ? -0.08 : -0.09) : motionValues.rotationX.get();
    const rotationY = reduceMotion ? 0.08 : motionValues.rotationY.get();
    const rotationZ = reduceMotion ? 0 : motionValues.rotationZ.get();
    const scale = reduceMotion ? (mobile ? 1.62 : 3.34) : motionValues.modelScale.get();
    const y = reduceMotion ? (mobile ? 0.9 : 0.34) : motionValues.modelY.get();
    const cameraY = reduceMotion ? (mobile ? 4.05 : 3.08) : motionValues.cameraY.get();
    const cameraZ = reduceMotion ? (mobile ? 6.72 : 5.02) : motionValues.cameraZ.get();

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, rotationX, 5.4, smoothDelta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, rotationY, 5.4, smoothDelta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, rotationZ, 5.4, smoothDelta);
    const dampedScale = THREE.MathUtils.damp(group.scale.x, scale, 5.1, smoothDelta);
    group.scale.setScalar(dampedScale);
    group.position.y = THREE.MathUtils.damp(group.position.y, y, 5.1, smoothDelta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraY, 4.8, smoothDelta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraZ, 4.8, smoothDelta);
    camera.lookAt(0, mobile ? 0.42 : 0.12, 0);

    if (shadowRef.current) {
      shadowRef.current.scale.setScalar(THREE.MathUtils.damp(shadowRef.current.scale.x, reduceMotion ? 1 : 0.72 + motionValues.modelScale.get() * 0.09, 4.5, smoothDelta));
    }
  });

  return (
    <group>
      <group ref={groupRef} rotation={[-0.3, -1.02, 0.08]} scale={mobile ? 1.4 : 2.72} position={[0, mobile ? 0.1 : -0.18, 0]}>
        <primitive object={scene} />
      </group>
      <mesh ref={shadowRef} position={[0, mobile ? -0.48 : -0.72, -0.32]} rotation={[-Math.PI / 2, 0, 0]} scale={1.02}>
        <circleGeometry args={[1.18, 48]} />
        <meshBasicMaterial color="#160609" transparent opacity={0.46} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ModelLoading({ locale, ready }: { locale: Locale; ready: boolean }) {
  const { progress, errors } = useProgress();
  if (ready) return null;
  return (
    <div className="dish3d-loader" role="status" aria-live="polite">
      <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
      <small>{errors.length ? (locale === "ja" ? "読み込みを再試行してください" : "Please retry loading") : (locale === "ja" ? "立体料理を準備中" : "Preparing the 3D dish")}</small>
    </div>
  );
}

class ModelErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ModelFallback({ locale, message, decorative = false }: { locale: Locale; message?: string; decorative?: boolean }) {
  return (
    <div className="dish3d-image-fallback" aria-hidden={decorative || undefined}>
      <Image src="/images/originals/food/food-028.jpg" alt={decorative ? "" : (locale === "ja" ? "サクラのマハラジャセット" : `Maharaja Set at ${restaurantConfig.identity.nameEn}`)} width={956} height={635} sizes="(max-width: 760px) 92vw, 58vw" loading="lazy" />
      {message ? <span><Box aria-hidden="true" />{message}</span> : null}
    </div>
  );
}
