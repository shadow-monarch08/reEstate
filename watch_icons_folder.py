import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WATCH_CONFIG = [
    {
        "folder": "./assets/icons",
        "output": "./constants/icons.ts",
        "extensions": [".png"]
    },
    {
        "folder": "./assets/images",
        "output": "./constants/images.ts",
        "extensions": [".png", ".jpg", ".jpeg"]
    }
]

def to_variable_name(filename):
    name = os.path.splitext(filename)[0]
    return name.replace("-", "_").replace(" ", "_")

def generate_ts_file(folder, output_file, extensions):
    files = sorted([
        f for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in extensions
    ])
    imports = []
    exports = []

    for file in files:
        var_name = to_variable_name(file)
        rel_path = os.path.relpath(folder, ".").replace("\\", "/")
        imports.append(f'import {var_name} from "@/{"{}".format(rel_path)}/{file}";')
        exports.append(f"  {var_name},")

    content = "\n".join(imports) + "\n\nexport default {\n" + "\n".join(exports) + "\n};\n"

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[Updated] {output_file} with {len(files)} files.")

class AssetFolderHandler(FileSystemEventHandler):
    def __init__(self, folder, output_file, extensions):
        self.folder = folder
        self.output_file = output_file
        self.extensions = extensions

    def should_handle(self, path):
        return any(path.lower().endswith(ext) for ext in self.extensions)

    def on_any_event(self, event):
        if not event.is_directory and self.should_handle(event.src_path):
            generate_ts_file(self.folder, self.output_file, self.extensions)

if __name__ == "__main__":
    observers = []
    print("👀 Watching for changes...")

    for config in WATCH_CONFIG:
        folder = config["folder"]
        output = config["output"]
        extensions = config["extensions"]

        generate_ts_file(folder, output, extensions)  # Initial run
        handler = AssetFolderHandler(folder, output, extensions)
        observer = Observer()
        observer.schedule(handler, path=folder, recursive=False)
        observer.start()
        observers.append(observer)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        for observer in observers:
            observer.stop()
    for observer in observers:
        observer.join()
