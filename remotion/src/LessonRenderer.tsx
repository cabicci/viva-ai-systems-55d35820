import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "./v18a/Background";
import {
  TitleCard,
  ConceptCard,
  BigStatCard,
  BulletsCard,
  CompareCard,
  CTACard,
  ScreenshotCard,
  BrandIntroCard,
  type SceneData,
} from "./lesson-cards";
import { BRAND_INTRO_FRAMES } from "./theme";

export type LessonRendererProps = {
  scenes: SceneData[];
  sceneFrames: number[];
};

const renderScene = (scene: SceneData) => {
  switch (scene.card) {
    case "TitleCard":
      return <TitleCard {...scene} />;
    case "ConceptCard":
      return <ConceptCard {...scene} />;
    case "BigStatCard":
      return <BigStatCard {...scene} />;
    case "BulletsCard":
      return <BulletsCard {...scene} />;
    case "CompareCard":
      return <CompareCard {...scene} />;
    case "CTACard":
      return <CTACard {...scene} />;
    case "ScreenshotCard":
      return <ScreenshotCard {...scene} />;
  }
};

export const LessonRenderer: React.FC<LessonRendererProps> = ({
  scenes,
  sceneFrames,
}) => {
  // Every lesson video starts with the Masaarat brand intro.
  const starts: number[] = [];
  let acc = BRAND_INTRO_FRAMES;
  for (const d of sceneFrames) {
    starts.push(acc);
    acc += d;
  }
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={BRAND_INTRO_FRAMES}>
        <BrandIntroCard />
      </Sequence>
      {scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={starts[i]}
          durationInFrames={sceneFrames[i]}
        >
          {renderScene(scene)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
