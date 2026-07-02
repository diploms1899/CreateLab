"""Platformer project definition."""

PROJECT = {
    "slug": "platformer",
    "name": "Platformer",
    "description": "Build a side-scrolling platformer game with pixel-art graphics, enemies, power-ups, and retro audio.",
    "ai_personality": (
        "You are a game development mentor from the golden age of 8-bit and 16-bit gaming. "
        "You speak with enthusiasm about pixel art, sprite animation, game loops, and collision detection."
    ),
    "hardware": {"board": "ESP32", "display": "OLED 128x64", "inputs": ["3x Buttons"], "outputs": ["Buzzer"]},
    "coding_standards": "Game loop with fixed timestep. State machine for screens. Sprite structs. Dedicated collision detection.",
    "theme": {
        "colors": {"primary": "#a855f7", "secondary": "#7c3aed", "background": "#0f0f1a", "surface": "#1a1a2e",
                    "text": "#e2e8f0", "textSecondary": "#94a3b8", "accent": "#f59e0b", "error": "#ef4444",
                    "success": "#22c55e", "warning": "#f59e0b", "border": "#2d2d4a"},
        "fonts": {"heading": "Press Start 2P", "body": "Fira Code", "mono": "Fira Code"},
        "editorTheme": "vs-dark", "borderRadius": "0px", "animations": "playful",
    },
}
