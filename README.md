# VIDYUT RATHAM AI Dashboard

## Run
1. Install Python 3.11+.
2. `pip install -r requirements.txt`
3. `python app.py`
4. Open `http://127.0.0.1:5000`

The dashboard has simulation mode and a Python API for ESP32 telemetry.

## ESP32
Change Wi-Fi credentials and `SERVER` to the laptop's LAN IP:
`http://LAPTOP_IP:5000/api/telemetry`

For actual hardware, calibrate voltage dividers and the current sensor. Never connect battery/motor/generator power directly to ESP32 GPIOs.

## AI
The current local AI advisor is a lightweight decision engine using SOC, solar input, motor demand, speed and recovered power. It is intentionally transparent and can later be replaced by a trained scikit-learn model at `/api/ai`.

## Note
Recovery is controlled energy management, not free-energy generation. Generator loading can increase wheel resistance.
