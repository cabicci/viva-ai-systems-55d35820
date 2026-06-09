import { Composition } from "remotion";
import { LessonRenderer } from "./LessonRenderer";
import { LESSONS } from "./lessonsRegistry";
import { IntroVideo } from "./intro/IntroVideo";
import introManifest from "./intro/intro.manifest.json";
import { BRAND_INTRO_FRAMES } from "./theme";

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
        // Brand intro prepended in LessonRenderer — extend duration accordingly.
        durationInFrames={l.totalFrames + BRAND_INTRO_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ scenes: l.scenes, sceneFrames: l.sceneFrames }}
      />
    ))}
  </>
);