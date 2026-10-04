import { Composition, registerRoot } from "remotion";
import { FurnitureAssembly } from "./FurnitureAssembly";
import { TechnicalExplainer } from "./TechnicalExplainer";

const Root = () => (
  <>
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
    <Composition
      id="technical-lesson-explainer"
      component={TechnicalExplainer}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        locale: "ar-EG" as const,
        title: "التعليم الفني",
        scenes: [
          {
            title: "المستخدم والاحتياج",
            detail: "نبدأ بالمستخدم ونراجع الاحتياج.",
            spoken: "",
            diagram: "brief" as const,
          },
        ],
        sceneFrames: [900],
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: props.sceneFrames.reduce((a, b) => a + b, 0),
      })}
    />
  </>
);
registerRoot(Root);
