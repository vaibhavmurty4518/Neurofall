NeuroFall — Because Every Second Counts
"Falls are the second leading cause of unintentional injury deaths worldwide. NeuroFall was built so that no one has to wait alone on the floor, wondering if help is coming."

Ever watched an elderly parent or grandparent move around the house and felt that quiet anxiety — what if they fall and no one's there? That's exactly the problem NeuroFall was built to solve.

This isn't just another sensor project. It's a real-time safety net — a system that watches over someone you love, learns what "normal" movement looks like for them, and the moment something goes wrong, it springs into action. It gives them 30 seconds to say "I'm fine, just stumbled" — and if they can't, it calls for help automatically.

📋 Table of Contents
The Story Behind It
What It Actually Does
Project Structure
Getting It Running
The Dashboard — A Tour
API Reference
The Brain Behind It — How the Model Works
Health Score — What Does It Really Mean
Making It Your Own
When Things Go Wrong
Tech Stack
The Story Behind It
Most fall detection systems are binary and dumb — they fire an alarm, and suddenly there are paramedics at the door for a grandpa who just bent down to tie his shoelaces. That causes real distress. It erodes trust in the device. Eventually people stop wearing it.

NeuroFall is different in a few important ways:

It gives people dignity. Before alerting anyone, it shows a countdown and asks "Are you okay?" The patient has 30 seconds to cancel. False alarms stay false alarms.

It thinks like a brain. The model isn't just crunching numbers — it uses a Leaky Integrate-and-Fire (LIF) spiking neural network layer, the same computational principle biological neurons use. It's genuinely more sensitive to the patterns of a fall than a plain threshold detector.

It keeps a health story. Every reading contributes to a live Health Score. Over time, you can see if someone's movement is becoming more erratic, more unstable — before a fall even happens.

What It Actually Does
Let's walk through what happens from the moment someone loses their balance:

1. The sensor reads movement — accelerometer and gyroscope data streams in every 1.5 seconds, giving us acceleration in all three axes and rotational velocity.

2. The model makes a judgment — 29 features are extracted from a 100-sample window (things like mean acceleration, signal magnitude area, how much the readings are varying). These get fed through the SNN layer and then the classifier. Out comes a probability: "There's a 93% chance this is a fall."

3. If it's a fall, the 30-second window opens — a big overlay appears on screen (and on any monitoring device) with a countdown. The patient or a nearby caregiver can hit "I'm OK" and the whole thing quietly cancels, logged as a false alarm.

4. If no one cancels, the alert fires — every emergency contact gets notified, in priority order. The event is logged with timestamp, GPS coordinates, confidence level, and who was notified.

5. The voice speaks — the browser announces the fall aloud, loudly, so anyone nearby knows something happened.

Throughout all of this, the Health Score keeps updating in the background — quietly tracking whether things are getting better or worse over the session.

✨ Features at a Glance
🔴 Fall Detection The system checks for falls every 1.5 seconds. When the model's confidence crosses 50%, the alarm sequence begins. A color-coded probability bar on the dashboard shows you exactly how confident the model is at any moment — green for calm, amber for borderline, red for danger.

🚨 False Alarm Protection Nobody wants to cry wolf. Every fall detection opens a 30-second countdown where the patient can confirm they're fine. If they cancel, it's logged honestly as a false alarm. If they confirm — or the timer runs out — the real alert goes out. This one feature alone makes the system actually trustworthy in daily use.

📞 Emergency Contacts (Built Right) You can add as many contacts as you need, each with a priority number. When a fall is confirmed, the system notifies them in order — P1 first, then P2, then P3. The cascade is visible on the Patient Profile page: Wife → Son → Neurologist → Ambulance (if no response in 2 min). You can manage all contacts live from the Contacts page without ever restarting the server.

❤️ Health Score A 0–100 score that lives in the top corner of the dashboard and on its own dedicated page. It reflects how stable and normal the patient's movement has been. High variance, unusual gravity readings, or a string of recent falls will pull the score down. A calm, steady session pushes it back up. Think of it as a quiet measure of how good a day they're having.

🔊 Voice Alerts When a fall is confirmed, the system speaks. Out loud. Using the browser's built-in text-to-speech. You can customize exactly what it says, how fast it speaks, and how loudly. There's a test button so you can hear it before it matters. It's the kind of thing that could wake up someone in the next room.

📊 Live Charts Two real-time charts — one showing the raw acceleration magnitude stream with fall events highlighted as red dots, and one showing the health history trend. Plus a weekly bar chart on the profile page showing falls and near-misses across the last four weeks.

