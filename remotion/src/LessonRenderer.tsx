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
  type SceneData,
} from "./lesson-cards";

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
  const starts: number[] = [];
  let acc = 0;
  for (const d of sceneFrames) {
    starts.push(acc);
    acc += d;
  }
  return (
    <AbsoluteFill>
      <Background />
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