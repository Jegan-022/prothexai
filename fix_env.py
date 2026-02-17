import os

file_path = ".env"

if os.path.exists(file_path):
    print(f"Reading {file_path}...")
    with open(file_path, "r", encoding="utf-8-sig") as f:
        content = f.read()
    
    # Strip any potential BOM or whitespace at start of file just in case
    content = content.lstrip('\ufeff').strip()
    
    print("Writing clean content back to .env...")
    # Write back as utf-8 (no BOM)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content + "\n") # Ensure trailing newline
    
    print("✅ .env file fixed (stripped BOM).")
else:
    print("❌ .env file not found.")