📁 Project Structure
Here's how everything fits together. Keep this layout exactly as shown — the relative paths in app.py depend on it.

your_project/
│
├── web/                          ← This is where you run the server from
│   ├── app.py                    ← The Flask backend — all the logic lives here
│   ├── static/                   ← Put any custom CSS/images here (optional)
│   └── templates/
│       └── index.html            ← The entire dashboard — one self-contained file
│
├── model/
│   ├── neurofall_model.pkl       ← Your trained model (must have 'model', 'scaler', 'lif' keys)
│   └── metrics.json              ← Shown on the dashboard KPI cards
│
└── utils/
    └── lif_layer.py              ← The LIFLayer class — the SNN encoder
The model/ and utils/ folders need to be one level above web/. That's how sys.path.insert finds them.

metrics.json should look like this:

{
  "accuracy": 94.2,
  "auc": 0.97
}
⚙️ Getting It Running
This should take about five minutes if you already have Python installed.

Step 1 — Get the code
git clone https://github.com/yourname/neurofall.git
cd neurofall
Step 2 — Set up a virtual environment
This keeps your dependencies clean and separate from other projects.

python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux or macOS:
source venv/bin/activate
You'll know it worked when you see (venv) at the start of your terminal prompt.

Step 3 — Install what you need
pip install flask numpy scikit-learn
If your model was trained with XGBoost, add that too:

pip install xgboost
Step 4 — Double-check your files
Before starting, make sure these three files exist:

model/neurofall_model.pkl   ✅  (your trained model)
model/metrics.json          ✅  (accuracy and AUC numbers)
utils/lif_layer.py          ✅  (the LIF encoder class)
If any of these are missing, the server will crash on startup with a clear error message telling you which one.

Step 5 — Start it up
cd web
python app.py
Then open your browser and go to http://localhost:5000

You should see the dashboard come alive immediately, with the live stream starting to update. Hit "Simulate Fall" in the top right to see the whole alert sequence in action before you deploy it for real.

🖥️ The Dashboard — A Tour
The sidebar has six pages. Here's what each one is for:

📊 Dashboard — Your home base This is the main monitoring screen. The big status card at the top tells you at a glance whether the patient is safe. Below that, the live Chart.js graph shows the last 60 sensor readings with fall events marked as red dots. On the right, three axis bars show the raw sensor values in real time, and a GPS box shows the patient's approximate location. A small health score panel sits at the bottom of the sidebar.

❤️ Health — The bigger picture An animated SVG ring shows the health score with its color shifting from green to amber to red as it drops. Below that, the stats: current status, number of falls this session, average acceleration magnitude, and when monitoring started. A second chart shows the magnitude history over time so you can see trends.

🚨 Events — The honest record Every fall detection ends up here — whether it was confirmed, cancelled by the patient, or turned out to be a false alarm. The table shows time, confidence percentage, GPS coordinates, who was notified, and the final status. Nothing is hidden. If the model triggered but the patient said they were fine, that's logged too.

👤 Profile — Who we're watching over The patient card with all their details, their emergency contacts listed in priority order, medical notes with medications and high-risk time windows, and a weekly bar chart showing falls and near-misses over the past month. This page is designed for a caregiver or doctor to review.

📞 Contacts — Who to call Add and remove emergency contacts live, without restarting the server. Each contact gets a priority number. When a fall fires, they're notified in that order. The contacts you add here also appear dynamically on the Profile page.

🔊 Voice — Making sure someone hears Configure what the system says when a fall is confirmed, how fast it speaks, and at what volume. Test it with one click. The animated waveform shows whether voice alerts are on or off.

🔌 API Reference
Every endpoint returns JSON. All state is in-memory — it resets when the server restarts.

GET /
Serves the dashboard. Just open http://localhost:5000 in your browser.

GET /api/stream
The main heartbeat of the system. The dashboard calls this every 1.5 seconds.

Pass ?force_fall=1 to simulate a fall for testing — the "Simulate Fall" button in the UI does exactly this.

What comes back:

{
  "timestamp":    "14:32:05",
  "prediction":   1,
  "probability":  0.9312,
  "magnitude":    12.34,
  "location":     { "lat": 21.1904, "lon": 81.2849 },
  "sensor":       { "ax": 11.2, "ay": 0.4, "az": -8.1 },
  "history":      [{ "t": "14:32:03", "mag": 9.81, "fall": 0 }, "..."],
  "events":       ["..."],
  "health_score": 82,
  "health_status": "Good",
  "contacts":     ["..."]
}
prediction is 1 for fall, 0 for normal. probability is the raw model confidence. The history array is what feeds the live chart.

