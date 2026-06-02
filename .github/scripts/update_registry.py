import os, re

lid = os.environ["LID"]
reg_path = "remotion/src/lessonsRegistry.ts"
src = open(reg_path).read()
ident = "L_" + re.sub(r"\W", "_", lid)
import_line = f'import {{ SCENES as {ident}_S, SCENE_FRAMES as {ident}_F, TOTAL_FRAMES as {ident}_T }} from "./lessons-generated/{lid}.gen";'
entry_line = f'  {{ id: "{lid}", scenes: {ident}_S, sceneFrames: {ident}_F, totalFrames: {ident}_T }},'
src = re.sub(rf'^import \{{[^}}]*\}} from "\./lessons-generated/{re.escape(lid)}\.gen";\s*\n', "", src, flags=re.MULTILINE)
src = re.sub(rf'^\s*\{{\s*id:\s*"{re.escape(lid)}",[^}}]*\}},?\s*\n', "", src, flags=re.MULTILINE)
src = src.replace("/* @lesson-imports-end */", f"{import_line}\n/* @lesson-imports-end */")
src = src.replace("/* @lesson-entries-end */", f"{entry_line}\n  /* @lesson-entries-end */")
open(reg_path, "w").write(src)