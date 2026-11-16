"""Method 2: replace the avatar's head with a head reconstructed from a close-up, keeping the rigged body.
blender -b --factory-startup -P attach_head.py -- <body.glb> <head bust.glb> <out.glb> [cut z] [body head weight]

Landmarks were read off 1000 px front orthographic renders (head_render.py):
  body  (centre x 0, z 1.5, 0.4 m across): eyes (413, 625) (578, 625), mouth y 787
  bust  (centre x 0, z 0,   2.0 units across): eyes (438, 394) (555, 394), mouth y 507"""
import bpy, sys
import numpy as np
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]
body_glb, head_glb, out = a[:3]
CUT = float(a[3]) if len(a) > 3 else 1.318          # the bust is kept above this height (just above its collar)
HEADW = float(a[4]) if len(a) > 4 else .5           # body vertices with more Head weight than this are removed
b_eye = [((413 / 1000 - .5) * .4, 1.5 + (.5 - .625) * .4), ((578 / 1000 - .5) * .4, 1.5 + (.5 - .625) * .4)]
b_mouth_z = 1.5 + (.5 - .787) * .4
EX1, EX2, EY, MY = (float(v) for v in a[5:9]) if len(a) > 8 else (438, 555, 394, 507)   # bust landmarks, px
h_eye = [((EX1 / 1000 - .5) * 2, (.5 - EY / 1000) * 2), ((EX2 / 1000 - .5) * 2, (.5 - EY / 1000) * 2)]
h_mouth_z = (.5 - MY / 1000) * 2
s = (((b_eye[1][0] - b_eye[0][0]) * (b_eye[0][1] - b_mouth_z)) / ((h_eye[1][0] - h_eye[0][0]) * (h_eye[0][1] - h_mouth_z))) ** .5
tx = (b_eye[0][0] + b_eye[1][0]) / 2 - s * (h_eye[0][0] + h_eye[1][0]) / 2
tz = b_eye[0][1] - s * h_eye[0][1]

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=body_glb)
arm = next(o for o in sc.objects if o.type == 'ARMATURE')
body = next(o for o in sc.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers))
before = set(sc.objects)
bpy.ops.import_scene.gltf(filepath=head_glb)
head = next(o for o in sc.objects if o not in before and o.type == 'MESH')
head.name = 'head'


def world(o):
    n = len(o.data.vertices)
    co = np.empty(n * 3, dtype=np.float32)
    o.data.vertices.foreach_get('co', co)
    m = np.array(o.matrix_world)
    return co.reshape(n, 3) @ m[:3, :3].T + m[:3, 3]


def nose_y(co, eye_z, mouth_z, cx, halfw):
    m = (co[:, 2] < eye_z) & (co[:, 2] > mouth_z) & (abs(co[:, 0] - cx) < halfw)
    return co[m, 1].min()                           # both models face -Y


bw = world(body)
hw = world(head)
ty = nose_y(bw, b_eye[0][1], b_mouth_z, 0, .012) - s * nose_y(hw, h_eye[0][1], h_mouth_z, (h_eye[0][0] + h_eye[1][0]) / 2, .012 / s)
head.matrix_world = Matrix.Translation((tx, ty, tz)) @ Matrix.Scale(s, 4) @ head.matrix_world
bpy.context.view_layer.update()
bpy.context.view_layer.objects.active = head
for o in sc.objects:
    o.select_set(o is head)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print('ALIGN scale %.4f offset %.4f %.4f %.4f' % (s, tx, ty, tz))

# drop the old head (everything that follows the Head bone) and the bust below its neck
gi = body.vertex_groups['Head'].index
kill = [v.index for v in body.data.vertices if any(g.group == gi and g.weight > HEADW for g in v.groups)
        or (bw[v.index, 2] > 1.335 and abs(bw[v.index, 0]) < .15)       # nothing of the old head above the neck
        or (bw[v.index, 1] > .07 and bw[v.index, 2] > 1.308 and any(g.group == gi and g.weight > .2 for g in v.groups))]   # old hair on the nape
import bmesh


def tex_of(o):
    return next(n.image for n in o.data.materials[0].node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)


def vert_colours(o, co, keep):
    im = tex_of(o)
    w_, h_ = im.size
    pxl = np.array(im.pixels[:], dtype=np.float32).reshape(h_, w_, 4)
    uvs = o.data.uv_layers.active.data
    seen, out = set(), []
    for l in o.data.loops:
        vi = l.vertex_index
        if vi in seen or not keep(co[vi]):
            continue
        seen.add(vi)
        u = uvs[l.index].uv
        out.append(pxl[min(int(u[1] % 1 * h_), h_ - 1), min(int(u[0] % 1 * w_), w_ - 1), :3])
    out = np.array(out)
    skin = out[(out.mean(1) > .62) & (out[:, 0] - out[:, 2] > .03)]
    return np.median(skin, axis=0), len(skin)


