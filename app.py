from flask import Flask, jsonify, render_template, request
from threading import Lock
import time, random, math

app = Flask(__name__)
lock = Lock()
latest = {
    "soc":72.0,"solar":118.0,"motor":160.0,"recovered":0.0,"speed":18.0,
    "duty":70.0,"batteryVoltage":12.10,"genVoltage":0.0,"genCurrent":0.0
}

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/api/data")
def api_data():
    with lock:
        return jsonify(latest)

@app.post("/api/telemetry")
def telemetry():
    data=request.get_json(silent=True) or {}
    allowed=["soc","solar","motor","recovered","speed","duty","batteryVoltage","genVoltage","genCurrent"]
    with lock:
        for k in allowed:
            if k in data:
                try: latest[k]=float(data[k])
                except (TypeError,ValueError): pass
        return jsonify({"ok":True,"data":latest})

@app.get("/api/ai")
def ai():
    with lock:
        d=dict(latest)
    # Lightweight local AI-style decision engine.
    # Replace with a trained model later without changing the dashboard API.
    load_ratio=d["motor"]/max(1,d["solar"])
    if d["soc"]<25:
        action="REDUCE MOTOR LOAD / PROTECT BATTERY"; risk="HIGH"
    elif d["speed"]>22 or d["recovered"]>20:
        action="CONTROLLED RECOVERY"; risk="LOW"
    elif load_ratio>1.7:
        action="OPTIMIZE POWER DEMAND"; risk="MEDIUM"
    else:
        action="NORMAL DRIVE"; risk="LOW"
    confidence=min(0.98,0.72+abs(d["solar"]-d["motor"])/1000)
    return jsonify({"action":action,"risk":risk,"confidence":round(confidence*100,1)})

@app.get("/health")
def health():
    return jsonify({"status":"ok","service":"VIDYUT RATHAM AI Dashboard"})

if __name__=="__main__":
    app.run(host="0.0.0.0",port=5000,debug=False)
