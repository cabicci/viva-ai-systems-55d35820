"""Owner-authorized isolated 3D assembly proof. All parts are actual meshes.
Exploded view explains construction; it is not an instruction to dismantle tools.
Run under pinned bpy 4.5.3 on GitHub Actions. No provider keys or audio generation.
"""
import bpy, math, json, sys, argparse, os
from pathlib import Path
from mathutils import Vector

p=argparse.ArgumentParser()
p.add_argument("--start",type=int,default=1)
p.add_argument("--end",type=int,default=420)
p.add_argument("--stills",action="store_true")
p.add_argument("--engine",choices=["cycles","eevee"],default="cycles")
p.add_argument("--output",default="output")
args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else None)
out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
sc.render.engine="CYCLES" if args.engine=="cycles" else "BLENDER_EEVEE_NEXT"
sc.cycles.device="CPU"
sc.cycles.samples=16;sc.cycles.use_denoising=True
sc.cycles.max_bounces=4;sc.cycles.diffuse_bounces=2;sc.cycles.glossy_bounces=3
if hasattr(sc,"eevee"):
 sc.eevee.taa_render_samples=16
sc.render.resolution_x=1920;sc.render.resolution_y=1080;sc.render.resolution_percentage=100
sc.render.fps=30;sc.frame_start=1;sc.frame_end=420
sc.render.image_settings.file_format="PNG";sc.render.image_settings.color_mode="RGB"
sc.render.use_file_extension=True
sc.render.threads_mode="FIXED";sc.render.threads=max(1,os.cpu_count() or 4)
sc.render.film_transparent=False
sc.view_settings.view_transform="AgX"
sc.view_settings.look="AgX - Medium High Contrast";sc.view_settings.exposure=0
sc.world=bpy.data.worlds.new("Soft studio environment");sc.world.use_nodes=True
sc.world.node_tree.nodes["Background"].inputs[0].default_value=(0.68,0.78,0.84,1)
sc.world.node_tree.nodes["Background"].inputs[1].default_value=.15