# shift the body's skin (neck and hands) to the new head's skin tone so the join does not show
hc0 = world(head)
h_mean, hn = vert_colours(head, hc0, lambda c: CUT < c[2] < CUT + .03 and c[1] < .06 and abs(c[0]) < .04)
b_mean, bn = vert_colours(body, bw, lambda c: 1.27 < c[2] < 1.31 and abs(c[0]) < .04 and c[1] < .06)
gain = np.clip(h_mean / b_mean, .7, 1.4)
bi = tex_of(body)
BP = np.array(bi.pixels[:], dtype=np.float32).reshape(bi.size[1], bi.size[0], 4)
rgb = BP[..., :3]
m = (rgb.mean(-1) > .42) & (rgb[..., 0] - rgb[..., 2] > .05)
rgb[m] = np.clip(rgb[m] * gain, 0, 1)
bi.pixels.foreach_set(BP.ravel())
bi.update()
bi.pack()
print('TONE gain', [round(float(g), 3) for g in gain], 'samples', hn, bn, 'texels', int(m.sum()))
# hair ends of the old head still lie on the back of the collar: find them by their brown texture colour
img = tex_of(body)
IW, IH = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(IH, IW, 4)
uvl = body.data.uv_layers.active.data
vuv = {}
for l in body.data.loops:
    vuv.setdefault(l.vertex_index, uvl[l.index].uv)
dead = set(kill)
brown = 0
for vi, uvc in vuv.items():
    x, y, z = bw[vi]
    back = y > .045 and 1.2 < z < 1.34 and abs(x) < .13
    sides = 1.26 < z < 1.34 and .03 < abs(x) < .13        # tips of the old side strands, clear of the button
    if vi in dead or not (back or sides):
        continue
    r, g, b_, _ = px[min(int(uvc[1] % 1 * IH), IH - 1), min(int(uvc[0] % 1 * IW), IW - 1)]
    if r - b_ > .035 and (r + g + b_) / 3 < .55:
        kill.append(vi)
        brown += 1
print('BROWN', brown)
# below the cut, keep only a neck-wide plug that reaches down inside the body's collar
hc = world(head)
band = hc[(hc[:, 2] > CUT) & (hc[:, 2] < CUT + .015)]
ncx, ncy = band[:, 0].mean(), band[:, 1].mean()
nr = np.percentile(np.hypot(band[:, 0] - ncx, band[:, 1] - ncy), 90) + .003
drop = (hc[:, 2] < CUT - .07) | ((hc[:, 2] < CUT) & ((np.hypot(hc[:, 0] - ncx, hc[:, 1] - ncy) > nr)))
print('NECK centre %.3f %.3f radius %.3f' % (ncx, ncy, nr))


def vcols(o):
    """Texture colour under each vertex."""
    im = tex_of(o)
    w_, h_ = im.size
    pxl = np.array(im.pixels[:], dtype=np.float32).reshape(h_, w_, 4)
    nl = len(o.data.loops)
    li = np.empty(nl, dtype=np.int32)
    o.data.loops.foreach_get('vertex_index', li)
    uvs = np.empty(nl * 2, dtype=np.float32)
    o.data.uv_layers.active.data.foreach_get('uv', uvs)
    uvs = uvs.reshape(nl, 2) % 1
    c = np.zeros((len(o.data.vertices), 3), np.float32)
    c[li] = pxl[np.minimum((uvs[:, 1] * h_).astype(int), h_ - 1), np.minimum((uvs[:, 0] * w_).astype(int), w_ - 1), :3]
    return c


def put_world(o, w):
    m = np.array(o.matrix_world)
    local = (w - m[:3, 3]) @ np.linalg.inv(m[:3, :3]).T
    o.data.vertices.foreach_set('co', local.astype(np.float32).ravel())
    o.data.update()


