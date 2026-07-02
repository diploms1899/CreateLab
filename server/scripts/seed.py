"""Seed script: create default project templates and an admin user.

Run: python scripts/seed.py
"""

import asyncio
import os
import sys
import uuid

# When invoked as a script from any directory, ensure the server root is on sys.path
# so that `from app...` imports resolve correctly.
_server_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _server_root not in sys.path:
    sys.path.insert(0, _server_root)

from sqlalchemy import select
from app.core.database import async_session_factory, init_db
from app.core.security import hash_password
from app.api.models.user import User
from app.api.models.project import ProjectTemplate


PROJECT_TEMPLATES = [
    {
        "slug": "platformer",
        "name": "Platformer Game",
        "description": "Build a retro-style platformer game with pixel art graphics, gravity physics, collectibles, and enemy AI.",
        "theme_id": "platformer",
        "ai_personality": "You are a veteran game developer who built platformers in the 80s and 90s. You speak with the soul of a retro coder — passionate about tight controls, pixel art, chiptune audio, and clever level design. You mentor students through every step of game creation using C++ and Arduino.",
        "coding_standards": "Use Object-Oriented design. Each game entity (Player, Enemy, Collectible, Platform) is a class. Keep update() and render() separate. Use fixed timestep for physics.",
        "learning_objectives": [
            "Understand game loops and fixed timestep physics",
            "Implement 2D collision detection (AABB)",
            "Design sprite-based rendering with OLED display",
            "Learn state machines for game and entity states",
            "Handle input with debouncing and edge detection"
        ],
        "firmware_rules": "Display resolution: 128x64. Use U8G2 library. Player movement uses accelerometer (MPU6050) or buttons. Sound via piezo buzzer on pin 25.",
        "hardware_config": {
            "display": {"type": "OLED", "controller": "SSD1306", "width": 128, "height": 64, "i2c_addr": "0x3C"},
            "input": {"buttons": ["LEFT", "RIGHT", "UP", "A", "B", "START"], "analog": "MPU6050"},
            "audio": {"buzzer_pin": 25, "type": "passive"},
            "mcu": "ESP32"
        }
    },
    {
        "slug": "fishing",
        "name": "Fishing Game",
        "description": "A relaxing fishing simulation with dynamic water, fish AI, day/night cycles, and a catch-and-collect system.",
        "theme_id": "fishing",
        "ai_personality": "You are a calm, patient fishing guide who loves nature and electronics. You teach embedded systems through the lens of building a serene fishing simulation. You encourage careful observation, patience, and iterative improvement.",
        "coding_standards": "Use object-oriented design with clear separation of simulation logic from rendering. Favor composition over inheritance.",
        "learning_objectives": [
            "Implement procedural generation for water and fish behavior",
            "Build a day/night cycle system",
            "Create a collectible inventory system",
            "Work with analog sensor input (casting mechanic)",
            "Design smooth animations on OLED"
        ],
        "firmware_rules": "Display: 128x64 OLED. Casting uses MPU6050 tilt detection. Fish biting uses random timer with variable difficulty. Sound effects via buzzer.",
        "hardware_config": {
            "display": {"type": "OLED", "controller": "SSD1306", "width": 128, "height": 64},
            "input": {"buttons": ["CAST", "REEL", "MENU", "SELECT"], "analog": "MPU6050"},
            "audio": {"buzzer_pin": 25},
            "mcu": "ESP32"
        }
    },
    {
        "slug": "robotics",
        "name": "Robotics Control",
        "description": "Control a robotic arm or rover with inverse kinematics, sensor feedback, and autonomous routines.",
        "theme_id": "robotics",
        "ai_personality": "You are a professional embedded systems engineer with a decade of experience in robotics and industrial automation. You are precise, technical, and thorough. You teach students real engineering discipline.",
        "coding_standards": "Follow MISRA-inspired safety guidelines. All motor control code must have bounds checking. Use state machines for all autonomous routines. Document every function with pre/post conditions.",
        "learning_objectives": [
            "Understand PWM and servo control",
            "Implement inverse kinematics for 2-DOF arm",
            "Build a state machine for autonomous operation",
            "Read and filter sensor data (ultrasonic, IR)",
            "Implement PID control for precise positioning"
        ],
        "firmware_rules": "Servo control on pins 13, 14, 27. Ultrasonic sensor: trig=5, echo=18. I2C for IMU at 0x68. Emergency stop on pin 32 (interrupt-driven).",
        "hardware_config": {
            "servos": [{"pin": 13, "channel": 0}, {"pin": 14, "channel": 1}, {"pin": 27, "channel": 2}],
            "sensors": {"ultrasonic": {"trig": 5, "echo": 18}, "imu": {"i2c_addr": "0x68"}},
            "estop_pin": 32,
            "mcu": "ESP32"
        }
    },
    {
        "slug": "calculator",
        "name": "Scientific Calculator",
        "description": "Build a full-featured scientific calculator with graphing capabilities, expression parsing, and an interactive UI.",
        "theme_id": "calculator",
        "ai_personality": "You are a patient electrical engineering professor who loves mathematics and clean code. You teach computational thinking, efficient algorithms, and how to build complex systems that just work.",
        "coding_standards": "Write clean, well-documented code. The expression parser must handle operator precedence correctly. Use the Shunting Yard algorithm. All math functions must handle edge cases (division by zero, overflow).",
        "learning_objectives": [
            "Implement the Shunting Yard algorithm for expression parsing",
            "Build a graphical menu system on OLED",
            "Handle floating-point math on embedded hardware",
            "Create a scrolling graphing system",
            "Design a user-friendly button interface"
        ],
        "firmware_rules": "Display: 128x64 OLED. Use double precision for calculations. Graph buffer: 128x64 framebuffer. Button debounce: 50ms.",
        "hardware_config": {
            "display": {"type": "OLED", "controller": "SSD1306", "width": 128, "height": 64},
            "input": {"buttons": ["0-9", "DECIMAL", "PLUS", "MINUS", "MULT", "DIV", "EQUALS", "CLEAR", "GRAPH", "FN"]},
            "mcu": "ESP32"
        }
    },
]


async def seed():
    """Create project templates and an admin user."""
    await init_db()
    async with async_session_factory() as session:
        # Create admin user
        existing = await session.execute(
            select(User).where(User.username == "admin")
        )
        if not existing.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@createlab.local",
                hashed_password=hash_password("admin123"),
                display_name="Administrator",
                role="administrator",
            )
            session.add(admin)
            print("Created admin user (username: admin, password: admin123)")

        # Create project templates
        for tmpl in PROJECT_TEMPLATES:
            existing = await session.execute(
                select(ProjectTemplate).where(
                    ProjectTemplate.slug == tmpl["slug"]
                )
            )
            if not existing.scalar_one_or_none():
                template = ProjectTemplate(**tmpl)
                session.add(template)
                print(f"Created project template: {tmpl['name']}")

        await session.commit()

    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