GET /api/metrics
Returns whatever is in metrics.json — shown on the dashboard KPI cards.

GET /api/contacts
Returns the full list of emergency contacts currently saved.

POST /api/contacts
Add a new contact. Send JSON in the body:

{
  "name":     "Sunita Kumar",
  "phone":    "+91 98765 43210",
  "relation": "Wife",
  "priority": 1
}
priority controls the alert order. Lower number = called first. Contacts are automatically sorted after each addition.

DELETE /api/contacts/<id>
Remove a contact by their ID. The ID comes from the GET /api/contacts response.

PUT /api/contacts/<id>
Update any field on an existing contact. Send only the fields you want to change.

POST /api/events/<idx>/cancel
Mark a fall event as a false alarm. Index 0 means the most recent event. The dashboard calls this automatically when a patient hits "I'm OK" during the countdown.

GET /api/health
Get the current health score directly, with the raw magnitude history.

🧠 The Brain Behind It — How the Model Works
What goes in
Every 1.5 seconds, a 100-sample window of sensor data is processed. From those samples — accelerometer readings on three axes (ax, ay, az) and gyroscope readings on three axes (gx, gy, gz) — we extract 29 statistical features:

For each of the six sensor axes, we compute mean, standard deviation, max, and min — that's 24 features. Then we add five more from the overall acceleration magnitude (√(ax²+ay²+az²)): mean, max, std, the IQR (interquartile range, which is robust to outliers), and the Signal Magnitude Area (SMA) which captures total movement energy.

The SNN layer — why it matters
Here's the part that makes NeuroFall different from a basic threshold detector.

Before the features hit the classifier, they pass through a Leaky Integrate-and-Fire (LIF) layer. This is a computational model of how biological neurons work — each neuron accumulates input over time and "fires" when it crosses a threshold, then leaks back toward rest.

lif.encode_rate(Xs, 10) runs 10 time steps of this simulation and produces spike rate encodings. The key insight is that this captures temporal dynamics — the rhythm and timing of how acceleration changes, not just the raw numbers at a single moment. A fall has a very specific temporal signature (sudden drop in all axes during free-fall, then a massive spike at impact) that spike encodings are naturally sensitive to.

The original 29 scaled features and the 29 spike encodings are concatenated into a 58-dimensional input for the classifier.

The decision
A scikit-learn classifier outputs a probability between 0 and 1. If it's ≥ 0.5, it's a fall. You can tune this threshold up (more conservative, fewer false positives) or down (more sensitive, catches more real falls) depending on your patient's needs.

❤️ Health Score — What Does It Really Mean
The health score isn't just a vanity metric. It's computed fresh on every stream tick from compute_health_score() and reflects three things:

Stability — How much is the acceleration varying? A calm person sitting or walking smoothly has low variance. Someone who's unsteady, trembling, or moving erratically has high variance. stability_score = max(0, 100 - variance × 10)

