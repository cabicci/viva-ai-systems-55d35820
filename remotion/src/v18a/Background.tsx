import { AbsoluteFill } from "remotion";
import { bgGradient } from "../theme";

export const Background: React.FC = () => (
  <AbsoluteFill style={{ background: bgGradient }} />
);