def mat(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.use_nodes=True
 b=m.node_tree.nodes.get("Principled BSDF")
 b.inputs["Base Color"].default_value=(*color,1)
 b.inputs["Metallic"].default_value=metal;b.inputs["Roughness"].default_value=rough
 return m
wood=mat("Warm honey wood • longitudinal grain",(.39,.16,.052),0,.34)
n=wood.node_tree.nodes;l=wood.node_tree.links;b=n.get("Principled BSDF")
tc=n.new("ShaderNodeTexCoord");mapping=n.new("ShaderNodeVectorMath");mapping.operation="MULTIPLY"
mapping.inputs[1].default_value=(28,28,1.8);l.new(tc.outputs["Generated"],mapping.inputs[0])
noise=n.new("ShaderNodeTexNoise");noise.inputs["Scale"].default_value=3.5;noise.inputs["Detail"].default_value=4.0
l.new(mapping.outputs["Vector"],noise.inputs["Vector"])
ramp=n.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position=.25;ramp.color_ramp.elements[0].color=(.13,.035,.009,1)
ramp.color_ramp.elements[1].position=.78;ramp.color_ramp.elements[1].color=(.52,.235,.065,1)
e=ramp.color_ramp.elements.new(.50);e.color=(.39,.145,.036,1)
l.new(noise.outputs["Fac"],ramp.inputs[0]);l.new(ramp.outputs[0],b.inputs["Base Color"])
bump=n.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.20;bump.inputs["Distance"].default_value=.022
l.new(noise.outputs["Fac"],bump.inputs["Height"]);l.new(bump.outputs[0],b.inputs["Normal"])
b.inputs["Coat Weight"].default_value=.22;b.inputs["Coat Roughness"].default_value=.28
steel=mat("Satin stainless steel • fine brushed surface",(.55,.58,.60),.72,.32)
n=steel.node_tree.nodes;l=steel.node_tree.links;b=n.get("Principled BSDF")
tc=n.new("ShaderNodeTexCoord");mapping=n.new("ShaderNodeVectorMath");mapping.operation="MULTIPLY"
mapping.inputs[1].default_value=(55,55,2);l.new(tc.outputs["Generated"],mapping.inputs[0])
noise=n.new("ShaderNodeTexNoise");noise.inputs["Scale"].default_value=9;noise.inputs["Detail"].default_value=2
l.new(mapping.outputs[0],noise.inputs[0])
bump=n.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.13;bump.inputs["Distance"].default_value=.006
l.new(noise.outputs["Fac"],bump.inputs["Height"]);l.new(bump.outputs[0],b.inputs["Normal"])
mr=n.new("ShaderNodeValToRGB")
mr.color_ramp.elements[0].color=(.39,.42,.44,1);mr.color_ramp.elements[1].color=(.64,.66,.68,1)
l.new(noise.outputs["Fac"],mr.inputs[0]);l.new(mr.outputs[0],b.inputs["Base Color"])
edge=mat("Polished rolled edge",(.66,.70,.72),.95,.20)
dark=mat("Recess in socket",(.09,.11,.12),.75,.34)

def empty(name,parent=None):
 o=bpy.data.objects.new(name,None);sc.collection.objects.link(o);o.parent=parent;return o
root=empty("Tool • assembled coordinate system")
root.rotation_euler=(math.radians(8),math.radians(38),math.radians(-8))
groups={k:empty(k,root) for k in ["Blade","Socket","Handle","Rivet"]}
def mesh(name,verts,faces,material,parent):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 o=bpy.data.objects.new(name,me);sc.collection.objects.link(o);o.parent=parent;o.data.materials.append(material)
 for f in me.polygons:f.use_smooth=True
 return o
def lathe(name,profile,material,parent,sides=96,hollow=False):
 v=[];f=[]
 for z,r in profile:
  for j in range(sides):
   a=j*math.tau/sides;v.append((r*math.cos(a),r*math.sin(a),z))
 for i in range(len(profile)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides
   f.append((a,b,b+sides,a+sides))
 if hollow:
  end=(len(profile)-1)*sides
  for j in range(sides):f.append((end+j,end+(j+1)%sides,(j+1)%sides,j))
 else:
  f.extend([tuple(reversed(range(sides))),tuple((len(profile)-1)*sides+j for j in range(sides))])
 return mesh(name,v,f,material,parent)

# Lathed, gently ergonomic handle. Fine grain remains procedural and editable.
profile=[(-.05,.10),(.05,.13),(.35,.15),(.54,.16),(.59,.17),(.63,.205),(.78,.225),(1.03,.245),(1.35,.285),(1.70,.30),(1.98,.29),(2.17,.26),(2.29,.20),(2.36,.11),(2.39,.015)]
handle=lathe("Rounded solid wooden grip",profile,wood,groups["Handle"])
sub=handle.modifiers.new("Continuous grip curvature","SUBSURF");sub.levels=2

# Concave blade; no rectangular planes, spoon bowl or photographic billboard.
v=[];f=[];nx=32;nz=52
for iz in range(nz+1):
 t=iz/nz;z=-2.30+2.20*t
 width=.014+.52*(math.sin(math.pi*t*.92)**.85)
 for ix in range(nx+1):
  u=2*ix/nx-1
  x=u*width
  y=-.20*u*u*(math.sin(math.pi*t*.9)**.6)+.035*math.sin(t*math.pi)
  # Raised central ridge smoothly disappears toward the rounded tip.
  y-=.065*math.exp(-u*u*16)*t*t
  v.append((x,y,z))
for iz in range(nz):
 for ix in range(nx):
  a=iz*(nx+1)+ix;f.append((a,a+1,a+nx+2,a+nx+1))
blade=mesh("Curved broad trowel blade",v,f,steel,groups["Blade"])
solid=blade.modifiers.new("Actual steel thickness","SOLIDIFY");solid.thickness=.035
bev=blade.modifiers.new("Soft manufactured edge","BEVEL");bev.width=.018;bev.segments=3
sub=blade.modifiers.new("Blade continuity","SUBSURF");sub.levels=1

# Tubular socket with an actual inner bore visible in the exploded state.
profile=[(-.34,.095),(-.20,.13),(.04,.19),(.34,.225),(.56,.225),(.58,.215),(.58,.174),(.34,.174),(.04,.145),(-.20,.075),(-.34,.07)]
socket=lathe("Formed metal ferrule and socket",profile,steel,groups["Socket"],hollow=True)
be=socket.modifiers.new("Manufactured rim bevel","BEVEL");be.width=.012;be.segments=3
lathe("Polished socket lip",[(.545,.227),(.575,.227),(.584,.216),(.575,.21),(.545,.21)],edge,groups["Socket"],hollow=True)
lathe("Inner tang shown only in construction view",[(-.38,.065),(.48,.065)],dark,groups["Blade"],48)

# Rivet cap and shank, entering the front of the socket radially.
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=1,location=(0,0,0))
rivet=bpy.context.object;rivet.name="Solid rivet head";rivet.parent=groups["Rivet"]
rivet.location=(0,-.225,.35);rivet.scale=(.070,.027,.070);rivet.data.materials.append(edge)
for f in rivet.data.polygons:f.use_smooth=True
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.026,depth=.35)
pin=bpy.context.object;pin.name="Rivet shaft";pin.parent=groups["Rivet"]
pin.location=(0,-.04,.35);pin.rotation_euler=(math.pi/2,0,0);pin.data.materials.append(steel)

