"""Greeting intro for the desk scene: she sits at the keyboard with her back to the viewer and types,
swivels round, waves, bows, and the page then fades her out.

blender -b --factory-startup -P scripts/build-avatar-intro.py -- scripts/avatar/hyunae-avatar-cardigan.source.glb assets/hyunae-mac-studio.glb assets/hyunae-avatar.glb [frame dir]

The source GLB is an auto-rigged, textured mesh generated with Higgsfield (Meshy image-to-3D) from a
reference image of the site owner; see assets/hyunae-avatar.source.json. Only the animation is authored here.
Pass a frame dir to also render preview frames over the desk scene.

The exported avatar GLB shares the desk scene's coordinates (metres, desk top at z = 0), so the page can
layer it over the desk model with the same camera.
"""
import bpy, sys, os, math
from mathutils import Vector, Matrix, Quaternion

args = sys.argv[sys.argv.index('--') + 1:]
src, desk_glb, out_glb = args[:3]
out_dir = args[3] if len(args) > 3 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
for o in [o for o in sc.objects if o.type == 'MESH' and not any(m.type == 'ARMATURE' for m in o.modifiers)]:
    bpy.data.objects.remove(o)                      # helper sphere shipped with the rig
arm.animation_data_clear()
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
avatar = list(sc.objects)
PB = arm.pose.bones
FPS, END = 24, 240
sc.render.fps, sc.frame_start, sc.frame_end = FPS, 1, END
HIP_REST = (arm.matrix_world @ arm.data.bones['Hips'].head_local).z
arm.location = (-.03, -.52, -.05 - HIP_REST)       # seated in front of the keyboard, hips 5 cm below the desk top


def reset():
    for pb in PB:
        pb.rotation_mode = 'QUATERNION'
        pb.location, pb.rotation_quaternion, pb.scale = (0, 0, 0), (1, 0, 0, 0), (1, 1, 1)
    bpy.context.view_layer.update()


def turn(name, q):
    """Rotate a pose bone about its own head by a quaternion given in armature space."""
    pb = PB[name]
    m = pb.matrix.copy()
    h = m.translation.copy()
    pb.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ m
    bpy.context.view_layer.update()


def aim(name, child, target):
    """Point the segment from this bone to its child bone along an armature-space direction."""
    cur = (PB[child].matrix.translation - PB[name].matrix.translation).normalized()
    turn(name, cur.rotation_difference(Vector(target).normalized()))


smooth = lambda x: (lambda t: t * t * (3 - 2 * t))(min(max(x, 0.0), 1.0))
env = lambda f, a, b: smooth((f - a) / (b - a))
mix = lambda a, b, t: Vector(a).lerp(Vector(b), t)
X = Vector((1, 0, 0))


def pose(f):
    """Directions are written for a body facing -Y (the viewer), right arm on -X, then yawed with the stool."""
    reset()
    yaw = math.pi * (1 - env(f, 80, 102))                       # 180 deg = facing the display
    typing = 1 - env(f, 74, 92)
    raise_ = env(f, 100, 114) * (1 - env(f, 160, 176))
    swing = math.sin(2 * math.pi * (f - 114) / 19.2) * env(f, 112, 118) * (1 - env(f, 154, 160))
    bow = env(f, 178, 196) * (1 - env(f, 206, 224))
    notice = env(f, 68, 78) * (1 - env(f, 84, 100))             # the head starts the turn
    lean = .10 * typing + .42 * bow
    Z = Quaternion((0, 0, 1), yaw)
    L = lambda v: Z @ Vector(v)
    pitch = lambda a: Quaternion(L(X), a)                        # positive = forward
    turn('Hips', Z)
    for side, s in (('Left', 1), ('Right', -1)):
        aim(side + 'UpLeg', side + 'Leg', L((.07 * s, -1, -.05)))
        aim(side + 'Leg', side + 'Foot', L((0, -.06, -1)))
        aim(side + 'Foot', side + 'ToeBase', L((0, -1, -.25)))
    turn('Spine02', pitch(lean * .5))
    turn('Spine01', pitch(lean * .3))
    turn('Spine', pitch(lean * .2))
    turn('neck', pitch(bow * .22))
    turn('Head', Quaternion((0, 0, 1), -.55 * notice) @ Quaternion(L((0, 1, 0)), math.radians(6) * raise_)
         @ pitch(bow * .15 - .05 * typing))
    torso = Quaternion(X, lean * .85)                            # arms follow the leaning torso
    for side, s in (('Left', 1), ('Right', -1)):
        tap = .05 * math.sin(2 * math.pi * f / 5 + (0 if s > 0 else math.pi)) * typing
        upper = mix((.14 * s, -.08, -1), (.14 * s, -.30, -1), typing)
        fore = mix((-.24 * s, -.8, -.55), (-.16 * s, -1, .0 + tap), typing)
        if s < 0:                                               # the right hand waves
            upper = mix(upper, (-.55, -.42, -.50), raise_)
            fore = mix(fore, (-.02 - .22 * swing, -.28, 1), raise_)
        aim(side + 'Arm', side + 'ForeArm', L(torso @ upper))
        aim(side + 'ForeArm', side + 'Hand', L(torso @ fore))
    turn('RightHand', Quaternion(L((0, 1, 0)), math.radians(-14) * swing * raise_))


