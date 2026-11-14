"""Hyunae Park desk scene: Mac Studio, Mac mini, Studio Display, MacBook, Magic Keyboard, Magic Mouse.

Runs in a local Blender 5.2, no add-ons:
  blender -b --factory-startup -P scripts/build-studio-scene.py -- <output dir> [all]

Writes hyunae-mac-studio.glb and hyunae-mac-studio.png (poster). With "all" it also
renders the detail shots used in design mock-ups.

All geometry is procedural and authored for this portfolio, in millimetres, from the
published outer dimensions of each product. No downloaded models, textures or logos.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0]) if argv else os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'assets'))
ALL = 'all' in argv[1:]
SCREENS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'studio-screen')  # screen.html captures
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'


# ---------------------------------------------------------------- materials
def material(name, color, metal=0.0, rough=0.4, emission=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    if coat:
        p.inputs['Coat Weight'].default_value = coat
        p.inputs['Coat Roughness'].default_value = 0.05
    return m


ALU = material('Aluminium, bead blasted', (.80, .81, .82), .92, .34)
ALU_DARK = material('Aluminium, underside', (.55, .56, .57), .9, .45)
BLACK = material('Black glass and ports', (.012, .013, .015), 0, .22)
RUBBER = material('Rubber foot', (.03, .03, .032), 0, .8)
WHITE = material('White keycaps', (.93, .93, .92), 0, .48)
GLOSS = material('White acrylic', (.95, .95, .95), 0, .2, coat=1)
LEGEND = material('Key legends', (.07, .075, .08), 0, .6)
KEY_BLACK = material('Black keycaps', (.02, .021, .023), 0, .5)
LEGEND_LIGHT = material('Light key legends', (.78, .79, .80), 0, .6)
TRACKPAD = material('Trackpad glass', (.70, .71, .72), .6, .28)
LENS = material('Camera lens', (.13, .14, .16), 0, .3)
LED = material('Status light', (.92, .97, .93), 0, .2, 2.5)
DESK = material('Desk', (.66, .67, .68), 0, .6)


# ---------------------------------------------------------------- geometry helpers
def rrect(hx, hy, r, seg=10):
    """Counter-clockwise outline of a rounded rectangle centred on the origin."""
    r = max(min(r, hx - 1e-4, hy - 1e-4), 1e-4)
    pts = []
    for sx, sy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((sx * (hx - r) + r * math.cos(a), sy * (hy - r) + r * math.sin(a)))
    return pts


def circle(r, n=64):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def lift(outline, z, cx=0.0, cy=0.0):
    return [(x + cx, y + cy, z(x, y) if callable(z) else z) for x, y in outline]


def prism_rings(hx, hy, r, z0, z1, top=0.0, bot=0.0, seg=10, steps=5, cx=0.0, cy=0.0):
    """Rounded-rectangle prism with quarter-round fillets on the top and bottom edges."""
    rings = []
    if bot:
        for k in range(steps + 1):
            a = math.pi / 2 * k / steps
            d = bot * (1 - math.sin(a))
            rings.append(lift(rrect(hx - d, hy - d, r - d, seg), z0 + bot * (1 - math.cos(a)), cx, cy))
    else:
        rings.append(lift(rrect(hx, hy, r, seg), z0, cx, cy))
    if top:
        for k in range(steps + 1):
            a = math.pi / 2 * k / steps
            d = top * (1 - math.cos(a))
            rings.append(lift(rrect(hx - d, hy - d, r - d, seg), z1 - top + top * math.sin(a), cx, cy))
    else:
        rings.append(lift(rrect(hx, hy, r, seg), z1, cx, cy))
    return rings


class Part:
    """Collects lofted shells and flat decals into one mesh object."""

    def __init__(self):
        self.bm = bmesh.new()

    def loft(self, rings, top=True, bottom=True):
        vr = [[self.bm.verts.new(p) for p in ring] for ring in rings]
        n = len(vr[0])
        for a, b in zip(vr, vr[1:]):
            for i in range(n):
                j = (i + 1) % n
                self.bm.faces.new((a[i], a[j], b[j], b[i]))
        if bottom:
            self.bm.faces.new(vr[0][::-1])
        if top:
            self.bm.faces.new(vr[-1])
        return self

    def poly(self, pts):
        self.bm.faces.new([self.bm.verts.new(tuple(p)) for p in pts])
        return self

    def text(self, value, size, matrix, align='LEFT', valign='TOP_BASELINE', max_w=None, res=6):
        cu = bpy.data.curves.new('tmp', 'FONT')
        cu.body, cu.size, cu.resolution_u, cu.align_x, cu.align_y = value, size, res, align, valign
        ob = bpy.data.objects.new('tmp', cu)
        scene.collection.objects.link(ob)
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
        if max_w and me.vertices:
            xs = [v.co.x for v in me.vertices]
            w = max(xs) - min(xs)
            if w > max_w:
                me.transform(Matrix.Scale(max_w / w, 4))
        me.transform(matrix)
        self.bm.from_mesh(me)
        bpy.data.objects.remove(ob)
        bpy.data.curves.remove(cu)
        bpy.data.meshes.remove(me)
        return self

    def build(self, name, mat, parent, loc=(0, 0, 0), rot=(0, 0, 0), sharp=40):
        me = bpy.data.meshes.new(name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for p in me.polygons:
            p.use_smooth = True
        try:
            me.set_sharp_from_angle(angle=math.radians(sharp))
        except Exception:
            pass
        me.materials.append(mat)
        ob = bpy.data.objects.new(name, me)
        scene.collection.objects.link(ob)
        ob.parent, ob.location, ob.rotation_euler = parent, loc, rot
        return ob


def screen(name, hw, hh, z, image, parent, cy=0.0):
    """Emissive screen quad textured with a capture of scripts/studio-screen/screen.html."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    tex = m.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(os.path.join(SCREENS, image))
    p.inputs['Base Color'].default_value = (0, 0, 0, 1)
    p.inputs['Roughness'].default_value = .35
    p.inputs['Specular IOR Level'].default_value = .2
    p.inputs['Emission Strength'].default_value = 1.0
    m.node_tree.links.new(tex.outputs['Color'], p.inputs['Emission Color'])
    me = bpy.data.meshes.new(name)
    me.from_pydata([(-hw, cy - hh, z), (hw, cy - hh, z), (hw, cy + hh, z), (-hw, cy + hh, z)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap')
    for i, c in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        uv.data[i].uv = c
    me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    ob.parent = parent
    return ob


def group(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    scene.collection.objects.link(ob)
    ob.parent, ob.location, ob.rotation_euler = parent, loc, rot
    return ob


def wall(a, r, front=False, off=0.25):
    """Maps (u, z) on the outer wall of a rounded-square body to 3D.
    u runs to the viewer's right when the wall is seen from outside; it follows the corner arcs."""
    flat = a - r

    def f(u, z):
        s, au = (1 if u >= 0 else -1), abs(u)
        if au <= flat:
            x, y, nx, ny = -u, a, 0.0, 1.0
        else:
            phi = min((au - flat) / r, math.pi / 2)
            x, y = -s * (flat + r * math.sin(phi)), flat + r * math.cos(phi)
            nx, ny = -s * math.sin(phi), math.cos(phi)
        x, y = x + nx * off, y + ny * off
        return (-x, -y, z) if front else (x, y, z)

    return f


def decal(part, f, u, z, hw, hh, r=None, seg=5):
    """Rounded slot (or circle when hh is None) drawn on a wall."""
    outline = circle(hw, 20) if hh is None else rrect(hw, hh, min(hw, hh) * .92 if r is None else r, seg)
    part.poly([f(u + x, z + y) for x, y in outline])


# ---------------------------------------------------------------- scene
root = group('Hyunae Park desk — Mac Studio, Mac mini, Magic Keyboard, Magic Mouse')
root.scale = (.001, .001, .001)  # everything below is authored in millimetres

Part().loft(prism_rings(570, 300, 28, -26, 0, top=3, bot=3, seg=12)).build('Desk', DESK, root, (0, -20, 0))


def desktop(name, loc, a, r, height, foot_r, foot_h, top_f, bot_f):
    """Shared construction of the Mac Studio and Mac mini enclosures."""
    g = group(name, root, loc)
    Part().loft(prism_rings(a, a, r, foot_h, height, top=top_f, bot=bot_f, seg=18, steps=7)) \
        .build(name + ' enclosure', ALU, g)
    foot = Part()
    foot.loft([lift(circle(foot_r - 1.2), 0), lift(circle(foot_r), 1.2), lift(circle(foot_r), foot_h + 1)], top=False)
    foot.build(name + ' foot', RUBBER, g)
    return g


# Mac Studio: 197 x 197 x 95 mm
studio = desktop('Mac Studio', (400, 100, 0), 98.5, 36, 95, 82, 4.5, 3.0, 5.0)
front, back = wall(98.5, 36, True), wall(98.5, 36)
ports = Part()
for u in (-62, -44):
    decal(ports, front, u, 28, 4.3, 1.4)            # USB-C
decal(ports, front, 32, 28, 12.5, 1.2, .8)          # SDXC slot
for u in (-70, -56, -42, -28):
    decal(ports, back, u, 25, 4.3, 1.4)             # Thunderbolt
decal(ports, back, -8, 26, 7, 5.2, 1.2)             # 10Gb Ethernet
decal(ports, back, 14, 27, 8.2, None)               # power inlet
for u in (36, 54):
    decal(ports, back, u, 25, 6.6, 2.8, .7)         # USB-A
decal(ports, back, 73, 25, 7.4, 2.9, 1)             # HDMI
decal(ports, back, 89, 25, 2.6, None)               # headphone
decal(ports, back, -91, 26, 5.2, None)              # power button
# Rear exhaust: hex-packed perforations inside a stadium outline that follows the corner arcs.
W, HH, PITCH = 80.0, 19.0, 3.3
row, zc = 0, 63.0
z = zc - HH
while z <= zc + HH:
    u = -W + (PITCH / 2 if row % 2 else 0)
    while u <= W:
        du, dz = abs(u) - (W - HH), z - zc
        if (du <= 0 and abs(dz) <= HH - 1) or (du > 0 and du * du + dz * dz <= (HH - 1) ** 2):
            ports.poly([back(u + 1.15 * math.cos(math.radians(60 * k)), z + 1.15 * math.sin(math.radians(60 * k)))
                        for k in range(6)])
        u += PITCH
    z += PITCH * .866
    row += 1
ports.build('Mac Studio ports and exhaust', BLACK, studio)
led = Part()
decal(led, front, 74, 28, .9, None)
led.build('Mac Studio status light', LED, studio)

# Mac mini: 127 x 127 x 50 mm
mini = desktop('Mac mini', (455, -175, 0), 63.5, 27, 50, 50, 4.0, 2.5, 3.5)
front, back = wall(63.5, 27, True), wall(63.5, 27)
ports = Part()
for u in (-40, -27):
    decal(ports, front, u, 23, 4.3, 1.4)            # USB-C
decal(ports, front, -15, 23, 2.4, None)             # headphone
decal(ports, back, -38, 24, 7, 4.2, 3.4)            # power inlet
decal(ports, back, -18, 24.5, 6.6, 5, 1.2)          # Ethernet
decal(ports, back, 2, 24, 7.4, 2.9, 1)              # HDMI
for u in (20, 33, 46):
    decal(ports, back, u, 24, 4.3, 1.4)             # Thunderbolt
decal(ports, back, 0, 9.5, 46, 1.1, .9)             # exhaust slot
ports.build('Mac mini ports', BLACK, mini)
led = Part()
decal(led, front, 47, 23, .8, None)
led.build('Mac mini status light', LED, mini)

# Studio Display: 623 x 362 mm panel, 3 degrees of tilt, L-shaped stand.
display = group('Studio Display', root, (-50, 140, 0))
Part().loft(prism_rings(91, 84, 10, 0, 7.5, top=1.2, bot=.6, seg=8)).build('Display foot', ALU, display, (0, -51.5, 0))
Part().loft(prism_rings(48, 5.5, 2.2, 6, 252, seg=6)).build('Display neck', ALU, display, (0, 27, 0))
Part().loft(prism_rings(30, 7, 2, 214, 262, seg=6)).build('Display hinge', ALU, display, (0, 20, 0))
panel = group('Display panel', display, (0, 0, 286), (math.radians(87), 0, 0))
Part().loft(prism_rings(311.5, 181, 9, -19, 0, top=.5, bot=3, seg=10)).build('Display housing', ALU, panel)
Part().loft([lift(rrect(310.6, 180.1, 8.2, 10), .02), lift(rrect(310.6, 180.1, 8.2, 10), .35)], bottom=False) \
    .build('Display glass', BLACK, panel)
screen('Display screen', 299, 168.2, .4, 'display.png', panel)
Part().poly(lift(circle(1.6, 16), .5, 0, 174.5)).build('Display camera', LENS, panel)

# Magic Keyboard: 278.9 x 114.9 mm, 4.1 mm at the front edge rising to 10.9 mm at the back.
KW, KD, T0, T1 = 278.9, 114.9, 4.1, 10.9
tilt = math.atan((T1 - T0) / KD)
mid = (T0 + T1) / 2
under = lambda x, y: -(mid + y * math.tan(tilt))           # underside, in the deck's own frame
keyboard = group('Magic Keyboard', root, (-30, -215, mid * math.cos(tilt)), (tilt, 0, 0))
body = Part()
body.loft([lift(rrect(KW / 2 - 1.6, KD / 2 - 1.6, 10.4, 8), lambda x, y: under(x, y)),
           lift(rrect(KW / 2, KD / 2, 12, 8), lambda x, y: under(x, y) + 1.6),
           lift(rrect(KW / 2, KD / 2, 12, 8), -.7),
           lift(rrect(KW / 2 - .7, KD / 2 - .7, 11.3, 8), 0)])
body.build('Keyboard body', ALU, keyboard)

U, GAP = 19.0, 2.5
x_left = -14.5 * U / 2
keys, legends = Part(), Part()
KY = KZ = 0.0   # where the key block sits inside its parent


def key(cx, cy, w, h, label=None, size=5.2):
    hx, hy = w / 2, h / 2
    cy += KY
    keys.loft([lift(rrect(hx, hy, 1.9, 4), KZ, cx, cy), lift(rrect(hx, hy, 1.9, 4), KZ + 1.15, cx, cy),
               lift(rrect(hx - .4, hy - .4, 1.5, 4), KZ + 1.55, cx, cy)], bottom=False)
    if label:
        legends.text(label, size, Matrix.Translation((cx, cy, KZ + 1.75)), align='CENTER', valign='CENTER', res=3)


def key_row(cy, spec, h=U - GAP):
    x = x_left
    for width, label in spec:
        if label is not None:
            small = len(label) > 1
            key(x + width * U / 2, cy, width * U - GAP, h, label or None, 2.6 if small else 5.2)
        x += width * U


def layout_keys():
    fn_w = 14.5 / 14
    key_row(47.5, [(fn_w, t) for t in ['esc'] + ['F%d' % i for i in range(1, 13)] + ['']], h=10.0)
    key_row(31.8, [(1, c) for c in '`1234567890-='] + [(1.5, 'delete')])
    key_row(12.8, [(1.5, 'tab')] + [(1, c) for c in 'QWERTYUIOP[]\\'])
    key_row(-6.2, [(1.75, 'caps lock')] + [(1, c) for c in "ASDFGHJKL;'"] + [(1.75, 'return')])
    key_row(-25.2, [(2.25, 'shift')] + [(1, c) for c in 'ZXCVBNM,./'] + [(2.25, 'shift')])
    key_row(-44.2, [(1, 'fn'), (1, 'control'), (1, 'option'), (1.25, 'command'), (5, ''), (1.25, 'command'), (1, 'option')])
    half = (U - GAP - 1.2) / 2
    ax = x_left + 11.5 * U
    for i, (dx, dy) in enumerate(((0, -1), (1, 1), (1, -1), (2, -1))):   # left, up, down, right
        key(ax + (dx + .5) * U, -44.2 + dy * (half + 1.2) / 2, U - GAP, half)


layout_keys()
keys.build('Keyboard keycaps', WHITE, keyboard, sharp=60)
legends.build('Keyboard legends', LEGEND, keyboard)

# Magic Mouse: 113.5 x 57.1 x 21.6 mm. One continuous acrylic top over a shallow aluminium base.
mouse = group('Magic Mouse', root, (225, -215, 0))
MX, MY, EDGE, APEX = 28.55, 56.75, 6.4, 21.6
sup = lambda a, b, n=2.9, cnt=96: [(a * math.copysign(abs(math.cos(t)) ** (2 / n), math.cos(t)),
                                    b * math.copysign(abs(math.sin(t)) ** (2 / n), math.sin(t)))
                                   for t in (2 * math.pi * i / cnt for i in range(cnt))]
top = Part()
rings = [lift(sup(MX - 1.3, MY - 1.3), EDGE - 1.5), lift(sup(MX - .35, MY - .35), EDGE - .6)]
for s in (1, .985, .95, .9, .82, .72, .6, .47, .34, .22, .12, .05, .015):
    rings.append(lift(sup(MX * s, MY * s), EDGE + (APEX - EDGE) * (1 - s ** 2.3)))
top.loft(rings, bottom=False)
top.build('Mouse top', GLOSS, mouse, sharp=80)
base = Part()
base.loft([lift(sup(MX - 5, MY - 5), .8), lift(sup(MX - 2.6, MY - 2.6), 2.4), lift(sup(MX - 1.4, MY - 1.4), EDGE - 1.4)],
          top=False)
base.build('Mouse base', ALU, mouse)
rails = Part()
for sx in (-1, 1):
    rails.loft(prism_rings(1.6, 40, 1.4, 0, 1.0, seg=4, cx=sx * 17))
rails.build('Mouse rails', RUBBER, mouse)

# MacBook Air 13": 304.1 x 215 x 11.3 mm closed. Open at 108 degrees, turned slightly toward the centre.
macbook = group('MacBook', root, (-390, -172, 0), (0, 0, math.radians(8)))
BASE = 7.6
Part().loft(prism_rings(152.05, 107.5, 11, .8, BASE, top=.5, bot=2.6, seg=10)).build('MacBook base', ALU, macbook)
Part().poly(lift(rrect(65, 40.5, 4, 6), BASE + .06, 0, -61)).build('MacBook trackpad', TRACKPAD, macbook)
Part().loft(prism_rings(118, 3.4, 3, BASE - 3, BASE + 2.2, seg=4, cy=103.5)).build('MacBook hinge', ALU_DARK, macbook)
keys, legends, KY, KZ = Part(), Part(), 37.0, BASE - .9
layout_keys()
keys.build('MacBook keycaps', KEY_BLACK, macbook, sharp=60)
legends.build('MacBook legends', LEGEND_LIGHT, macbook)
lid = group('MacBook lid', macbook, (0, 105, BASE + 1.2), (math.radians(72), 0, 0))
Part().loft(prism_rings(152.05, 106, 11, -3.6, 0, top=.4, bot=1.6, seg=10, cy=107)).build('MacBook lid shell', ALU, lid)
Part().loft([lift(rrect(150.7, 104.7, 9.8, 10), .02, 0, 107), lift(rrect(150.7, 104.7, 9.8, 10), .3, 0, 107)], bottom=False)     .build('MacBook glass', BLACK, lid)
screen('MacBook screen', 143.5, 89.7, .34, 'macbook.png', lid, cy=109.5)
Part().poly(lift(circle(1.3, 16), .36, 0, 205.5)).build('MacBook camera', LENS, lid)

# ---------------------------------------------------------------- export
glb = os.path.join(OUT, 'hyunae-mac-studio.glb')
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', export_apply=True, export_yup=True,
                          export_cameras=False, export_lights=False,
                          export_image_format='JPEG', export_image_quality=90)
meshes = [o for o in scene.objects if o.type == 'MESH']
print('GLB', glb, os.path.getsize(glb), 'bytes,', len(meshes), 'meshes,',
      sum(len(o.data.polygons) for o in meshes), 'faces')

# ---------------------------------------------------------------- render
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = int(os.environ.get('SAMPLES', '160'))
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_percentage = 100
try:
    scene.render.image_settings.media_type = 'IMAGE'
except Exception:
    pass
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
try:
    scene.view_settings.view_transform = 'Khronos PBR Neutral'
except Exception:
    scene.view_settings.view_transform = 'Standard'
world = bpy.data.worlds.new('Studio ambient')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (.92, .94, .96, 1)
bg.inputs['Strength'].default_value = .2
scene.world = world


def aim(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat('-Z', 'Y').to_euler()


def light(name, loc, target, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.size, d.color, d.shape = energy, size, color, 'DISK'
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    aim(o, target)


light('Key softbox', (-.9, -1.0, 1.5), (0, 0, .1), 30, .9, (1, .98, .95))
light('Fill', (1.2, -.5, .8), (.2, 0, .1), 7, 1.0, (.93, .96, 1))
light('Rim', (.3, 1.1, 1.0), (0, 0, .2), 22, .9)


def shot(name, loc, target, size, ortho=None, lens=70):
    cd = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cd)
    scene.collection.objects.link(cam)
    cam.location = loc
    aim(cam, target)
    if ortho:
        cd.type, cd.ortho_scale = 'ORTHO', ortho
    else:
        cd.lens = lens
    cd.clip_start, cd.clip_end = .05, 20
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('RENDER', scene.render.filepath)


shot('hyunae-mac-studio', (.62, -1.65, .96), (-.02, -.03, .19), (1400, 900), ortho=1.36)
if ALL:
    shot('studio-front', (0, -2.4, .62), (-.03, -.02, .19), (1600, 900), lens=66)
    shot('studio-macs', (.95, -.62, .34), (.36, .02, .05), (1200, 900), lens=85)
    shot('studio-macbook', (-.05, -.95, .50), (-.37, -.13, .09), (1400, 1000), lens=85)
    shot('studio-mini', (1.0, -.78, .34), (.44, -.14, .02), (1200, 900), lens=90)
    shot('studio-keys', (.06, -.62, .62), (.06, -.20, 0), (1600, 900), lens=70)
    shot('studio-back', (.75, 1.25, .55), (.2, .1, .1), (1200, 900), lens=85)