# A soft continuous studio, with site-family mint/lavender/cream hues.
floor=mat("Masaarat pastel studio",(.78,.88,.83),0,.82)
n=floor.node_tree.nodes;l=floor.node_tree.links;b=n.get("Principled BSDF")
tex=n.new("ShaderNodeTexNoise");tex.inputs["Scale"].default_value=.19;tex.inputs["Detail"].default_value=0
coord=n.new("ShaderNodeTexCoord");l.new(coord.outputs["Object"],tex.inputs[0])
r=n.new("ShaderNodeValToRGB");r.color_ramp.elements[0].color=(.57,.75,.68,1);r.color_ramp.elements[1].color=(.83,.75,.89,1)
l.new(tex.outputs["Fac"],r.inputs[0]);l.new(r.outputs[0],b.inputs["Base Color"])
l.new(r.outputs[0],b.inputs["Emission Color"]);b.inputs["Emission Strength"].default_value=.24
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-2.75))
plane=bpy.context.object;plane.name="Continuous pastel studio";plane.data.materials.append(floor)
def area(name,loc,power,size,color,target=(0,0,.4),shape="DISK"):
 bpy.ops.object.light_add(type="AREA",location=loc)
 o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape=shape;o.data.size=size;o.data.color=color
 o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
area("Large warm key",(-4,-5,7),700,5.0,(1,.84,.67))
area("Cool soft fill",(5,-1,4),350,4,(.72,.86,1))
area("Tall edge reflection",(-2,4,4),700,3,(1,1,1))
area("Front metal reflection",(0,-6,0),550,5,(1,.98,.94))
bpy.ops.object.camera_add()
cam=bpy.context.object;cam.name="Continuous inspection camera";cam.data.lens=52;cam.data.clip_end=300
cam.data.dof.use_dof=True;cam.data.dof.aperture_fstop=7.1
focus=empty("Camera focus");cam.data.dof.focus_object=focus
sc.camera=cam

def smooth(a,b,t):
 x=max(0,min(1,(t-a)/(b-a)));return x*x*(3-2*x)
def lerp(a,b,x):return a+(b-a)*x
def state(t):
 # Separate -> hold -> reunite. Each part has stable identity and real geometry.
 opened=smooth(1.9,4.4,t)
 explode=opened*(1-smooth(6.1,8.3,t))
 # Socket/blade seat first, then wooden grip, then the radial retaining rivet.
 seat=opened*(1-smooth(5.8,7.3,t))
 pin_return=opened*(1-smooth(8.3,9.1,t))
 groups["Handle"].location=(0,0,1.28*explode)
 groups["Socket"].location=(0,0,.22*seat)
 groups["Blade"].location=(0,0,-.72*seat)
 groups["Rivet"].location=(.1*pin_return,-.88*pin_return,.1*pin_return)
 # A continuous orbit rather than screen-space image movement.
 az=math.radians(lerp(-95,-130,smooth(0,14,t)))
 macro=smooth(8.8,10.3,t)*(1-smooth(11.4,13.5,t))
 distance=lerp(13.2+3.0*explode,6.8,macro)
 target=Vector((.05,0,.20*explode))
 target=target.lerp(root.matrix_world @ Vector((0,0,.43)),macro)
 cam.location=target+Vector((math.cos(az)*distance,math.sin(az)*distance,distance*.30))
 cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
 focus.location=target
 return {"explosion":explode,"macro":macro,"camera":list(cam.location)}

# Bake all transform samples into the saved reusable scene.
states=[]
for frame in range(1,421):
 sc.frame_set(frame);v=state((frame-1)/30);states.append({"frame":frame,**v})
 for o in [*groups.values(),cam,focus]:
  o.keyframe_insert("location",frame=frame)
 cam.keyframe_insert("rotation_euler",frame=frame)
for o in [*groups.values(),cam,focus]:
 if o.animation_data and o.animation_data.action:
  for fc in o.animation_data.action.fcurves:
   for kp in fc.keyframe_points:kp.interpolation="LINEAR"
sc.frame_set(1)
if args.stills or (args.start==1 and args.end>0):
 bpy.ops.wm.save_as_mainfile(filepath=str(out/"assembly-proof.blend"))
if args.stills:
 frames=[1,166,286,420]
else:frames=list(range(args.start,args.end+1))
(out/"scene-contract.json").write_text(json.dumps({
 "kind":"construction visualization, not dismantling instruction",
 "blenderVersion":bpy.app.version_string,"actualMeshes":True,"imageBillboards":False,
 "fps":30,"frames":420,"resolution":[1920,1080],"reference":"approved spade.png",
 "styleAcceptance":"pending owner review","parts":list(groups),"framesRendered":frames,
 "states":states if args.stills else None
},indent=2))
for frame in frames:
 sc.frame_set(frame);sc.render.filepath=str(out/f"frame-{frame:04d}.png")
 bpy.ops.render.render(write_still=True)
print("RENDER_COMPLETE",args.start,args.end,flush=True)
