import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, ZoomIn, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SensorNodeStatus } from '../types';

interface SensorMarkerProps {
  id: string;
  name: string;
  position: [number, number, number];
  status: SensorNodeStatus;
  load: number;
  alert: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const STATUS_COLORS: Record<SensorNodeStatus, { hex: string; glow: string; text: string }> = {
  normal:      { hex: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: 'Normal' },
  unusual:     { hex: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', text: 'Unusual' },
  instability: { hex: '#f97316', glow: 'rgba(249, 115, 22, 0.6)', text: 'Instability' },
  fall:        { hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.8)', text: 'High Impact / Fall' },
};

function SensorMarker({
  id,
  name,
  position,
  status,
  load,
  alert,
  isSelected,
  onSelect,
}: SensorMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = STATUS_COLORS[status] || STATUS_COLORS.normal;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle pulsing based on status severity
    const speed = status === 'fall' ? 8 : status === 'instability' ? 5 : 2;
    const scale = 1 + Math.sin(t * speed) * (status === 'fall' ? 0.35 : 0.15);
    meshRef.current.scale.set(scale, scale, scale);

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
      const ringScale = 1.3 + Math.sin(t * speed) * 0.25;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
  });

  return (
    <group position={position}>
      {/* Outer pulsing target ring */}
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.07, 0.085, 32]} />
        <meshBasicMaterial
          color={color.hex}
          transparent
          opacity={status === 'fall' ? 0.8 : hovered || isSelected ? 0.9 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive Core Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={color.hex}
          emissive={color.hex}
          emissiveIntensity={status === 'fall' ? 2.5 : isSelected ? 1.8 : 0.8}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Floating Tooltip Pill */}
      {(hovered || isSelected || status === 'fall') && (
        <Html position={[0, 0.14, 0]} center distanceFactor={8}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(id);
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium tracking-wide border shadow-lg whitespace-nowrap transition-all duration-200 cursor-pointer ${
              status === 'fall'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-900/50'
                : isSelected
                ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-cyan-950/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {name} &middot; <span style={{ color: color.hex }}>{load.toFixed(1)}g</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// Procedural Anatomical Model
function AnatomicalBody({
  landmarks,
  selectedNode,
  onSelectNode,
}: {
  landmarks: Record<string, { status: SensorNodeStatus; load: number; alert: string }>;
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
}) {
  const isFall = Object.values(landmarks).some((l) => l.status === 'fall');

  // Base materials
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: isFall ? '#381622' : '#0e1f38',
        emissive: isFall ? '#500713' : '#061324',
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.6,
        transmission: 0.85,
        thickness: 1.2,
        transparent: true,
        opacity: 0.75,
      }),
    [isFall]
  );

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: isFall ? '#f43f5e' : '#00f0ff',
        wireframe: true,
        transparent: true,
        opacity: isFall ? 0.35 : 0.18,
      }),
    [isFall]
  );

  const neuralLineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: isFall ? '#fb7185' : '#38bdf8',
        transparent: true,
        opacity: 0.6,
      }),
    [isFall]
  );

  // Neural Pathway Line Coordinates
  const spinePoints = useMemo(
    () => [
      new THREE.Vector3(0, 2.5, 0),
      new THREE.Vector3(0, 1.8, 0.05),
      new THREE.Vector3(0, 1.3, 0.08),
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(-0.35, 0.1, 0),
      new THREE.Vector3(-0.35, -0.7, 0),
      new THREE.Vector3(-0.35, -1.5, 0),
    ],
    []
  );
  const spineGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(spinePoints),
    [spinePoints]
  );

  const rightLegPoints = useMemo(
    () => [
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(0.35, 0.1, 0),
      new THREE.Vector3(0.35, -0.7, 0),
      new THREE.Vector3(0.35, -1.5, 0),
    ],
    []
  );
  const rightLegGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(rightLegPoints),
    [rightLegPoints]
  );

  const armPoints = useMemo(
    () => [
      new THREE.Vector3(-0.85, 0.95, 0),
      new THREE.Vector3(-0.5, 1.6, 0),
      new THREE.Vector3(0, 1.8, 0.05),
      new THREE.Vector3(0.5, 1.6, 0),
      new THREE.Vector3(0.85, 0.95, 0),
    ],
    []
  );
  const armGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(armPoints),
    [armPoints]
  );

  return (
    <group position={[0, 0, 0]}>
      {/* ── Head / Cranium ────────────────────────────────────────── */}
      <group position={[0, 2.65, 0]}>
        <mesh material={glassMaterial}>
          <sphereGeometry args={[0.26, 32, 32]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <sphereGeometry args={[0.265, 12, 12]} />
        </mesh>
      </group>

      {/* ── Neck ──────────────────────────────────────────────────── */}
      <mesh position={[0, 2.25, 0]} material={glassMaterial}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
      </mesh>

      {/* ── Thorax / Ribcage / Upper Torso ─────────────────────────── */}
      <group position={[0, 1.75, 0]}>
        <mesh material={glassMaterial}>
          <cylinderGeometry args={[0.38, 0.32, 0.8, 24]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[0.385, 0.325, 0.8, 14]} />
        </mesh>
      </group>

      {/* ── Abdomen & Waist ────────────────────────────────────────── */}
      <group position={[0, 1.05, 0]}>
        <mesh material={glassMaterial}>
          <cylinderGeometry args={[0.31, 0.35, 0.55, 24]} />
        </mesh>
        <mesh material={wireframeMaterial}>
          <cylinderGeometry args={[0.315, 0.355, 0.55, 14]} />
        </mesh>
      </group>

      {/* ── Pelvis ────────────────────────────────────────────────── */}
      <mesh position={[0, 0.65, 0]} material={glassMaterial}>
        <cylinderGeometry args={[0.36, 0.3, 0.35, 24]} />
      </mesh>

      {/* ── Shoulders & Arms ──────────────────────────────────────── */}
      {/* Left Upper Arm */}
      <mesh position={[-0.52, 1.5, 0]} rotation={[0, 0, 0.15]} material={glassMaterial}>
        <capsuleGeometry args={[0.08, 0.45, 12, 16]} />
      </mesh>
      {/* Left Forearm */}
      <mesh position={[-0.72, 1.05, 0]} rotation={[0, 0, 0.2]} material={glassMaterial}>
        <capsuleGeometry args={[0.07, 0.45, 12, 16]} />
      </mesh>
      {/* Left Hand */}
      <mesh position={[-0.88, 0.72, 0]} material={glassMaterial}>
        <boxGeometry args={[0.09, 0.14, 0.04]} />
      </mesh>

      {/* Right Upper Arm */}
      <mesh position={[0.52, 1.5, 0]} rotation={[0, 0, -0.15]} material={glassMaterial}>
        <capsuleGeometry args={[0.08, 0.45, 12, 16]} />
      </mesh>
      {/* Right Forearm */}
      <mesh position={[0.72, 1.05, 0]} rotation={[0, 0, -0.2]} material={glassMaterial}>
        <capsuleGeometry args={[0.07, 0.45, 12, 16]} />
      </mesh>
      {/* Right Hand */}
      <mesh position={[0.88, 0.72, 0]} material={glassMaterial}>
        <boxGeometry args={[0.09, 0.14, 0.04]} />
      </mesh>

      {/* ── Legs ──────────────────────────────────────────────────── */}
      {/* Left Thigh */}
      <mesh position={[-0.22, 0.05, 0]} material={glassMaterial}>
        <capsuleGeometry args={[0.13, 0.7, 12, 16]} />
      </mesh>
      {/* Left Calf */}
      <mesh position={[-0.24, -0.85, 0]} material={glassMaterial}>
        <capsuleGeometry args={[0.1, 0.75, 12, 16]} />
      </mesh>
      {/* Left Foot */}
      <mesh position={[-0.24, -1.52, 0.08]} material={glassMaterial}>
        <boxGeometry args={[0.12, 0.08, 0.26]} />
      </mesh>

      {/* Right Thigh */}
      <mesh position={[0.22, 0.05, 0]} material={glassMaterial}>
        <capsuleGeometry args={[0.13, 0.7, 12, 16]} />
      </mesh>
      {/* Right Calf */}
      <mesh position={[0.24, -0.85, 0]} material={glassMaterial}>
        <capsuleGeometry args={[0.1, 0.75, 12, 16]} />
      </mesh>
      {/* Right Foot */}
      <mesh position={[0.24, -1.52, 0.08]} material={glassMaterial}>
        <boxGeometry args={[0.12, 0.08, 0.26]} />
      </mesh>

      {/* ── Neural Spine & Limbs Light Strands ─────────────────────── */}
      <primitive object={new THREE.Line(spineGeometry, neuralLineMaterial)} />
      <primitive object={new THREE.Line(rightLegGeometry, neuralLineMaterial)} />
      <primitive object={new THREE.Line(armGeometry, neuralLineMaterial)} />

      {/* ── Sensor Markers (7 Anchors) ────────────────────────────── */}
      <SensorMarker
        id="head"
        name="Cranial Sensor"
        position={[0, 2.7, 0.22]}
        status={landmarks.head?.status || 'normal'}
        load={landmarks.head?.load || 1.0}
        alert={landmarks.head?.alert || 'Nominal'}
        isSelected={selectedNode === 'head'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="chest"
        name="Thoracic IMU"
        position={[0, 1.8, 0.35]}
        status={landmarks.chest?.status || 'normal'}
        load={landmarks.chest?.load || 1.1}
        alert={landmarks.chest?.alert || 'Nominal'}
        isSelected={selectedNode === 'chest'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="waist"
        name="Lumbar / CoM Hub"
        position={[0, 1.05, 0.32]}
        status={landmarks.waist?.status || 'normal'}
        load={landmarks.waist?.load || 1.2}
        alert={landmarks.waist?.alert || 'Nominal'}
        isSelected={selectedNode === 'waist'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="left_wrist"
        name="Left Wrist Band"
        position={[-0.85, 0.88, 0.15]}
        status={landmarks.left_wrist?.status || 'normal'}
        load={landmarks.left_wrist?.load || 1.0}
        alert={landmarks.left_wrist?.alert || 'Nominal'}
        isSelected={selectedNode === 'left_wrist'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="right_wrist"
        name="Right Wrist Band"
        position={[0.85, 0.88, 0.15]}
        status={landmarks.right_wrist?.status || 'normal'}
        load={landmarks.right_wrist?.load || 1.0}
        alert={landmarks.right_wrist?.alert || 'Nominal'}
        isSelected={selectedNode === 'right_wrist'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="left_ankle"
        name="Left Ankle Sensor"
        position={[-0.24, -1.35, 0.18]}
        status={landmarks.left_ankle?.status || 'normal'}
        load={landmarks.left_ankle?.load || 1.4}
        alert={landmarks.left_ankle?.alert || 'Nominal'}
        isSelected={selectedNode === 'left_ankle'}
        onSelect={onSelectNode}
      />
      <SensorMarker
        id="right_ankle"
        name="Right Ankle Sensor"
        position={[0.24, -1.35, 0.18]}
        status={landmarks.right_ankle?.status || 'normal'}
        load={landmarks.right_ankle?.load || 1.4}
        alert={landmarks.right_ankle?.alert || 'Nominal'}
        isSelected={selectedNode === 'right_ankle'}
        onSelect={onSelectNode}
      />

      {/* Ground Projection Ring */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 1.0, 48]} />
        <meshBasicMaterial
          color={isFall ? '#f43f5e' : '#00f0ff'}
          transparent
          opacity={isFall ? 0.3 : 0.12}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Interactive Container
export default function HumanBody3D({
  landmarks = {},
  selectedNode,
  onSelectNode,
  activity = 'Walking',
}: {
  landmarks: Record<string, { status: SensorNodeStatus; load: number; alert: string }>;
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  activity?: string;
}) {
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const isFall = Object.values(landmarks).some((l) => l.status === 'fall');

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-gradient-to-b from-[#0b1220]/90 to-[#070b14] border border-slate-800/80 shadow-2xl overflow-hidden group">
      {/* Background Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          isFall ? 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15),transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_70%)]'
        }`}
      />

      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 pointer-events-auto">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isFall ? 'bg-rose-500' : 'bg-emerald-400'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            3D Biomechanical Mesh
          </span>
          <span className="text-[11px] text-brand-cyan/80 font-mono">
            &middot; {activity}
          </span>
        </div>

        {/* Camera Reset Pill */}
        <button
          onClick={resetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-medium shadow-md pointer-events-auto active:scale-95"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Bottom Interactive Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Unusual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Instability</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Impact</span>
          </div>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0.8, 4.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.8} color={isFall ? '#f43f5e' : '#00f0ff'} />
        <pointLight position={[0, 2, 2]} intensity={1.5} color={isFall ? '#fb7185' : '#38bdf8'} />

        <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.25}>
          <AnatomicalBody
            landmarks={landmarks}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
          />
        </Float>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={2.5}
          maxDistance={6.0}
          maxPolarAngle={Math.PI / 2 + 0.2}
          minPolarAngle={Math.PI / 4}
          dampingFactor={0.06}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
