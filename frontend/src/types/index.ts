export type ActivityState =
  | 'Walking'
  | 'Running'
  | 'Sitting'
  | 'Standing'
  | 'Lying down'
  | 'Sleeping'
  | 'Unusual movement'
  | 'Suspected fall';

export type SensorNodeStatus = 'normal' | 'unusual' | 'instability' | 'fall';

export interface SensorNodeData {
  id: string;
  name: string;
  position: [number, number, number];
  status: SensorNodeStatus;
  load: number;
  alert: string;
  details?: {
    orientation: string;
    angularVelocity: string;
    shockIndex: string;
    temperature?: string;
  };
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  room_bed: string;
  condition: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
  high_risk_windows?: string;
  is_monitored: number;
  fall_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyContact {
  id: number;
  patient_id: number;
  name: string;
  phone: string;
  relation: string;
  priority: number;
  notify_sms: number;
  notify_call: number;
}

export interface FallEvent {
  id: number;
  patient_id: number;
  patient_name?: string;
  timestamp: string;
  confidence: string;
  probability: number;
  magnitude: number;
  lat?: number;
  lon?: number;
  status: string;
  contacts_notified: string[];
  notification_delivery_status: string;
  notes?: string;
}

export interface SensorTelemetry {
  timestamp: string;
  prediction: number;
  probability: number;
  magnitude: number;
  activity: ActivityState;
  is_demo: boolean;
  location: { lat: number; lon: number };
  sensor: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
  };
  landmarks: Record<string, { status: SensorNodeStatus; load: number; alert: string }>;
  history: Array<{ t: string; mag: number; fall: number; activity?: string }>;
  events: FallEvent[];
  contacts: EmergencyContact[];
  patient?: Patient;
  health_score: number;
  health_status: string;
  disclaimer: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: string[];
  provider?: string;
  disclaimer?: string;
}
