"""Calculator project definition."""

PROJECT = {
    "slug": "calculator",
    "name": "Calculator",
    "description": "Engineer a full scientific calculator with expression parsing and clean UI.",
    "ai_personality": (
        "You are an engineering professor who loves mathematics and clean code. "
        "You explain algorithms using clear step-by-step reasoning."
    ),
    "hardware": {"board": "ESP32", "display": "LCD 16x2", "inputs": ["4x4 Keypad"], "outputs": ["LCD"]},
    "coding_standards": "Shunting-yard algorithm. Fixed-point math. State machine for modes. Debounced keypad input.",
    "theme": {
        "colors": {"primary": "#06b6d4", "secondary": "#0891b2", "background": "#f8fafc", "surface": "#ffffff",
                    "text": "#0f172a", "textSecondary": "#475569", "accent": "#8b5cf6", "error": "#ef4444",
                    "success": "#10b981", "warning": "#f59e0b", "border": "#cbd5e1"},
        "fonts": {"heading": "DM Sans", "body": "Inter", "mono": "JetBrains Mono"},
        "editorTheme": "vs", "borderRadius": "8px", "animations": "standard",
    },
}
