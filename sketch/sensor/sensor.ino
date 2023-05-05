#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include "env.hpp"

#define SOUND_VELOCITY 0.034
#define CM_TO_INCH 0.393701

void toggleLight(int type, int timeout=0);

const char* ssid = SSID;
const char* password = PASSWORD;

const char* url = URL;

bool lightStatus = false;
String status;
unsigned long lastTime = 0;
unsigned long timerDelay = 5000;
int ON = LOW;
int OFF = HIGH;
long tresholdCm = TRESHOLD;


const int pingPin = TRIGPIN;
const int echoPin = ECHOPIN;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(pingPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(115200);

  Serial.println("\nEnv:");
  Serial.println("------");
  Serial.println("SSID: " + String(ssid));
  Serial.println("Password: " + String(PASSWORD));
  Serial.println("URL: " + String(URL));
  Serial.println("TRIGPIN: " + String(TRIGPIN));
  Serial.println("ECHOPIN: " + String(ECHOPIN));
  Serial.println("TRESHOLD: " + String(TRESHOLD));
  Serial.println("------");

  WiFi.begin(ssid, password);

  Serial.println("Connecting");
  while(WiFi.status() != WL_CONNECTED) {
    toggleLight(ON, 150); 
    toggleLight(OFF, 150); 
    Serial.println(".");
  }
}

void loop() {
  bool connection = WiFi.status() == WL_CONNECTED ? ON : OFF;
  long duration = sensorRun();
  long distance = microsecondsToCentimeters(duration);
  toggleLight(connection);

  String newStatus = distance < tresholdCm ? "OCCUPIED" : "VACANT";

  DynamicJsonDocument doc(1024);

  doc["deviceID"] = ESP.getChipId();
  doc["status"] = String(newStatus);

  if(status != newStatus) {
    status = newStatus;
    char data[128];
    serializeJson(doc, data);
    Serial.println(data);
    Serial.print("Distance: ");
    Serial.print(microsecondsToInches(duration));
    Serial.print(" Inches, ");
    Serial.print(distance);
    Serial.println(" Cm");
    fetch("device.post", data);
  }

  delay(100);
}

void toggleLight (int type, int timeout) {
  digitalWrite(LED_BUILTIN, type);
  if(timeout > 0) delay(timeout);
  lightStatus = type == LOW;
}

long sensorRun() {
  pinMode(pingPin, OUTPUT);
  digitalWrite(pingPin, LOW);
  delayMicroseconds(2);
  digitalWrite(pingPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(pingPin, LOW);
  pinMode(echoPin, INPUT);
  return pulseIn(echoPin, HIGH);
}

void fetch(String ep, char* data) {
  if(WiFi.status() != WL_CONNECTED) return;
  
  WiFiClient client;
  HTTPClient http;

  String payload = "{}"; 

  Serial.println(String(url) + "/" + String(ep));
  http.begin(client, String(url) + "/" + String(ep));
  http.addHeader("Content-Type", "application/json");
  http.POST(data);
  payload = http.getString();
  http.end();

  DynamicJsonDocument doc(1024);
  deserializeJson(doc, payload);
  serializeJson(doc, Serial);
  Serial.println("");
}

long microsecondsToInches(long microseconds) {
   return microsecondsToCentimeters(microseconds) * CM_TO_INCH;
}

long microsecondsToCentimeters(long microseconds) {
   return microseconds * SOUND_VELOCITY/2;
}
