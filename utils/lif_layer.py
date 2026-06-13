import numpy as np

class LIFLayer:
    def __init__(self, threshold=1.0, decay=0.9):
        self.threshold = threshold
        self.decay     = decay

    def encode_rate(self, X, timesteps=10):
        X_pos  = np.clip(X, 0, None)
        X_norm = X_pos / (X_pos.max(axis=0) + 1e-8)
        spike_counts = np.zeros_like(X)
        for t in range(timesteps):
            spike_counts += (np.random.rand(*X.shape) < X_norm / timesteps).astype(float)
        return spike_counts
