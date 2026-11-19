import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import json, os, pickle, sys

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_auc_score, roc_curve, accuracy_score)

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

DATA_PATH    = os.path.join(PROJECT_ROOT, 'data', 'fall_dataset.csv')
MODEL_DIR    = os.path.join(PROJECT_ROOT, 'model')
STATIC_DIR   = os.path.join(PROJECT_ROOT, 'dashboard', 'static')

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# ── 1. Load data ─────────────────────────────────────────────────────────────
if not os.path.exists(DATA_PATH):
    print(f"[ERROR] Dataset not found at {DATA_PATH}")
    print("  Run data/generate_data.py first.")
    sys.exit(1)

df = pd.read_csv(DATA_PATH)
X  = df.drop('label', axis=1).values
y  = df['label'].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ── 2. Brain-Inspired Spiking-style Layer (LIF neuron simulation) ─────────────
# Import from utils so we use the same class everywhere
sys.path.insert(0, PROJECT_ROOT)
from utils.lif_layer import LIFLayer

lif = LIFLayer(threshold=0.5, decay=0.85)

# Apply SNN-style encoding
X_train_snn = lif.encode_rate(X_train_s, timesteps=10)
X_test_snn  = lif.encode_rate(X_test_s,  timesteps=10)

# Combine original + spiking features (ensemble feature engineering)
X_train_combined = np.hstack([X_train_s, X_train_snn])
X_test_combined  = np.hstack([X_test_s,  X_test_snn])

# ── 3. Train Classifier ───────────────────────────────────────────────────────
print("Training NeuroFall classifier...")

clf = GradientBoostingClassifier(
    n_estimators=200,
    learning_rate=0.08,
    max_depth=4,
    subsample=0.8,
    random_state=42
)
clf.fit(X_train_combined, y_train)

# ── 4. Evaluate ───────────────────────────────────────────────────────────────
y_pred     = clf.predict(X_test_combined)
y_prob     = clf.predict_proba(X_test_combined)[:, 1]
accuracy   = accuracy_score(y_test, y_pred)
auc        = roc_auc_score(y_test, y_prob)
report     = classification_report(y_test, y_pred,
                                   target_names=['Normal', 'Fall'], output_dict=True)
cm         = confusion_matrix(y_test, y_pred)

print(f"\n{'='*45}")
print(f"  NeuroFall Model Performance")
print(f"{'='*45}")
print(f"  Accuracy  : {accuracy*100:.2f}%")
print(f"  AUC-ROC   : {auc:.4f}")
print(f"  Precision (Fall): {report['Fall']['precision']:.4f}")
print(f"  Recall    (Fall): {report['Fall']['recall']:.4f}")
print(f"  F1-Score  (Fall): {report['Fall']['f1-score']:.4f}")
print(f"{'='*45}\n")

# ── 5. Save model & metrics ───────────────────────────────────────────────────
model_path = os.path.join(MODEL_DIR, 'neurofall_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump({'model': clf, 'scaler': scaler, 'lif': lif}, f)

metrics = {
    'accuracy': round(accuracy * 100, 2),
    'auc':      round(auc, 4),
    'precision': round(report['Fall']['precision'], 4),
    'recall':   round(report['Fall']['recall'], 4),
    'f1':       round(report['Fall']['f1-score'], 4),
    'confusion_matrix': cm.tolist()
}
metrics_path = os.path.join(MODEL_DIR, 'metrics.json')
with open(metrics_path, 'w') as f:
    json.dump(metrics, f, indent=2)

# ── 6. Plots ──────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(16, 5))
fig.patch.set_facecolor('#0f0f1a')
for ax in axes:
    ax.set_facecolor('#1a1a2e')

# Confusion matrix
sns.heatmap(cm, annot=True, fmt='d', cmap='YlOrRd',
            xticklabels=['Normal','Fall'], yticklabels=['Normal','Fall'],
            ax=axes[0], cbar=False,
            annot_kws={'size':16, 'color':'white'})
axes[0].set_title('Confusion Matrix', color='white', pad=10, fontsize=13)
axes[0].set_xlabel('Predicted', color='#aaa')
axes[0].set_ylabel('Actual', color='#aaa')
axes[0].tick_params(colors='#aaa')

# ROC curve
fpr, tpr, _ = roc_curve(y_test, y_prob)
axes[1].plot(fpr, tpr, color='#e07b54', lw=2.5, label=f'AUC = {auc:.3f}')
axes[1].plot([0,1],[0,1], '--', color='#555', lw=1)
axes[1].fill_between(fpr, tpr, alpha=0.15, color='#e07b54')
axes[1].set_title('ROC Curve', color='white', pad=10, fontsize=13)
axes[1].set_xlabel('False Positive Rate', color='#aaa')
axes[1].set_ylabel('True Positive Rate', color='#aaa')
axes[1].tick_params(colors='#aaa')
axes[1].legend(facecolor='#222', labelcolor='white')
for spine in axes[1].spines.values():
    spine.set_edgecolor('#333')

# Feature importance
feat_names = list(df.columns[:-1]) + [f'snn_{c}' for c in df.columns[:-1]]
importances = clf.feature_importances_
top_idx = np.argsort(importances)[-12:]
colors  = ['#e07b54' if i >= len(df.columns)-1 else '#4fa3e0' for i in top_idx]
axes[2].barh([feat_names[i] for i in top_idx],
             importances[top_idx], color=colors)
axes[2].set_title('Top Feature Importances\n(blue=raw, orange=SNN-encoded)',
                  color='white', pad=10, fontsize=11)
axes[2].tick_params(colors='#aaa', labelsize=8)
for spine in axes[2].spines.values():
    spine.set_edgecolor('#333')

plot_path = os.path.join(STATIC_DIR, 'model_results.png')
plt.tight_layout()
plt.savefig(plot_path, dpi=150, bbox_inches='tight', facecolor='#0f0f1a')
plt.close()
print(f"Plots saved -> {plot_path}")
print(f"Model saved -> {model_path}")
print(f"Metrics saved -> {metrics_path}")
