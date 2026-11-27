"""Finishing pass on assets/hyunae-mac-studio.glb after build-studio-scene.py has exported it. Plain Python, no Blender.

  python scripts/finish-studio-glb.py [path to the .glb]

1. Rear exhaust of the Mac Studio. Hundreds of 2 mm holes are smaller than a pixel on the page and shimmer
   when the scene turns, so any that are still in the mesh are dropped and one smooth panel takes their place.
2. A "Lid" animation on the MacBook lid: open at 0 s, closed from 1 s to 2 s. The page moves along 0-1 s itself.

Safe to run twice: each step is skipped when its result is already in the file.
"""
import json, math, os, struct, sys

PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'hyunae-mac-studio.glb')
raw = open(PATH, 'rb').read()
jlen = struct.unpack('<I', raw[12:16])[0]
doc = json.loads(raw[20:20 + jlen])
blen = struct.unpack('<I', raw[20 + jlen:24 + jlen])[0]
bin_ = bytearray(raw[28 + jlen:28 + jlen + blen])
nodes = doc['nodes']
by_name = {n.get('name'): i for i, n in enumerate(nodes)}


def append(data, target=None):
    while len(bin_) % 4:
        bin_.append(0)
    view = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(data)}
    if target:
        view['target'] = target
    bin_.extend(data)
    doc['bufferViews'].append(view)
    return len(doc['bufferViews']) - 1


def accessor(view, ctype, count, kind, lo=None, hi=None):
    a = {'bufferView': view, 'componentType': ctype, 'count': count, 'type': kind}
    if lo is not None:
        a['min'], a['max'] = lo, hi
    doc['accessors'].append(a)
    return len(doc['accessors']) - 1


# ---------------------------------------------------------------- 1. exhaust panel
A, R, OFF = 98.5, 36.0, 0.8          # half width and corner radius of the enclosure; the panel sits 0.8 mm proud
W, HH, ZC = 80.0, 19.0, 63.0         # stadium: half length along the wall, half height, height of its centre


def back(u, z):
    """Point and normal on the back wall, in the Mac Studio's glTF frame (x right, y up, z toward the viewer)."""
    flat, s, au = A - R, (1 if u >= 0 else -1), abs(u)
    if au <= flat:
        x, y, nx, ny = -u, A, 0.0, 1.0
    else:
        phi = min((au - flat) / R, math.pi / 2)
        x, y = -s * (flat + R * math.sin(phi)), flat + R * math.cos(phi)
        nx, ny = -s * math.sin(phi), math.cos(phi)
    return (x + nx * OFF, z, -(y + ny * OFF)), (nx, 0.0, -ny)


