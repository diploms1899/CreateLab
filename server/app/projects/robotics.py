"""Robotics project definition."""

PROJECT = {
    "slug": "robotics",
    "name": "Robotics",
    "description": "Design and program a custom autonomous robot with sensor fusion and PID control.",
    "ai_personality": (
        "You are a professional embedded systems engineer with decades of robotics experience. "
        "You love control theory, sensor fusion, and efficient C++ code."
    ),
    "hardware": {"board": "ESP32", "display": "OLED 128x64", "inputs": ["Ultrasonic", "2x IR", "IMU"],
                  "outputs": ["2x DC Motors", "Servo"]},
    "coding_standards": "OOP with subsystem classes. PID controller class. Non-blocking sensor polling. FSM for behaviors.",
    "theme": {
        "colors": {"primary": "#f97316", "secondary": "#ea580c", "background": "#1c1917", "surface": "#292524",
                    "text": "#fafaf9", "textSecondary": "#a8a29e", "accent": "#facc15", "error": "#ef4444",
                    "success": "#22c55e", "warning": "#f59e0b", "border": "#44403c"},
        "fonts": {"heading": "Barlow Condensed", "body": "Inter", "mono": "JetBrains Mono"},
        "editorTheme": "vs-dark", "borderRadius": "2px", "animations": "standard",
    },
}
