import React from 'react';
import { X, Activity, Compass, ShieldCheck, AlertTriangle, Zap, Gauge } from 'lucide-react';
import { SensorNodeStatus } from '../types';

interface SensorInspectorModalProps {
  selectedNode: string | null;
  onClose: () => void;
  landmarks: Record<string, { status: SensorNodeStatus; load: number; alert: string }>;
  telemetrySensor?: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
  };
}

const NODE_DETAILS: Record<
  string,
  {
    name: string;
    clinicalRole: string;
    normalRange: string;
    sensorType: string;
    locationDesc: string;
  }
> = {
  head: {
    name: 'Cranial Telemetry Anchor',
    clinicalRole: 'Monitors sudden rotational deceleration, whip trauma, and syncope collapse.',
    normalRange: '0.8g – 1.4g',
    sensorType: '3-Axis MEMS Accelerometer + Gyroscope',
    locationDesc: 'Head / Cranium Apex',
  },
  chest: {
    name: 'Thoracic Inertial Sensor',
    clinicalRole: 'Primary baseline for respiratory rhythm, trunk tilt, and postural orthostasis.',
    normalRange: '0.9g – 1.3g (nominal upright 1.0g gravity vector)',
    sensorType: '6-Axis IMU (MPU-6050 compatible)',
    locationDesc: 'Sternum / Mid-Thorax',
  },
  waist: {
    name: 'Lumbar / Center of Mass Hub',
    clinicalRole: 'Primary detector of postural balance, gait cadence, and center-of-mass loss.',
    normalRange: '0.95g – 1.25g',
    sensorType: 'High-G Kinetic Transducer',
    locationDesc: 'L4/L5 Lumbar Spine / Belt Clip',
  },
  left_wrist: {
    name: 'Left Wrist Wearable Node',
    clinicalRole: 'Tracks tremor frequency (Parkinsonian resting tremor), and forward protective extension.',
    normalRange: '0.6g – 2.5g (variable by arm swing)',
    sensorType: 'Smartband PPG + 6-Axis Motion Sensor',
    locationDesc: 'Left Radial/Ulnar Styloid',
  },
  right_wrist: {
    name: 'Right Wrist Wearable Node',
    clinicalRole: 'Tracks dominant arm kinetic impulses, meal tremor patterns, and impact cushioning.',
    normalRange: '0.6g – 2.5g',
    sensorType: 'Smartband PPG + 6-Axis Motion Sensor',
    locationDesc: 'Right Radial/Ulnar Styloid',
  },
  left_ankle: {
    name: 'Left Ankle Gait Anchor',
    clinicalRole: 'Measures foot clearance height, stumbling drag, and heel-strike shock wave.',
    normalRange: '1.0g – 3.2g (impact peaks during walking)',
    sensorType: 'Sub-Foot / Lateral Malleolus Sensor',
    locationDesc: 'Left Lateral Malleolus',
  },
  right_ankle: {
    name: 'Right Ankle Gait Anchor',
    clinicalRole: 'Monitors asymmetric stride, freezing of gait (FOG), and trip hazards.',
    normalRange: '1.0g – 3.2g',
    sensorType: 'Sub-Foot / Lateral Malleolus Sensor',
    locationDesc: 'Right Lateral Malleolus',
  },
};

export default function SensorInspectorModal({
  selectedNode,
  onClose,
  landmarks,
  telemetrySensor,
}: SensorInspectorModalProps) {
  if (!selectedNode) return null;

  const meta = NODE_DETAILS[selectedNode] || {
    name: selectedNode.toUpperCase(),
    clinicalRole: 'Monitors localized biomechanical dynamics.',
    normalRange: '1.0g',
    sensorType: 'MEMS IMU',
    locationDesc: selectedNode,
  };

  const landmark = landmarks[selectedNode] || {
    status: 'normal' as SensorNodeStatus,
    load: 1.0,
    alert: 'Nominal',
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-[#0c1222]/95 border-l border-slate-800/80 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Node Inspector</span>
              <h3 className="text-sm font-bold text-white tracking-tight">{meta.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Callout */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">STATE ASSESSMENT</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                landmark.status === 'fall'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : landmark.status === 'instability'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : landmark.status === 'unusual'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {landmark.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">KINETIC LOAD</span>
              <span className="text-xl font-bold font-mono text-white">
                {landmark.load.toFixed(2)} <span className="text-xs text-slate-500">g</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">ALERT CODE</span>
              <span className="text-xs font-semibold text-brand-sky truncate block mt-1">
                {landmark.alert}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Hardware Specs & Clinical Role */}
        <div className="mt-4 space-y-3 text-xs text-slate-300">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
              Clinical Telemetry Role
            </span>
            <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              {meta.clinicalRole}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">NORMAL RANGE</span>
              <span className="text-slate-200">{meta.normalRange}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/30 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ANATOMICAL SITE</span>
              <span className="text-slate-200 truncate block">{meta.locationDesc}</span>
            </div>
          </div>

          {telemetrySensor && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block mb-1">
                Raw Hub Telemetry Vector
              </span>
              <div className="flex justify-between text-slate-300">
                <span>AX: {telemetrySensor.ax.toFixed(2)}</span>
                <span>AY: {telemetrySensor.ay.toFixed(2)}</span>
                <span>AZ: {telemetrySensor.az.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>GX: {telemetrySensor.gx.toFixed(2)}</span>
                <span>GY: {telemetrySensor.gy.toFixed(2)}</span>
                <span>GZ: {telemetrySensor.gz.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}
