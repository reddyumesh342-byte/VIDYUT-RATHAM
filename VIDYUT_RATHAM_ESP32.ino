// VIDYUT RATHAM ESP32 → Python dashboard
// POST JSON telemetry to http://LAPTOP_IP:5000/api/telemetry
// Install: WiFi.h, HTTPClient.h
#include <WiFi.h>
#include <HTTPClient.h>

const char* SSID="YOUR_WIFI";
const char* PASS="YOUR_PASSWORD";
const char* SERVER="http://192.168.1.100:5000/api/telemetry"; // change laptop IP

const int BAT=34, GEN_V=32, GEN_I=33, HALL=27, MOTOR_PWM=25, RECOVERY=26;
volatile unsigned long pulses=0;
void IRAM_ATTR hall(){pulses++;}

float readV(int pin){
  int raw=analogRead(pin);
  float vadc=raw*3.3f/4095.0f;
  return vadc*4.0303f; // example 100k/33k divider; CALIBRATE!
}
float soc(float v){return constrain((v-10.8f)/(12.6f-10.8f)*100.0f,0,100);}

void setup(){
  Serial.begin(115200);
  pinMode(HALL,INPUT_PULLUP); attachInterrupt(digitalPinToInterrupt(HALL),hall,FALLING);
  pinMode(RECOVERY,OUTPUT); digitalWrite(RECOVERY,LOW);
  ledcAttach(MOTOR_PWM,20000,8); ledcWrite(MOTOR_PWM,0);
  WiFi.begin(SSID,PASS);
  while(WiFi.status()!=WL_CONNECTED) delay(400);
  Serial.println(WiFi.localIP());
}
void loop(){
  if(WiFi.status()==WL_CONNECTED){
    float bv=readV(BAT), gv=readV(GEN_V);
    // Replace with calibrated current-sensor equation for your exact sensor.
    float genI=max(0.0f,(analogRead(GEN_I)*3.3f/4095.0f-2.50f)/0.100f);
    float recovered=gv*genI;
    float speed=(pulses*0.50f)*3.6f; pulses=0; // simple 1 pulse/rev, 0.50m wheel circumference per 1s loop
    String json="{\"soc\":"+String(soc(bv),1)+
      ",\"solar\":0,\"motor\":0,\"recovered\":"+String(recovered,1)+
      ",\"speed\":"+String(speed,1)+",\"duty\":70"+
      ",\"batteryVoltage\":"+String(bv,2)+",\"genVoltage\":"+String(gv,2)+
      ",\"genCurrent\":"+String(genI,2)+"}";
    HTTPClient http; http.begin(SERVER); http.addHeader("Content-Type","application/json");
    int code=http.POST(json); Serial.println(code); http.end();
  }
  delay(1000);
}