KEYED = [b.name for b in PB if b.name not in ('head_end', 'headfront')]
last = {}
for f in range(1, END + 1):
    pose(f)
    for n in KEYED:
        q = PB[n].rotation_quaternion.copy()
        if n in last and q.dot(last[n]) < 0:
            q.negate()
            PB[n].rotation_quaternion = q
        last[n] = q
        PB[n].keyframe_insert('rotation_quaternion', frame=f)
arm.animation_data.action.name = 'Intro'
import tempfile
for i, img in enumerate(bpy.data.images):          # re-encode the baked texture as JPEG; the PNG is most of the file
    if img.size[0]:
        img.filepath_raw = os.path.join(tempfile.gettempdir(), 'hyunae-avatar-tex-%d.jpg' % i)
        img.file_format = 'JPEG'
        sc.render.image_settings.quality = 86
        img.save()
        if img.packed_file:
            img.unpack(method='REMOVE')
        img.source = 'FILE'
        img.reload()
for o in sc.objects:
    o.select_set(o in avatar)
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_yup=True, export_animations=True, use_selection=True,
                          export_cameras=False, export_lights=False, export_image_format='JPEG', export_image_quality=82)
print('GLB', out_glb, os.path.getsize(out_glb))

if not out_dir:
    sys.exit()
os.makedirs(out_dir, exist_ok=True)
# ------------------------------------------------------------ preview frames: desk once, avatar per frame
bpy.ops.import_scene.gltf(filepath=desk_glb)
desk = [o for o in sc.objects if o not in avatar]
sc.render.engine = 'BLENDER_EEVEE'
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = 960, 640
sc.render.image_settings.file_format, sc.render.image_settings.color_mode = 'PNG', 'RGBA'
try:
    sc.view_settings.view_transform = 'Standard'
except Exception:
    pass
w = bpy.data.worlds.new('w')
sc.world = w
w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value = .85
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
sun.data.energy, sun.rotation_euler = 1.6, (math.radians(50), 0, math.radians(-30))
sc.collection.objects.link(sun)
cd = bpy.data.cameras.new('c')
cam = bpy.data.objects.new('c', cd)
sc.collection.objects.link(cam)
sc.camera = cam
cd.sensor_fit, cd.angle = 'VERTICAL', math.radians(30)
target, az, pol, dist = Vector((-.02, -.12, .20)), math.radians(18), math.radians(67), 2.05   # the page's camera-orbit
cam.location = target + dist * Vector((math.sin(pol) * math.sin(az), -math.sin(pol) * math.cos(az), math.cos(pol)))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()


def show(objs, on):
    for o in objs:
        o.hide_render = not on


show(avatar, False)
sc.render.filepath = os.path.join(out_dir, 'desk.png')
bpy.ops.render.render(write_still=True)
show(avatar, True)
show(desk, False)
for f in range(1, END + 1, 2):
    sc.frame_set(f)
    sc.render.filepath = os.path.join(out_dir, 'a%03d.png' % f)
    bpy.ops.render.render(write_still=True)
print('FRAMES done')