sm = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))
is_skin = lambda c: (c.mean(1) > .5) & (c[:, 0] - c[:, 2] > .02)
hcol, bcol = vcols(head), vcols(body)
AX, AY = 0.0, .045                                   # neck axis
# the plug loses the dark pieces of the bust's collar that would poke out above the body's collar
drop |= (hc[:, 2] < CUT) & (hcol.mean(1) < .3) & (hc[:, 1] < AY + .02)
# a spike of the body's collar left standing beside the neck
kill += [int(i) for i in np.nonzero((bw[:, 2] > 1.312) & (bcol.mean(1) < .35) & (np.hypot(bw[:, 0] - AX, bw[:, 1] - AY) < .1) & (bw[:, 1] < AY + .02))[0]]
# below the collar line the plug must not reach back past the collar liner, or its skin shows through gaps there
drop |= (hc[:, 2] < CUT - .008) & (hc[:, 1] > AY + .05)
# loose strand ends that hang beside the neck read as specks at page size
drop |= (hc[:, 2] < 1.34) & (hcol.mean(1) < .45) & (hc[:, 1] < AY + .03)
# a slimmer neck: pull both meshes toward the neck axis between the collar and the jaw
NECK, CHEST, WIDTH = 0.0, .85, .16          # the neck is left at its original width
for ob, w, col in ((head, hc, None), (body, bw, bcol)):
    r = np.hypot(w[:, 0] - AX, w[:, 1] - AY)
    lo = 1.262 if col is None else 1.29              # the body is only narrowed above its collar, and only its skin
    k = sm((w[:, 2] - lo) / .03) * (1 - sm((w[:, 2] - 1.33) / .022)) * (1 - sm((r - .072) / .02))
    if col is not None:
        k = k * ((col.mean(1) > .5) & (col[:, 0] - col[:, 2] > .08))
    w[:, 0] = AX + (w[:, 0] - AX) * (1 - NECK * k)
    fr = w[:, 1] < AY                                # the nape stays where it is, against the collar
    w[fr, 1] = AY + (w[fr, 1] - AY) * (1 - NECK * k[fr])
# a smaller chest: flatten what stands out in front of a line from the waist to the collarbone
arms = [body.vertex_groups[n].index for n in ('LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand')]
# the chest and the sides of the torso were half-skinned to the upper arms, so they ballooned and were dragged
# along whenever an arm moved: hand that share to the spine bones the vertex already follows, fading out toward
# the arm itself and, at the sides and back, toward the shoulder
spine = {body.vertex_groups[n].index: body.vertex_groups[n] for n in ('Hips', 'Spine', 'Spine01', 'Spine02') if n in body.vertex_groups}
far = arms[1:3] + arms[4:6]
sp = body.vertex_groups['Spine01']
moved = 0
for v in body.data.vertices:
    x, y, z = bw[v.index]
    if not (.93 < z < 1.27) or any(g.group in far and g.weight > .3 for g in v.groups):
        continue
    f = 1 - float(sm(np.array((abs(x) - .13) / .04)))
    if not (y < .01 and z > 1.03):
        f *= (1 - float(sm(np.array((z - 1.20) / .06)))) * float(sm(np.array((z - .93) / .04)))
    if f <= 0:
        continue
    take = 0.0
    for g in v.groups:
        if g.group in arms:
            take += g.weight * f
            g.weight *= 1 - f
    if take > 0:
        own = [(g.group, g.weight) for g in v.groups if g.group in spine and g.weight > 0]
        tot = sum(w for _, w in own)
        if tot > .05:
            for gi_, w in own:
                spine[gi_].add([v.index], take * w / tot, 'ADD')
        else:
            sp.add([v.index], take, 'ADD')
        moved += 1
print('RESKIN', moved)
on_arm = np.array([any(g.group in arms and g.weight > .8 for g in v.groups) for v in body.data.vertices])
ref = -.104 + (bw[:, 2] - 1.04) * (.040 / .20)
k = sm((bw[:, 2] - 1.03) / .05) * (1 - sm((bw[:, 2] - 1.21) / .05)) * (1 - sm((abs(bw[:, 0]) - .16) / .03)) * ~on_arm
front = bw[:, 1] < ref
bw[front, 1] = ref[front] + (bw[front, 1] - ref[front]) * (1 - CHEST * k[front])
# and narrower: seen from above, the outline comes from the sides of the chest, not its front
bw[:, 0] *= 1 - WIDTH * k * sm((.03 - bw[:, 1]) / .06)
put_world(head, hc)
put_world(body, bw)


def vuvs(o):
    nl = len(o.data.loops)
    li = np.empty(nl, dtype=np.int32)
    o.data.loops.foreach_get('vertex_index', li)
    uvs = np.empty(nl * 2, dtype=np.float32)
    o.data.uv_layers.active.data.foreach_get('uv', uvs)
    out = np.zeros((len(o.data.vertices), 2), np.float32)
    out[li] = uvs.reshape(nl, 2)
    return out


