"""Fishing project definition."""

PROJECT = {
    "slug": "fishing",
    "name": "Fishing",
    "description": "Create a relaxing fishing simulator with realistic water physics and nature ambience.",
    "ai_personality": (
        "You are a calm, patient instructor who loves nature. "
        "You use fishing and water metaphors when explaining concepts."
    ),
    "hardware": {"board": "ESP32", "display": "OLED 128x64", "inputs": ["Potentiometer"], "outputs": ["Vibration Motor"]},
    "coding_standards": "Procedural animation with sine waves. Analog input smoothing. State machine for fishing phases.",
    "theme": {
        "colors": {"primary": "#0ea5e9", "secondary": "#0284c7", "background": "#082f49", "surface": "#0c4a6e",
                    "text": "#e0f2fe", "textSecondary": "#7dd3fc", "accent": "#f59e0b", "error": "#f87171",
                    "success": "#34d399", "warning": "#fbbf24", "border": "#164e63"},
        "fonts": {"heading": "Quicksand", "body": "Inter", "mono": "Fira Code"},
        "editorTheme": "vs-dark", "borderRadius": "12px", "animations": "subtle",
    },
}
