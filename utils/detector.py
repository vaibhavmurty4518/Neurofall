import numpy as np
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils.lif_layer import LIFLayer
import pickle, time

with open(os.path.join(os.path.dirname(__file__),'../model/neurofall_model.pkl'), 'rb') as f:
    saved = pickle.load(f)

model  = saved['model']
scaler = saved['scaler']
lif    = saved['lif']

def _extract(ax, ay, az, gx, gy, gz):
    sma = (np.sum(np.abs(ax)) + np.sum(np.abs(ay)) + np.sum(np.abs(az))) / len(ax)
    mag = np.sqrt(ax**2 + ay**2 + az**2)
    return [
        np.mean(ax),np.std(ax),np.max(ax),np.min(ax),
        np.mean(ay),np.std(ay),np.max(ay),np.min(ay),
        np.mean(az),np.std(az),np.max(az),np.min(az),
        np.mean(gx),np.std(gx),np.max(gx),np.min(gx),
        np.mean(gy),np.std(gy),np.max(gy),np.min(gy),
        np.mean(gz),np.std(gz),np.max(gz),np.min(gz),
        sma, np.mean(mag), np.max(mag), np.std(mag),
        np.percentile(mag,75)-np.percentile(mag,25)
    ]

def generate_normal_features():
    n = 100; t = np.linspace(0, 4*np.pi, n)
    ax=0.3*np.sin(t)+np.random.normal(0,.05,n); ay=9.8+0.2*np.sin(t*1.1)+np.random.normal(0,.05,n)
    az=0.2*np.cos(t*.9)+np.random.normal(0,.05,n); gx=0.5*np.sin(t*.8)+np.random.normal(0,.02,n)
    gy=0.3*np.cos(t)+np.random.normal(0,.02,n);   gz=0.4*np.sin(t*1.2)+np.random.normal(0,.02,n)
    return _extract(ax,ay,az,gx,gy,gz)

def generate_fall_features():
    n=100; ax=np.random.normal(0,.1,n); ay=np.random.normal(0,.1,n); az=np.random.normal(0,.1,n)
    gx=np.random.normal(0,.1,n); gy=np.random.normal(0,.1,n); gz=np.random.normal(0,.1,n)
    i,w=30,15
    ax[i:i+w]+=np.random.normal(12,2,w); ay[i:i+w]=np.random.normal(.5,.3,w)
    az[i:i+w]+=np.random.normal(-8,2,w); gx[i:i+w]+=np.random.normal(15,3,w)
    gy[i:i+w]+=np.random.normal(20,4,w); gz[i:i+w]+=np.random.normal(10,2,w)
    return _extract(ax,ay,az,gx,gy,gz)

def predict(features):
    X = np.array(features).reshape(1,-1)
    X_s   = scaler.transform(X)
    X_snn = lif.encode_rate(X_s, timesteps=10)
    X_c   = np.hstack([X_s, X_snn])
    prob  = model.predict_proba(X_c)[0][1]
    return int(prob>=0.5), round(float(prob),4)

def run_demo(n_steps=20):
    print("\n🧠 NeuroFall — Real-time Demo"); print("="*45)
    for i in range(n_steps):
        is_fall = i in [7,14]
        feats = generate_fall_features() if is_fall else generate_normal_features()
        pred, prob = predict(feats)
        status = "🚨 FALL DETECTED" if pred else "✅ Normal"
        alert  = "⚡ ALERT SENT!" if pred else ""
        print(f"  t={i+1:02d}s | {status} | confidence={prob:.2%}  {alert}")
        time.sleep(0.05)
    print("="*45)

if __name__ == '__main__':
    run_demo()
