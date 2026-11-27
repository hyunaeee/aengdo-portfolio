"""Install the public RoboCasa tabletop assets into the simulator's Docker volume."""

from concurrent.futures import ThreadPoolExecutor
import fcntl
from pathlib import Path
import shutil
import tempfile
from urllib.request import urlopen
from zipfile import ZipFile


ROOT = Path("/opt/robocasa/robocasa/models/assets")
DIGITAL_COUSINS = (
    "https://huggingface.co/datasets/nvidia/PhysicalAI-DigitalCousin-Assets/"
    "resolve/1b018839a6da865dffecd3185fe054211bc71270/"
)
# Pinned URLs used by the upstream RoboCasa downloaders. The tabletop tasks
# use default textures, so their separate generative-texture library is omitted.
PACKAGES = [
    ("textures", "https://utexas.box.com/shared/static/otdsyfjontk17jdp24bkhy2hgalofbh4.zip"),
    ("fixtures", "https://utexas.box.com/shared/static/pobhbsjyacahg2mx8x4rm5fkz3wlmyzp.zip"),
    ("objects/objaverse", "https://utexas.box.com/shared/static/ejt1kc2v5vhae1rl4k5697i4xvpbjcox.zip"),
    ("objects/lightwheel", DIGITAL_COUSINS + "lightwheel.zip"),
    ("objects/sketchfab", DIGITAL_COUSINS + "sketchfab.zip"),
]


def install(package):
    subdir, url = package
    target = ROOT / subdir
    marker = target / ".installed"
    if marker.is_file():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {subdir}", flush=True)
    with tempfile.TemporaryFile(dir=ROOT) as archive:
        with urlopen(url, timeout=120) as response:
            shutil.copyfileobj(response, archive, length=1024 * 1024)
        with ZipFile(archive) as files:
            members = [entry for entry in files.infolist()
                       if entry.filename.startswith(target.name + "/")]
            if not members:
                raise RuntimeError(f"Missing {target.name}/ in the upstream archive")
            files.extractall(target.parent, members)
    marker.touch()
    print(f"Installed {subdir}", flush=True)


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    with (ROOT / ".install.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        base_assets = Path("/opt/robocasa/base-assets")
        if base_assets.is_dir() and not (ROOT / ".base-installed").is_file():
            shutil.copytree(base_assets, ROOT, dirs_exist_ok=True)
            (ROOT / ".base-installed").touch()
        with ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(install, PACKAGES))