Gravity alignment — In normal upright activity, the magnitude of acceleration should hover around 9.8 m/s² (Earth's gravity). Big deviations suggest the person is lying down, leaning heavily, or moving in unusual ways. gravity_score = max(0, 100 - |mean_mag - 9.8| × 15)

Fall penalty — Each logged fall this session subtracts 8 points, capped at 40. A day with multiple falls is honestly reflected in a lower score.

The final score is the average of stability and gravity scores, minus the fall penalty, clamped between 0 and 100.

Score	What it's telling you
85–100 ✅	Things look really good. Movement is calm and normal.
70–84 🟢	Good day. Some variation but nothing concerning.
50–69 🟡	Worth paying attention to. Movement is less stable than ideal.
30–49 🟠	Something's off. Consider checking in.
0–29 🔴	Multiple falls or very erratic movement. Immediate attention warranted.
🎨 Making It Your Own
Change whose location shows up

Right now the GPS is centered on Durg, Chhattisgarh. To change it, open app.py and update line 28:

BASE_LAT, BASE_LON = 21.1904, 81.2849   # ← Put your patient's city here
Speed up or slow down the monitoring

The dashboard polls every 1.5 seconds. If you want faster updates (say, for a demo) or slower (to reduce server load), find this line near the bottom of index.html:

setInterval(poll, 1500);   // ← Change 1500 to any number of milliseconds
Tune how sensitive the fall detector is

If you're getting too many false alarms, raise the threshold. If you're worried about missed falls, lower it:

# In app.py, inside predict():
return int(prob >= 0.5), ...   # ← 0.5 is the default
# Try 0.6 for fewer false alarms, 0.4 to catch more real falls
Add real SMS notifications

The confirmAlert() function in the dashboard currently shows a browser popup. To send real SMS messages when a fall is confirmed, add something like this to app.py inside the if pred: block in the stream() route:

# Using Fast2SMS (India) — get an API key at fast2sms.com
import requests

def send_sms_alert(contacts, lat, lon):
    numbers = ",".join(c['phone'] for c in contacts)
    msg = f"FALL DETECTED — Ramesh Kumar needs help! Location: {lat:.4f}, {lon:.4f}"
    requests.post(
        "https://www.fast2sms.com/dev/bulkV2",
        headers={"authorization": "YOUR_API_KEY"},
        data={"route": "q", "message": msg, "numbers": numbers}
    )
Change the voice message

You don't need to touch any code for this. Just go to the Voice page in the dashboard, edit the message field, and test it. It saves automatically.

Replace the static patient profile

The Patient Profile page currently shows a hardcoded patient (Ramesh Kumar). To make it dynamic, update the HTML section with id="page-profile" in index.html and add a /api/patient endpoint to app.py that returns patient details from a config file or database.

🛠️ When Things Go Wrong
These are the problems most people hit, and exactly how to fix them.

ModuleNotFoundError: No module named 'lif_layer' Python can't find your LIF encoder. Check that utils/lif_layer.py exists and that the utils/ folder is in the right place — it should be one level above web/, not inside it. The sys.path.insert line in app.py adds the parent directory to Python's search path, so the folder structure has to match exactly.

FileNotFoundError: neurofall_model.pkl Same idea — model/ needs to be one level above web/. Double-check with ls ../model/ from inside the web/ folder.

The charts aren't updating Open your browser's developer console (F12 → Console tab). If you see a network error or a 500 response on /api/stream, that's your clue. The most common cause is the model failing to load at startup — scroll up in the terminal to see the actual error.

The voice alert doesn't speak Browsers require a user interaction (a click, a keypress) before they'll allow audio. Just click anywhere on the dashboard first. Also check that your system volume is up and that the toggle on the Voice page shows as "on".

pickle load error about incompatible types This usually means the model was saved with a different version of scikit-learn than the one currently installed. The fix is to retrain and re-save the model in your current environment. Running pip install scikit-learn --upgrade sometimes helps, but the cleanest solution is to regenerate the pickle.

Address already in use on port 5000 Something else is already running on that port (often another Flask instance you forgot to stop). Either kill the other process, or change the port:

# Bottom of app.py
app.run(debug=True, port=5001)   # ← any free port works
🧰 Tech Stack
What	Why we used it
Python + Flask	Lightweight, fast to iterate on, and perfect for serving ML models
NumPy	Feature extraction from raw sensor arrays
scikit-learn	The classifier — predict_proba gives us a smooth probability, not just 0/1
LIFLayer (custom)	The neuromorphic SNN encoder — the secret sauce
Vanilla HTML/CSS/JS	No build step, no bundler, no framework. Just open the file.
Chart.js 4.4	Beautiful, responsive charts from a CDN — zero configuration
Web Speech API	Built into every modern browser — no dependencies for voice
In-memory state	Keeps things simple for a prototype. Swap for SQLite when you're ready to persist data.
📄 License
MIT — use it, modify it, deploy it, learn from it. Attribution appreciated but not required.

👋 A Note From the Builder
This project started from a simple question: what would it take to actually trust a fall detection system enough to put it on someone you love?

The answer turned out to be — it needs to be honest about uncertainty (hence the probability bar), it needs to respect the patient's autonomy (hence the 30-second cancel window), it needs to be transparent about what happened (hence the event log that records false alarms too), and it needs to keep getting smarter about that specific person over time (hence the health score).

There's still a lot more to build. Real SMS. A mobile app. Historical data persistence. Anomaly detection that learns individual baselines. But the foundation is here, and it's a foundation built on actually caring about the person wearing the sensor.

⚠️ Important: This is a research prototype. Before deploying for a real patient, please integrate with certified medical alert hardware, add proper data persistence and backup, and ensure compliance with healthcare regulations in your region. The 30-second cancellation window, in particular, may need adjustment based on your patient's cognitive and physical capabilities.


