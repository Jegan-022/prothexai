from dotenv import dotenv_values, find_dotenv
import os

print("--- Debugging .env loading ---")
env_path = find_dotenv(usecwd=True)
print(f"Found .env at: {env_path}")

if env_path:
    config = dotenv_values(env_path)
    print(f"Keys in .env: {list(config.keys())}")
    print(f"MONGO_URI value: '{config.get('MONGO_URI')}'")
    print(f"JWT_SECRET value: '{config.get('JWT_SECRET')}'")
else:
    print("No .env file found by find_dotenv")

print("\n--- Environment Variables (os.environ) ---")
print(f"MONGO_URI: {os.environ.get('MONGO_URI')}")
print(f"JWT_SECRET: {os.environ.get('JWT_SECRET')}")
