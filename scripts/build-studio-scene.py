"""Editable metre-scale Mac Studio desk scene for Higgsfield 3D Jutsu / Blender 5.2.
Reference: https://www.apple.com/mac-studio/ (industrial design, no performance claims).
The on-screen identity is real mesh geometry so it remains in the portable GLB.
"""
import bpy, math
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1400
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.media_type='IMAGE'
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGBA'
if scene.world is None:scene.world=bpy.data.worlds.new('Studio ambient')
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.66,.71,.75,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.5
scene.view_settings.view_transform='Khronos PBR Neutral'

def material(name,color,metal=0,rough=.4,emission=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if emission:
        p.inputs['Emission Color'].default_value=(*color,1)
        p.inputs['Emission Strength'].default_value=emission
    return m

silver=material('Brushed silver aluminium',(.63,.66,.67),.72,.29)
edge=material('Polished aluminium edges',(.76,.79,.80),.78,.22)
black=material('Graphite bezels and ports',(.008,.011,.012),.15,.32)
rubber=material('Rubber feet',(.021,.026,.023),0,.75)
glass=material('Display paper',(.86,.90,.81),0,.8,.18)
ink=material('Display forest ink',(.011,.035,.02),0,.7)
muted=material('Display secondary ink',(.12,.20,.13),0,.7)
red=material('Cherry accent',(.52,.055,.065),0,.6)
white=material('White keycaps',(.86,.88,.86),.04,.42)
desk=material('Ivory desk',(.76,.78,.71),.05,.67)
led=material('Status LED',(.80,.98,.83),0,.2,2)

root=bpy.data.objects.new('Hyunae Park — Mac Studio workstation',None)
scene.collection.objects.link(root)

def box(name,loc,dim,mat,radius=.002,segments=4):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=dim
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if radius:
        mod=o.modifiers.new('Machined rounded edges','BEVEL');mod.width=radius;mod.segments=segments
        mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    o.data.materials.append(mat);o.parent=root
    return o

def text(name,value,loc,size,mat,max_width=None):
    c=bpy.data.curves.new(name,'FONT');c.body=value;c.size=size;c.extrude=.00008;c.bevel_depth=0
    c.resolution_u=8;c.align_x='LEFT'
    o=bpy.data.objects.new(name,c);scene.collection.objects.link(o)
    o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(mat);o.parent=root
    bpy.context.view_layer.update()
    if max_width and o.dimensions.x>max_width:o.scale*=max_width/o.dimensions.x
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    for other in bpy.context.selected_objects:
        if other!=o:other.select_set(False)
    bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o

def sphere(name,loc,dim,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=dim;o.data.materials.append(mat);o.parent=root
    for p in o.data.polygons:p.use_smooth=True
    return o

# Slim desktop plane provides contact and a readable silhouette in the web viewer.
box('Desk surface',(.04,0,-.015),(1.01,.60,.026),desk,.018,8)
box('Display aluminium foot',(-.05,.125,.009),(.205,.16,.018),silver,.012,6)
box('Display stand',(-.05,.18,.095),(.082,.027,.175),silver,.007,5)
box('Studio Display aluminium housing',(-.05,.135,.345),(.625,.026,.365),silver,.012,8)
box('Studio Display black bezel',(-.05,.1205,.345),(.615,.004,.355),black,.009,8)
box('Studio Display screen',(-.05,.1175,.345),(.587,.0018,.327),glass,.006,8)
sphere('Display camera',(-.05,.116,.516),(.003,.0015,.003),black)
# Mesh typography on the screen, with deliberately quiet, factual content.
text('Screen title','Hyunae Park',(-.289,.1158,.343),.052*1.65,ink,.472)
text('Screen position','AI Builder',(-.286,.1156,.277),.023*1.6,muted,.25)
text('Screen header','HYUNAE PARK / PORTFOLIO',(-.286,.1156,.476),.009,muted,.30)
text('Screen year','2026',(.17,.1156,.476),.009,muted,.04)
box('Screen header divider',(-.05,.1154,.459),(.478,.0004,.0008),muted,0)
text('Screen footer','PROJECTS   /   HISTORY   /   CONTACT',(-.286,.1156,.211),.0085,muted,.46)
box('Screen accent',(-.276,.1154,.425),(.020,.0005,.002),red,.0007,3)
# The Mac Studio itself, alongside the display rather than hidden beneath it.
box('Mac Studio underside',(.385,.098,.008),(.165,.165,.015),rubber,.020,8)
box('Mac Studio aluminium enclosure',(.385,.098,.0625),(.197,.197,.095),silver,.017,10)
box('Mac Studio bottom seam',(.385,.098,.019),(.184,.184,.003),edge,.014,8)
for x in [.326,.352]:
    box('Front USB-C port', (x,-.0014,.056),(.015,.001,.0055),black,.002,6)
box('Front SD card slot',(.414,-.0014,.056),(.030,.001,.003),black,.0008,4)
sphere('Mac Studio power indicator',(.452,-.0015,.044),(.0021,.001,.0021),led)
# Repeated shallow grille strips, readable on the back during an orbit.
for i in range(25):
    box('Rear ventilation %02d'%i,(.310+i*.0062,.1968,.080),(.0026,.001,.024),rubber,.001,2)
for i in range(4):
    box('Rear connection %02d'%i,(.333+i*.028,.1972,.046),(.018,.0012,.008),black,.002,3)
# Dark, subtle label on the top surface; no unverified chip or hardware claims.
label=text('Mac Studio top label','Mac Studio',(.344,.108,.1101),.009,black,.09)
label.rotation_euler=(0,0,0)
# Compact aluminium keyboard with individual keycaps.
box('Keyboard chassis',(-.10,-.216,.009),(.322,.115,.015),silver,.009,6)
keys=[]
for row in range(5):
    for col in range(14):
        if row==4 and 3<=col<=9:continue
        keys.append(box('Keyboard key %02d %02d'%(row,col),(-.244+col*.022,-.171-row*.021,.019),(.018,.017,.006),white,.0025,3))
keys.append(box('Keyboard space bar',(-.112,-.255,.019),(.150,.017,.006),white,.003,4))
# Join the repeated keycap geometry for a lighter portable scene.
bpy.ops.object.select_all(action='DESELECT')
for o in keys:o.select_set(True)
bpy.context.view_layer.objects.active=keys[0];bpy.ops.object.join();keys[0].name='Keyboard keycaps'
sphere('Mouse top',(.187,-.210,.017),(.060,.104,.031),white)
box('Mouse base',(.187,-.210,.006),(.051,.092,.010),silver,.019,8)

def light(name,loc,energy,color,size):
    d=bpy.data.lights.new(name,'POINT');d.energy=energy;d.color=color;d.shadow_soft_size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc
light('Key softbox',(-.6,-.7,1.4),95,(1,.97,.91),.65)
light('Cool fill',(.85,-.1,.85),55,(.86,.92,1),.5)
light('Rear rim',(.2,.8,1.1),85,(1,1,1),.4)

camera_data=bpy.data.cameras.new('Delivery camera');camera=bpy.data.objects.new('Delivery camera',camera_data)
scene.collection.objects.link(camera);camera.location=(.59,-1.65,.94)
direction=Vector((.03,.015,.23))-camera.location;camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
camera_data.type='ORTHO';camera_data.ortho_scale=1.37;scene.camera=camera
scene.render.image_settings.media_type='IMAGE'
target=artifacts.file(name='hyunae-mac-studio.png',media_type='image/png')
scene.render.filepath=target.path;bpy.ops.render.render(write_still=True);target.publish()
result={'name':'Hyunae Park','position':'AI Builder','objects':len(scene.objects),'mesh_count':len([o for o in scene.objects if o.type=='MESH']),'camera':list(camera.location),'metre_scale':True,'parts':['Mac Studio','Studio Display','keyboard','mouse','desk'],'render':'hyunae-mac-studio.png'}
