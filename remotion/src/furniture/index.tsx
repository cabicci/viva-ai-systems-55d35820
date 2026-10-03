import { Composition, registerRoot } from "remotion";
import { FurnitureAssembly } from "./FurnitureAssembly";

const Root = () => (
  <Composition
    id="furniture-pilot-assembly"
    component={FurnitureAssembly}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      locale: "ar-EG" as const,
      sceneFrames: [120, 120, 120, 120, 120, 120, 180],
      narrated: false,
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.sceneFrames.reduce((a, b) => a + b, 0),
    })}
  />
);
registerRoot(Root);
