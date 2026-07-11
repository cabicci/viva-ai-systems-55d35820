import { registerRoot, Composition } from "remotion";
import { LessonRenderer } from "../../src/LessonRenderer";
import { BRAND_INTRO_FRAMES } from "../../src/theme";
import type { SceneData } from "../../src/lesson-cards";

type LocaleLessonProps = {
  scenes: SceneData[];
  sceneFrames: number[];
};

const LocalePipelineRoot = () => (
  <Composition
    id="locale-pipeline-lesson"
    component={LessonRenderer}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{ scenes: [], sceneFrames: [] } satisfies LocaleLessonProps}
    calculateMetadata={({ props }) => {
      const p = props as LocaleLessonProps;
      const content = (p.sceneFrames ?? []).reduce((a, b) => a + b, 0);
      return {
        durationInFrames: BRAND_INTRO_FRAMES + content,
        props: p,
      };
    }}
  />
);

registerRoot(LocalePipelineRoot);
