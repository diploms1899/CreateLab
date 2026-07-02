# Project Templates

CreateLab comes with four built-in projects:

## Platformer
Side-scrolling platformer game with pixel-art graphics.
- Hardware: ESP32, OLED 128x64, 3x buttons, buzzer
- Concepts: Game loops, collision detection, sprite animation
- Theme: Dark pixel-art with retro fonts

## Fishing
Relaxing fishing simulator with water physics.
- Hardware: ESP32, OLED 128x64, potentiometer, vibration motor
- Concepts: Analog sensor processing, procedural animation
- Theme: Blue aquatic with rounded corners

## Robotics
Autonomous robot with sensor fusion and PID control.
- Hardware: ESP32, ultrasonic sensor, IR sensors, IMU, motors, servo
- Concepts: Control theory, sensor fusion, FSM behaviors
- Theme: Industrial orange with sharp edges

## Calculator
Scientific calculator with expression parsing.
- Hardware: ESP32, LCD 16x2, 4x4 keypad
- Concepts: Shunting-yard algorithm, fixed-point math
- Theme: Clean minimal with light background

## Creating Custom Templates

Add a new entry in `server/scripts/seed.py` with:
- Theme config (colors, fonts, editor theme)
- AI personality prompt
- Hardware configuration
- Coding standards
- Starter files
