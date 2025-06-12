import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

ICONS_FOLDER = "./assets/icons"
OUTPUT_FILE = "./constants/icons.ts"  # Change path if needed

def to_variable_name(filename):
    name = os.path.splitext(filename)[0]
    return name.replace("-", "_")

def generate_ts_file():
    files = sorted([f for f in os.listdir(ICONS_FOLDER) if f.endswith(".png")])
    imports = []
    exports = []

    for file in files:
        var_name = to_variable_name(file)
        imports.append(f'import {var_name} from "@/assets/icons/{file}";')
        exports.append(f"  {var_name},")

    content = "\n".join(imports) + "\n\nexport default {\n" + "\n".join(exports) + "\n};\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[Updated] {OUTPUT_FILE} with {len(files)} icons.")

class IconFolderHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(".png"):
            generate_ts_file()

    def on_created(self, event):
        if event.src_path.endswith(".png"):
            generate_ts_file()

    def on_deleted(self, event):
        if event.src_path.endswith(".png"):
            generate_ts_file()

if __name__ == "__main__":
    print(f"👀 Watching {ICONS_FOLDER} for changes...")
    generate_ts_file()  # Initial sync
    observer = Observer()
    observer.schedule(IconFolderHandler(), path=ICONS_FOLDER, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