if 'Mac Studio exhaust' not in by_name:
    ports = doc['meshes'][nodes[by_name['Mac Studio ports and exhaust']]['mesh']]['primitives'][0]
    pa, ia = doc['accessors'][ports['attributes']['POSITION']], doc['accessors'][ports['indices']]
    pv, iv = doc['bufferViews'][pa['bufferView']], doc['bufferViews'][ia['bufferView']]
    assert ia['componentType'] == 5123
    po, io = pv['byteOffset'] + pa.get('byteOffset', 0), iv['byteOffset'] + ia.get('byteOffset', 0)
    height = [struct.unpack_from('<f', bin_, po + 12 * k + 4)[0] for k in range(pa['count'])]
    idx = list(struct.unpack_from(f"<{ia['count']}H", bin_, io))
    keep = [t for k in range(0, len(idx), 3) for t in [idx[k:k + 3]] if not all(height[v] > 40 for v in t)]
    flat = [v for t in keep for v in t]
    struct.pack_into(f'<{len(flat)}H', bin_, io, *flat)      # the ports stay; the holes fall off the end
    print('holes removed:', (len(idx) - len(flat)) // 3, 'triangles')
    ia['count'] = len(flat)

    us = sorted(set([round(-W + 2 * W * k / 64, 3) for k in range(65)] + [-(A - R), A - R, -(W - HH), W - HH]))
    pos, nor, tri = [], [], []
    for u in us:
        du = abs(u) - (W - HH)
        half = HH if du <= 0 else math.sqrt(max(HH * HH - du * du, 0))
        for z in (ZC - half, ZC + half):
            p, n = back(u, z)
            pos.append(p)
            nor.append(n)
    for k in range(len(us) - 1):
        a, b, c, d = 2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 3
        quad = [(a, c, d), (a, d, b)]
        p0, p1, p2 = (pos[v] for v in quad[0])
        e1, e2 = [p1[i] - p0[i] for i in range(3)], [p2[i] - p0[i] for i in range(3)]
        face = (e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0])
        if sum(face[i] * nor[a][i] for i in range(3)) < 0:
            quad = [(t[0], t[2], t[1]) for t in quad]
        tri += [v for t in quad for v in t]
    pview = append(b''.join(struct.pack('<3f', *p) for p in pos), 34962)
    nview = append(b''.join(struct.pack('<3f', *n) for n in nor), 34962)
    iview = append(struct.pack(f'<{len(tri)}H', *tri), 34963)
    lo, hi = [min(p[i] for p in pos) for i in range(3)], [max(p[i] for p in pos) for i in range(3)]
    alu = next(m for m in doc['materials'] if m['name'] == 'Aluminium, bead blasted')['pbrMetallicRoughness']
    # About a third of the real panel is hole, so it reads as the enclosure's aluminium, a third darker.
    doc['materials'].append({'name': 'Exhaust mesh', 'doubleSided': True, 'pbrMetallicRoughness': {
        'baseColorFactor': [round(c * .62, 4) for c in alu['baseColorFactor'][:3]] + [1],
        'metallicFactor': alu['metallicFactor'], 'roughnessFactor': .5}})
    doc['meshes'].append({'name': 'Mac Studio exhaust', 'primitives': [{
        'attributes': {'POSITION': accessor(pview, 5126, len(pos), 'VEC3', lo, hi), 'NORMAL': accessor(nview, 5126, len(nor), 'VEC3')},
        'indices': accessor(iview, 5123, len(tri), 'SCALAR'), 'material': len(doc['materials']) - 1}]})
    nodes.append({'name': 'Mac Studio exhaust', 'mesh': len(doc['meshes']) - 1})
    nodes[by_name['Mac Studio']]['children'].append(len(nodes) - 1)
    print('exhaust panel added:', len(tri) // 3, 'triangles')

# ---------------------------------------------------------------- 2. lid animation
if not any(a.get('name') == 'Lid' for a in doc.get('animations', [])):
    lid = by_name['MacBook lid']
    opened = nodes[lid]['rotation']                       # 72 degrees about x: the screen leans back
    closed = [1.0, 0.0, 0.0, 0.0]                         # 180 degrees: the screen lies face down on the keys
    tview = append(struct.pack('<3f', 0.0, 1.0, 2.0))
    qview = append(struct.pack('<12f', *opened, *closed, *closed))
    doc.setdefault('animations', []).append({'name': 'Lid',
        'samplers': [{'input': accessor(tview, 5126, 3, 'SCALAR', [0.0], [2.0]), 'output': accessor(qview, 5126, 3, 'VEC4'), 'interpolation': 'LINEAR'}],
        'channels': [{'sampler': 0, 'target': {'node': lid, 'path': 'rotation'}}]})
    print('lid animation added')

# ---------------------------------------------------------------- write
while len(bin_) % 4:
    bin_.append(0)
doc['buffers'][0]['byteLength'] = len(bin_)
js = json.dumps(doc, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
js += b' ' * (-len(js) % 4)
out = struct.pack('<4sII', b'glTF', 2, 28 + len(js) + len(bin_)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(bin_), b'BIN\0') + bytes(bin_)
open(PATH, 'wb').write(out)
print('wrote', PATH, len(out), 'bytes')
