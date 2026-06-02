import { Composition } from "remotion";
import { LessonRenderer } from "./LessonRenderer";
import { LESSONS } from "./lessonsRegistry";
import { IntroVideo } from "./intro/IntroVideo";
import introManifest from "./intro/intro.manifest.json";

export const RemotionRoot = () => (
  <>
    <Composition
      id="platform-intro"
      component={IntroVideo}
      durationInFrames={introManifest.totalFrames}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ sceneFrames: introManifest.sceneFrames }}
    />
    {LESSONS.map((l) => (
      <Composition
        key={l.id}
        id={l.id}
        component={LessonRenderer}
        durationInFrames={l.totalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ scenes: l.scenes, sceneFrames: l.sceneFrames }}
      />
    ))}
  </>
);