# Holes: the join leaves gaps beside the neck and in the back of the collar. Two liners sit just inside the
# surfaces, so that any gap shows skin (neck) or black knit (collar) instead of the page behind.
# the body's own skin behind the neck only shows where the collar has a gap: drop it, so the gap shows the black liner
kill += [int(i) for i in np.nonzero(is_skin(bcol) & (bw[:, 1] > AY + .02) & (bw[:, 2] > 1.26) & (np.hypot(bw[:, 0] - AX, bw[:, 1] - AY) < .13))[0]]
# dark scraps standing in the open neckline, where the collar is well below them
kill += [int(i) for i in np.nonzero((bcol.mean(1) < .35) & (bw[:, 2] > 1.296) & (abs(bw[:, 0]) < .05) & (bw[:, 1] < AY))[0]]
pick = np.nonzero((hc[:, 2] > CUT + .004) & (hc[:, 2] < CUT + .02) & (abs(hc[:, 0]) < .025) & (hc[:, 1] < .02)
                  & (hcol.mean(1) > .62) & (hcol[:, 0] - hcol[:, 2] > .03))[0]
skin_uv = vuvs(head)[pick[np.argsort(hcol[pick].mean(1))[len(pick) // 2]]]
pick = np.nonzero((bw[:, 2] > 1.18) & (bw[:, 2] < 1.24) & (abs(bw[:, 0]) < .06) & (bw[:, 1] > .1) & (bcol.mean(1) < .12))[0]
black_uv = vuvs(body)[pick[len(pick) // 2]]
print('LINER uv skin', skin_uv.round(3), 'black', black_uv.round(3))
# measure the new neck where it is bare, so the skin liner can sit a little inside it all the way round
neck_rings = []
hskin = (hcol.mean(1) > .55) & (hcol[:, 0] - hcol[:, 2] > .03)
for zr in (1.312, 1.322, 1.332):
    m = hskin & (abs(hc[:, 2] - zr) < .006) & (abs(hc[:, 0]) < .09)
    x0, x1 = np.percentile(hc[m, 0], [4, 96])
    y0, y1 = np.percentile(hc[m, 1], [4, 96])
    neck_rings.append((zr, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 * .86, (y1 - y0) / 2 * .86))
    print('RING z %.3f centre %.3f %.3f half %.3f %.3f' % neck_rings[-1])
print('SHAPE neck -%d%% chest -%d%%, chest verts moved %d' % (NECK * 100, CHEST * 100, int((front & (k > .01)).sum())))
for ob, idx in ((body, kill), (head, [int(i) for i in np.nonzero(drop)[0]])):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in sorted(set(idx))], context="VERTS")
    bm.to_mesh(ob.data)
    bm.free()
    print('CUT', ob.name, len(idx), 'left', len(ob.data.vertices))
# Surfaces. The generated body has under 7,000 distinct points, so limbs read as faceted tubes, and both meshes
# carry imported split normals and some flat-shaded faces. Weld the UV-seam duplicates, shade everything smooth,
# split every body edge once (UVs and bone weights are interpolated), slim the wrists and relax the surfaces.
WRIST = .22                                          # wrist radius; the forearm keeps its width


def weld(ob, split=None):
    """split: None, True (every edge) or a per-vertex mask (edges whose two ends are both set)."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    if split is not None:
        edges = bm.edges[:] if split is True else [e for e in bm.edges if split[e.verts[0].index] and split[e.verts[1].index]]
        bmesh.ops.subdivide_edges(bm, edges=edges, cuts=1, use_grid_fill=True)
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.verts.ensure_lookup_table()
    bm.to_mesh(ob.data)
    nb = [[e.other_vert(v).index for e in v.link_edges] for v in bm.verts]
    bm.free()
    for name in ('custom_normal', 'sharp_edge', 'sharp_face'):
        if name in ob.data.attributes:
            ob.data.attributes.remove(ob.data.attributes[name])
    ob.data.polygons.foreach_set('use_smooth', [True] * len(ob.data.polygons))
    return nb


def relax(co, nb, free, rounds):
    """Taubin smoothing: relax, then push back out, so nothing shrinks. free is 0..1 per vertex."""
    for _ in range(rounds):
        for lam in (.5, -.53):
            avg = np.array([co[n].mean(0) if n else co[i] for i, n in enumerate(nb)])
            co += (avg - co) * (lam * free)[:, None]


nb = weld(body, True)
nv = len(body.data.vertices)
bw = world(body)
amw = arm.matrix_world
vg = {g.index: g.name for g in body.vertex_groups}
wts = [{vg[g.group]: g.weight for g in v.groups} for v in body.data.vertices]
keep = np.zeros(nv)                                  # 1 = leave exactly where it is
for side in ('Left', 'Right'):
    el = np.array(amw @ arm.data.bones[side + 'ForeArm'].head_local)
    wr = np.array(amw @ arm.data.bones[side + 'Hand'].head_local)
    ax = wr - el
    ln = np.linalg.norm(ax)
    ax /= ln
    chain = np.array([sum(w.get(side + k, 0) for k in ('Arm', 'ForeArm', 'Hand')) for w in wts])
    hand = np.array([w.get(side + 'Hand', 0) for w in wts])
    p = bw - el
    t = p @ ax / ln                                  # 0 at the elbow, 1 at the wrist
    foot = np.outer(p @ ax, ax)
    k = sm((t - .55) / .3) * (1 - sm((t - 1.04) / .2)) * sm((chain - .4) / .3)
    bw[:] = el + foot + (p - foot) * (1 - WRIST * k)[:, None]
    keep = np.maximum(keep, sm((hand - .5) / .3))    # fingers keep their shape
keep = np.maximum(keep, sm((bw[:, 2] - 1.215) / .05))   # the neckline and collar were fitted by hand above
relax(bw, nb, 1 - keep, 6)
put_world(body, bw)
# the face: only bare skin is relaxed, so hair strands, brows, eyes and lips keep their edges
is_face = lambda c: (c.mean(1) > .45) & (c[:, 0] - c[:, 2] > .02)
weld(head)
nb = weld(head, is_face(vcols(head)))                # the face itself is only ~800 points: split its skin once
hc = world(head)
hcol = vcols(head)
skin = is_face(hcol).astype(np.float32)
raw = int(skin.sum())
for _ in range(1):                                   # feather the mask so the relaxed area fades out
    skin = skin * np.array([skin[n].mean() if n else skin[i] for i, n in enumerate(nb)])
relax(hc, nb, skin, 5)
put_world(head, hc)
print('REFINE body verts', nv, 'polys', len(body.data.polygons), '| head verts', len(head.data.vertices), 'skin', raw, int((skin > .5).sum()))
# the new head follows the Head bone rigidly
head.parent = arm
head.matrix_parent_inverse = arm.matrix_world.inverted()
g = head.vertex_groups.new(name='Head')
g.add(range(len(head.data.vertices)), 1.0, 'REPLACE')
head.modifiers.new('Armature', 'ARMATURE').object = arm


def liner(name, rings, uv, src, bone, t0=0.0, t1=2 * np.pi, n=40):
    """A band of quads; rings are (z, centre x, centre y, half width, half depth), normals face outward."""
    closed = t1 - t0 >= 2 * np.pi - 1e-6
    ts = np.linspace(t0, t1, n, endpoint=not closed)
    verts = [(cx + a * np.cos(t), cy + b * np.sin(t), z) for z, cx, cy, a, b in rings for t in ts]
    faces = []
    for j in range(len(rings) - 1):
        for i in range(n if closed else n - 1):
            i2 = (i + 1) % n
            faces.append((j * n + i, j * n + i2, (j + 1) * n + i2, (j + 1) * n + i))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.uv_layers.new(name='UVMap')
    me.uv_layers.active.data.foreach_set('uv', np.tile(uv, len(me.loops)).astype(np.float32))
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.materials.append(src.data.materials[0])
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    ob.parent = arm
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    ob.vertex_groups.new(name=bone).add(range(len(verts)), 1.0, 'REPLACE')
    ob.modifiers.new('Armature', 'ARMATURE').object = arm
    return ob


z0, cx0, cy0, a0, b0 = neck_rings[0]
a0, b0 = a0 * .85, b0 * .85                             # the gaps are at and below the cut, so the liner stops just above it
liner('neck-liner', [(1.235, cx0, cy0, a0 + .040, b0 + .014), (1.262, cx0, cy0, a0 + .040, b0 + .016), (1.295, cx0, cy0, a0 + .027, b0 + .012),
                     (1.306, cx0, cy0, a0, b0), (1.312, cx0, cy0, a0, b0)], skin_uv, head, 'neck')
liner('collar-liner', [(1.20, AX, AY, .125, .074), (1.26, AX, AY, .125, .074), (1.292, AX, AY, .105, .066), (1.303, AX, AY, .085, .064)], black_uv, body, 'Spine', .35, np.pi - .35)
for o in sc.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_animations=True)
print('SAVED', out)
