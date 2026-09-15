import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "../runtime/contextualV2BrowserManifest.json";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const publicRoot = join(repo, "public/lesson-visuals/contextual-v2");
const locales = ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const;
const acceptedSourceHead = "94b20865f755b55ae1ab015bb3c926b6e79cfc70";
const acceptedSourceTree = "92473841d35a4ab0a3b03fa57377ad7784f995b4";
const acceptedIntegrationManifestSha256 =
  "777ae8f4a30996c2aa07666fd759a06dbe284fb280af51c255b73986def6761f";
const errors: string[] = [];
const sha256 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const gitBlob = (bytes: Buffer) =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex");
const canonicalizeCheckoutLineEndings = (bytes: Buffer) =>
  Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8");

// BEGIN EXACT B021 SOURCE COMPATIBILITY
// Three approved mission-format changes at dc49ae558e715283e7fd5b489894d80749edc806.
// The original production manifest and image-generation source hashes stay immutable.
const b021SourceCompatibility = [
  {
    sourcePath: "src/lib/locale-lessons/en/lessons/analyst-m2-l2-right-question-rule.json",
    field: "sections[7].mission.intro",
    acceptedCurrentSha256: "a39fd9f17dc91de47a4783a217a3fde85dcec96ce38310a52c7cf69d7d17e182",
    acceptedCurrentBlob: "4d29cb1804f7d3550b7295ff8ac7c16a74811fc4",
    generationSourceSha256: "7190da96f91fc19c7e1472b4dc226fddb9cb4417e9fd4bf69e35d2a7c18a66c7",
    generationSourceBlob: "a2b935c74e23f818089e1cd6eb1a6c65abda7c57",
    beforeJsonString:
      '"A practical **filter task** — **not an exam**. Write **3 questions** (from the previous lesson or from your work). For each question apply: «**If** the answer is **X** or **Y** — **will** I change my decision?** If **not** — **rephrase** the question."',
    afterJsonString:
      '"A practical **filter task** — **not an exam**. Write **3 questions** (from the previous lesson or from your work). For each question apply: «**If** the answer is **X** or **Y** — **will** I change my decision?** If **not** — **rephrase** the question.**"',
    imageSourceSectionIndexes: [2, 3, 5],
    changedSectionIndex: 7,
    imageSha256: "215612c7180bb36813be93e8ea43767c2fca8ab882fb741b43ac35b8f23d7303",
    fieldByteOffset: 10012,
  },
  {
    sourcePath: "src/lib/locale-lessons/en/lessons/builder-m10-l2-first-users.json",
    field: "sections[7].mission.rubric[1].criteria",
    acceptedCurrentSha256: "79ec6a1894d428dba41b9fed8305e070caff2c40a9fcabd0ea0ebadcb27ac5db",
    acceptedCurrentBlob: "f0b6a3a57cf81adce82d2e1854785947e015d29b",
    generationSourceSha256: "c71ce2aec7e403992e0463db3e36eebf7685b68d452622df991a167b44b1ff79",
    generationSourceBlob: "2c369e3459a6cfcebb1d3446460367d1cfc918da",
    beforeJsonString:
      '"**Two questions that elicit real feedback** — **not just “Did you like it?”; **about actual behavior (last use, where they got stuck)**"',
    afterJsonString:
      '"**Two questions that elicit real feedback** — **not just “Did you like it?”; **about actual behavior (last use, where they got stuck)****"',
    imageSourceSectionIndexes: [0, 2, 3],
    changedSectionIndex: 7,
    imageSha256: "1f0e92ca644d50b556de88c8be383da566690ab2c34f186580eda53377aa2fd5",
    fieldByteOffset: 9557,
  },
  {
    sourcePath: "src/lib/locale-lessons/en/lessons/builder-m6-l2-wireframe.json",
    field: "sections[7].mission.intro",
    acceptedCurrentSha256: "fba8372f5ec7cc6f0a89c94e31059e5e5634e3c698825903ea55ae4eab3e6a7f",
    acceptedCurrentBlob: "d1075469f749a6cd1923993513170f36c09406d8",
    generationSourceSha256: "b101b84d27a3d53c27582d8cf6e73f9f7beeb780c40f9e6095de15bd4845bb9e",
    generationSourceBlob: "4ffcf82dcf58b4844568b4ce93f515bed1d1e188",
    beforeJsonString:
      '"**Drawing or describing — not coding. Use 3 screens from the previous lesson. **10–15 minutes**."',
    afterJsonString:
      '"**Drawing or describing — not coding. Use 3 screens from the previous lesson. **10–15 minutes**.**"',
    imageSourceSectionIndexes: [2, 3, 5],
    changedSectionIndex: 7,
    imageSha256: "12e139c3330e906098ea44aa53fdec392c7b076ae46c70a584d74a2cf0333c3a",
    fieldByteOffset: 8391,
  },
] as const;

const imageGenerationBoldSourceBytes = (
  entry: { sourcePath: string; sourceSha256: string; sourceBlob: string },
  bytes: Buffer,
): Buffer => {
  const bridge = b021SourceCompatibility.find((item) => item.sourcePath === entry.sourcePath);
  if (
    !bridge ||
    sha256(bytes) !== bridge.acceptedCurrentSha256 ||
    gitBlob(bytes) !== bridge.acceptedCurrentBlob
  )
    return bytes;
  if (
    entry.sourceSha256 !== bridge.generationSourceSha256 ||
    entry.sourceBlob !== bridge.generationSourceBlob
  )
    return bytes;
  const after = Buffer.from(bridge.afterJsonString, "utf8");
  const offset = bridge.fieldByteOffset;
  if (!bytes.subarray(offset, offset + after.length).equals(after)) return bytes;
  const original = Buffer.concat([
    bytes.subarray(0, offset),
    Buffer.from(bridge.beforeJsonString, "utf8"),
    bytes.subarray(offset + after.length),
  ]);
  if (sha256(original) !== entry.sourceSha256 || gitBlob(original) !== entry.sourceBlob)
    return bytes;
  return original;
};
// END EXACT B021 SOURCE COMPATIBILITY

// BEGIN EXACT B021 QUIZ SOURCE COMPATIBILITY
// Quiz choices, answer index and matching markdown only; original image provenance stays immutable.
const b021QuizSourceCompatibility = [
  {
    sourcePath: "src/lib/locale-lessons/ar-Gulf/lessons/business-m1-l2-reactive-vs-proactive.json",
    acceptedCurrentSha256: "601ecfdc8a629aba32ebe7ecc1e6aa5d92da2dd6136c1b7e830dad3122eb743e",
    acceptedCurrentBlob: "29fecd3f023b9da0d18628b4e3af490e677b880e",
    generationSourceSha256: "d7ab93da0dc022cabe219ccadfc7adc7e1b0cab0fe11cc9b654080ab13bbd5ae",
    generationSourceBlob: "c443d11242adc1fc360182e1b60cf09b9da7d5bb",
    reverseSplices: [
      {
        byteOffset: 7703,
        afterHex:
          "2a2ad8a7d984d8b3d8a4d8a7d9843a2a2a20d983d8b1d98ad98520d981d8aad8ad20d988d8a7d8aad8b3d8a7d8a820d8a3d988d98420d8a7d984d8b5d8a8d8ad20d8a8d8b3d8a8d8a820d985d8b4d983d984d8a920d985d988d8b1d8af20d983d8a8d98ad8b1d8a920d988d982d8b6d98920d9a320d8b3d8a7d8b9d8a7d8aa2e20d988d8b420d987d8b0d8a7d89f5c6e5c6e2d2050726f61637469766520e2809420d984d8a3d986d98720d8a7d8aad8aed8b020d982d8b1d8a7d8b1d98bd8a720d8a8d986d981d8b3d98720d988d8aed8b5d991d8b520d988d982d8aad98bd8a720d984d984d985d8b4d983d984d8a95c6e2d20526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad9875c6e2d20d984d8a720d987d8b0d8a720d988d984d8a720d8b0d8a7d98320e2809420d984d8a3d98620d8a7d984d985d8b4d983d984d8a920d983d8a7d986d8aa20d983d8a8d98ad8b1d8a920d988d8aad8b3d8aad8add98220d8a7d984d988d982d8aa5c6e2d2050726f61637469766520e2809420d984d8a3d98620d8a7d984d8aad8b9d8a7d985d98420d985d8b920d8a7d984d985d988d8b1d8afd98ad98620d8acd8b2d8a120d985d98620d8a7d984d8aad8aed8b7d98ad8b75c6e5c6e2a2ad8a7d984d8aad981d8b3d98ad8b13a2a2a20d8add8acd98520d8a7d984d985d8b4d983d984d8a920d985d98820d8a7d984d985d8b9d98ad8a7d8b12e20d8a7d984d985d8b9d98ad8a7d8b13a20d985d98620d982d8b1d991d8b120d988d8b420d8aad8b3d988d98a20d8a3d988d984d98bd8a7d89f20d8aad982d984d98ad98420d8a7d984d985d8aad983d8b1d8b120d98ad8a8d8afd8a320d8a8d985d8b9d8b1d981d8a920d985d8aad98920c2abd8a7d984d8b9d8a7d984d985c2bb20d98ad8a3d8aed8b020d98ad988d985d9832e222c0a2020202020202262756c6c657473223a205b0a202020202020202022526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad9872e222c0a202020202020202022d8a7d984d8aad981d8b3d98ad8b13a20d8add8acd98520d8a7d984d985d8b4d983d984d8a920d985d98820d8a7d984d985d8b9d98ad8a7d8b12e20d8a7d984d985d8b9d98ad8a7d8b13a20d985d98620d982d8b1d991d8b120d988d8b420d8aad8b3d988d98a20d8a3d988d984d98bd8a7d89f20d8aad982d984d98ad98420d8a7d984d985d8aad983d8b1d8b120d98ad8a8d8afd8a320d8a8d985d8b9d8b1d981d8a920d985d8aad98920c2abd8a7d984d8b9d8a7d984d985c2bb20d98ad8a3d8aed8b020d98ad988d985d9832e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022d983d8b1d98ad98520d981d8aad8ad20d988d8a7d8aad8b3d8a7d8a820d8a3d988d98420d8a7d984d8b5d8a8d8ad20d8a8d8b3d8a8d8a820d985d8b4d983d984d8a920d985d988d8b1d8af20d983d8a8d98ad8b1d8a920d988d982d8b6d98920d9a320d8b3d8a7d8b9d8a7d8aa2e20d988d8b420d987d8b0d8a7d89f222c0a202020202020202022636f7272656374496e646578223a20312c0a2020202020202020226f7074696f6e73223a205b0a202020202020202020202250726f61637469766520e2809420d984d8a3d986d98720d8a7d8aad8aed8b020d982d8b1d8a7d8b1d98bd8a720d8a8d986d981d8b3d98720d988d8aed8b5d991d8b520d988d982d8aad98bd8a720d984d984d985d8b4d983d984d8a9222c0a2020202020202020202022526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad987222c0a2020202020202020202022d984d8a720d987d8b0d8a720d988d984d8a720d8b0d8a7d98320e2809420d984d8a3d98620d8a7d984d985d8b4d983d984d8a920d983d8a7d986d8aa20d983d8a8d98ad8b1d8a920d988d8aad8b3d8aad8add98220d8a7d984d988d982d8aa222c0a202020202020202020202250726f61637469766520e2809420d984d8a3d98620d8a7d984d8aad8b9d8a7d985d98420d985d8b920d8a7d984d985d988d8b1d8afd98ad98620d8acd8b2d8a120d985d98620d8a7d984d8aad8aed8b7d98ad8b7",
        beforeHex:
          "3e202a2ad985d981d8aad8a7d8ad20d8a7d984d8a7d8aed8aad8a8d8a7d8b12028d8bad98ad8b120d985d8aad8bad98ad8b1293a2a2a20636f7272656374496e6465783a20315c6e5c6e2a2ad8a7d984d8b3d8a4d8a7d9843a2a2a20d983d8b1d98ad98520d981d8aad8ad20d988d8a7d8aad8b3d8a7d8a820d8a3d988d98420d8a7d984d8b5d8a8d8ad20d8a8d8b3d8a8d8a820d985d8b4d983d984d8a920d985d988d8b1d8af20d983d8a8d98ad8b1d8a920d988d982d8b6d98920d9a320d8b3d8a7d8b9d8a7d8aa2e20d988d8b420d987d8b0d8a7d89f5c6e5c6e526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad9872e5c6e2d202a2ad8a7d984d8aad981d8b3d98ad8b13a2a2a20d8add8acd98520d8a7d984d985d8b4d983d984d8a920d985d98820d8a7d984d985d8b9d98ad8a7d8b12e20d8a7d984d985d8b9d98ad8a7d8b13a20d985d98620d982d8b1d991d8b120d988d8b420d8aad8b3d988d98a20d8a3d988d984d98bd8a7d89f20d8aad982d984d98ad98420d8a7d984d985d8aad983d8b1d8b120d98ad8a8d8afd8a320d8a8d985d8b9d8b1d981d8a920d985d8aad98920c2abd8a7d984d8b9d8a7d984d985c2bb20d98ad8a3d8aed8b020d98ad988d985d9832e222c0a2020202020202262756c6c657473223a205b0a202020202020202022526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad9872e222c0a202020202020202022d8a7d984d8aad981d8b3d98ad8b13a20d8add8acd98520d8a7d984d985d8b4d983d984d8a920d985d98820d8a7d984d985d8b9d98ad8a7d8b12e20d8a7d984d985d8b9d98ad8a7d8b13a20d985d98620d982d8b1d991d8b120d988d8b420d8aad8b3d988d98a20d8a3d988d984d98bd8a7d89f20d8aad982d984d98ad98420d8a7d984d985d8aad983d8b1d8b120d98ad8a8d8afd8a320d8a8d985d8b9d8b1d981d8a920d985d8aad98920c2abd8a7d984d8b9d8a7d984d985c2bb20d98ad8a3d8aed8b020d98ad988d985d9832e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022d983d8b1d98ad98520d981d8aad8ad20d988d8a7d8aad8b3d8a7d8a820d8a3d988d98420d8a7d984d8b5d8a8d8ad20d8a8d8b3d8a8d8a820d985d8b4d983d984d8a920d985d988d8b1d8af20d983d8a8d98ad8b1d8a920d988d982d8b6d98920d9a320d8b3d8a7d8b9d8a7d8aa2e20d988d8b420d987d8b0d8a7d89f222c0a202020202020202022636f7272656374496e646578223a20302c0a2020202020202020226f7074696f6e73223a205b0a2020202020202020202022526561637469766520e2809420d8a7d984d985d988d982d98120d8add8afd991d8af20d98ad988d985d98720d982d8a8d98420d985d8a720d98ad8aed8aad8a7d8b120d8a3d988d984d988d98ad8a7d8aad9872e222c0a2020202020202020202022d8aed98ad8a7d8b120d8bad98ad8b120d985d984d8a7d8a6d985d89b20d98ad8aad8acd8a7d987d98420d8a7d984d985d8b9d8b7d98ad8a7d8aa20d8a7d984d8a3d8b3d8a7d8b3d98ad8a920d981d98a20d8a7d984d982d8b3d98520d8a3d8b9d984d8a7d9872e222c0a2020202020202020202022d8a5d8acd8a7d8a8d8a920d8acd8b2d8a6d98ad8a920d8aad981d988d991d8aa20d8a7d984d8b3d98ad8a7d98220d988d8aad8aad8acd8a7d987d98420d8a7d984d8aed8b7d988d8a920d8a7d984d8aad8a7d984d98ad8a920d984d984d982d8b1d8a7d8b12e",
      },
    ],
  },
  {
    sourcePath: "src/lib/locale-lessons/ar-Gulf/lessons/intro-m1-l1-what-is-ai.json",
    acceptedCurrentSha256: "6ddb4a32288f1cca428c4d6307fd8c061444fddceada43ddda740f4553f5fde7",
    acceptedCurrentBlob: "bc12489b2ba08d1787b0d72f217e3927026387d8",
    generationSourceSha256: "7fde3bd190e68b57df74a627351d19511dcefbe16ca1c0b2138be285c4249ec7",
    generationSourceBlob: "3add9e5ff4a2fc2031088667f1a5b1bcc12c6fc4",
    reverseSplices: [
      {
        byteOffset: 7442,
        afterHex:
          "2d20d8aad982d8b1d8a320d985d982d8a7d984d8a7d8aa20d8b7d988d98ad984d8a920d8b9d98620d8aad8a7d8b1d98ad8ae20d8a7d984d8b0d983d8a7d8a120d8a7d984d8a7d8b5d8b7d986d8a7d8b9d98a20d988d983d98ad98120d98ad8b4d8aad8bad98420d985d98620d8a7d984d8afd8a7d8aed9842e5c6e2d20d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e5c6e2d20d8aad986d8aad8b8d8b120d984d98ad98620d8aad8aed984d8b520d8a7d984d8afd988d8b1d8a920d983d984d987d8a720d982d8a8d98420d985d8a720d8aad8acd8b1d8a820d8a3d98a20d8a3d8afd8a7d8a92e5c6e2d20d8aad8b3d8a3d98420d8b4d8aed8b520d8aed8a8d98ad8b120d98ad8b4d8b1d8ad20d984d98320d983d98420d8a7d984d8aad981d8a7d8b5d98ad98420d8a7d984d8aad982d986d98ad8a920d8a3d988d984d98bd8a72e5c6e5c6e2a2ad8a7d984d8aad981d8b3d98ad8b13a2a2a20d8aad8acd8b1d8a8d8a920d988d8add8afd8a920d8b5d8bad98ad8b1d8a920d8aad8b9d984d985d98320d8a3d983d8abd8b120d985d98620d982d8b1d8a7d8a1d8a920d8b7d988d98ad984d8a92e20d987d8b0d8a720d8a8d8a7d984d8b6d8a8d8b720d8a7d984d984d98a20d8b1d8a7d8ad20d8aad8b3d988d98ad98720d981d98a20d8a7d984d985d987d985d8a92e222c0a2020202020202262756c6c657473223a205b0a202020202020202022d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e222c0a202020202020202022d8a7d984d8aad981d8b3d98ad8b13a20d8aad8acd8b1d8a8d8a920d988d8add8afd8a920d8b5d8bad98ad8b1d8a920d8aad8b9d984d985d98320d8a3d983d8abd8b120d985d98620d982d8b1d8a7d8a1d8a920d8b7d988d98ad984d8a92e20d987d8b0d8a720d8a8d8a7d984d8b6d8a8d8b720d8a7d984d984d98a20d8b1d8a7d8ad20d8aad8b3d988d98ad98720d981d98a20d8a7d984d985d987d985d8a92e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022d988d8b420d8a3d981d8b6d98420d8b7d8b1d98ad982d8a920d8aad8a8d8afd8a320d981d98ad987d8a720d8aad981d987d98520d8a7d984d98020414920d8a7d984d98ad988d985d89f222c0a202020202020202022636f7272656374496e646578223a20312c0a2020202020202020226f7074696f6e73223a205b0a2020202020202020202022d8aad982d8b1d8a320d985d982d8a7d984d8a7d8aa20d8b7d988d98ad984d8a920d8b9d98620d8aad8a7d8b1d98ad8ae20d8a7d984d8b0d983d8a7d8a120d8a7d984d8a7d8b5d8b7d986d8a7d8b9d98a20d988d983d98ad98120d98ad8b4d8aad8bad98420d985d98620d8a7d984d8afd8a7d8aed9842e222c0a2020202020202020202022d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e222c0a2020202020202020202022d8aad986d8aad8b8d8b120d984d98ad98620d8aad8aed984d8b520d8a7d984d8afd988d8b1d8a920d983d984d987d8a720d982d8a8d98420d985d8a720d8aad8acd8b1d8a820d8a3d98a20d8a3d8afd8a7d8a92e222c0a2020202020202020202022d8aad8b3d8a3d98420d8b4d8aed8b520d8aed8a8d98ad8b120d98ad8b4d8b1d8ad20d984d98320d983d98420d8a7d984d8aad981d8a7d8b5d98ad98420d8a7d984d8aad982d986d98ad8a920d8a3d988d984d98bd8a7",
        beforeHex:
          "d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e5c6e2d202a2ad8a7d984d8aad981d8b3d98ad8b13a2a2a20d8aad8acd8b1d8a8d8a920d988d8add8afd8a920d8b5d8bad98ad8b1d8a920d8aad8b9d984d985d98320d8a3d983d8abd8b120d985d98620d982d8b1d8a7d8a1d8a920d8b7d988d98ad984d8a92e20d987d8b0d8a720d8a8d8a7d984d8b6d8a8d8b720d8a7d984d984d98a20d8b1d8a7d8ad20d8aad8b3d988d98ad98720d981d98a20d8a7d984d985d987d985d8a92e222c0a2020202020202262756c6c657473223a205b0a202020202020202022d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e222c0a202020202020202022d8a7d984d8aad981d8b3d98ad8b13a20d8aad8acd8b1d8a8d8a920d988d8add8afd8a920d8b5d8bad98ad8b1d8a920d8aad8b9d984d985d98320d8a3d983d8abd8b120d985d98620d982d8b1d8a7d8a1d8a920d8b7d988d98ad984d8a92e20d987d8b0d8a720d8a8d8a7d984d8b6d8a8d8b720d8a7d984d984d98a20d8b1d8a7d8ad20d8aad8b3d988d98ad98720d981d98a20d8a7d984d985d987d985d8a92e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022d988d8b420d8a3d981d8b6d98420d8b7d8b1d98ad982d8a920d8aad8a8d8afd8a320d981d98ad987d8a720d8aad981d987d98520d8a7d984d98020414920d8a7d984d98ad988d985d89f222c0a202020202020202022636f7272656374496e646578223a20302c0a2020202020202020226f7074696f6e73223a205b0a2020202020202020202022d8aad981d8aad8ad204368617447505420d8a3d9882047656d696e6920d988d8aad8b7d984d8a820d985d986d98720d8b4d98ad8a120d8a8d8b3d98ad8b720d985d98620d98ad988d985d9832e222c0a2020202020202020202022d8aed98ad8a7d8b120d8bad98ad8b120d985d986d8a7d8b3d8a8d89b20d98ad8aad8acd8a7d987d98420d8a7d984d985d8b9d8b7d98ad8a7d8aa20d8a7d984d8a3d8b3d8a7d8b3d98ad8a920d981d98a20d8a7d984d982d8b3d98520d8a7d984d984d98a20d981d988d9822e222c0a2020202020202020202022d8a5d8acd8a7d8a8d8a920d8acd8b2d8a6d98ad8a920d8aad981d988d8aa20d8a7d984d8b3d98ad8a7d98220d988d8aad8aad8acd8a7d987d98420d8a7d984d8aed8b7d988d8a920d8a7d984d8aad8a7d984d98ad8a920d984d984d982d8b1d8a7d8b1",
      },
    ],
  },
  {
    sourcePath: "src/lib/locale-lessons/en/lessons/intro-m1-l1-what-is-ai.json",
    acceptedCurrentSha256: "ae0d0b48b4672b2451bbd6053f619600cd89530b39c36a5cdce35c727f99ba58",
    acceptedCurrentBlob: "bc87c338f653429f35458042d46872d764c54590",
    generationSourceSha256: "9d4489478802ad4104107936e1ab5e279f410553c8e03e8c49a84b6d372bd1bf",
    generationSourceBlob: "e8a1106e71afb69a4579d03fa07a210ca0ac0b9c",
    reverseSplices: [
      {
        byteOffset: 6440,
        afterHex:
          "2d2052656164206173206d616e792061727469636c65732061626f757420414920617320796f752063616e206265666f726520747279696e6720616e797468696e672e5c6e2d204f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e5c6e2d205761697420756e74696c20796f7520686176652074616b656e20612066756c6c20636f75727365206f6e20686f7720414920776f726b7320746563686e6963616c6c792e5c6e2d2041736b206120667269656e642077686f20616c7265616479207573657320414920746f206578706c61696e2065766572797468696e6720746f20796f752066697273742e5c6e5c6e2a2a4578706c616e6174696f6e3a2a2a204120736d616c6c206578706572696d656e74207465616368657320796f75206d6f7265207468616e2061206c6f6e672072656164696e672e20546869732069732065786163746c79207768617420796f752077696c6c20646f20696e20746865207461736b2e222c0a2020202020202262756c6c657473223a205b0a2020202020202020224f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e222c0a2020202020202020224578706c616e6174696f6e3a204120736d616c6c206578706572696d656e74207465616368657320796f75206d6f7265207468616e2061206c6f6e672072656164696e672e20546869732069732065786163746c79207768617420796f752077696c6c20646f20696e20746865207461736b2e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022576861742069732074686520626573742077617920746f20737461727420756e6465727374616e64696e6720414920746f6461793f222c0a202020202020202022636f7272656374496e646578223a20312c0a2020202020202020226f7074696f6e73223a205b0a202020202020202020202252656164206173206d616e792061727469636c65732061626f757420414920617320796f752063616e206265666f726520747279696e6720616e797468696e672e222c0a20202020202020202020224f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e222c0a20202020202020202020225761697420756e74696c20796f7520686176652074616b656e20612066756c6c20636f75727365206f6e20686f7720414920776f726b7320746563686e6963616c6c792e222c0a202020202020202020202241736b206120667269656e642077686f20616c7265616479207573657320414920746f206578706c61696e2065766572797468696e6720746f20796f75206669727374",
        beforeHex:
          "4f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e5c6e2d202a2a4578706c616e6174696f6e3a2a2a204120736d616c6c206578706572696d656e74207465616368657320796f75206d6f7265207468616e2061206c6f6e672072656164696e672e20546869732069732065786163746c79207768617420796f752077696c6c20646f20696e20746865207461736b2e222c0a2020202020202262756c6c657473223a205b0a2020202020202020224f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e222c0a2020202020202020224578706c616e6174696f6e3a204120736d616c6c206578706572696d656e74207465616368657320796f75206d6f7265207468616e2061206c6f6e672072656164696e672e20546869732069732065786163746c79207768617420796f752077696c6c20646f20696e20746865207461736b2e220a2020202020205d2c0a202020202020227461626c6573223a205b5d2c0a202020202020227175697a223a207b0a2020202020202020227175657374696f6e223a2022576861742069732074686520626573742077617920746f20737461727420756e6465727374616e64696e6720414920746f6461793f222c0a202020202020202022636f7272656374496e646578223a20302c0a2020202020202020226f7074696f6e73223a205b0a20202020202020202020224f70656e2043686174475054206f722047656d696e6920616e642061736b20697420736f6d657468696e672073696d706c652066726f6d20796f7572206461792e222c0a2020202020202020202022416e20696e617070726f707269617465206f7074696f6e3b2069742069676e6f7265732074686520626173696320696e666f726d6174696f6e20696e207468652073656374696f6e2061626f76652e222c0a202020202020202020202241207061727469616c20616e737765722074686174206d69737365732074686520636f6e7465787420616e642069676e6f72657320746865206e657874207374657020696e20746865206465636973696f6e",
      },
    ],
  },
] as const;

const imageGenerationQuizSourceBytes = (
  entry: { sourcePath: string; sourceSha256: string; sourceBlob: string },
  bytes: Buffer,
): Buffer => {
  const bridge = b021QuizSourceCompatibility.find((item) => item.sourcePath === entry.sourcePath);
  if (
    !bridge ||
    sha256(bytes) !== bridge.acceptedCurrentSha256 ||
    gitBlob(bytes) !== bridge.acceptedCurrentBlob ||
    entry.sourceSha256 !== bridge.generationSourceSha256 ||
    entry.sourceBlob !== bridge.generationSourceBlob
  ) {
    return bytes;
  }
  let original = bytes;
  for (const splice of [...bridge.reverseSplices].reverse()) {
    const after = Buffer.from(splice.afterHex, "hex");
    const offset = splice.byteOffset;
    if (
      offset < 0 ||
      offset > original.length ||
      !original.subarray(offset, offset + after.length).equals(after)
    ) {
      return bytes;
    }
    original = Buffer.concat([
      original.subarray(0, offset),
      Buffer.from(splice.beforeHex, "hex"),
      original.subarray(offset + after.length),
    ]);
  }
  if (sha256(original) !== entry.sourceSha256 || gitBlob(original) !== entry.sourceBlob)
    return bytes;
  return original;
};

const imageGenerationSourceBytes = (
  entry: { sourcePath: string; sourceSha256: string; sourceBlob: string },
  bytes: Buffer,
): Buffer => {
  const boldRestored = imageGenerationBoldSourceBytes(entry, bytes);
  if (!boldRestored.equals(bytes)) return boldRestored;
  return imageGenerationQuizSourceBytes(entry, bytes);
};

// END EXACT VERIFIED SOURCE COMPATIBILITY

if (manifest.manifestVersion !== "lesson-visuals-contextual-v2/runtime-v1") {
  errors.push("manifest version is not shippable");
}
if (manifest.integrationStatus !== "VERIFIED_400") {
  errors.push("manifest integrationStatus is not VERIFIED_400");
}
if (manifest.sourceHead !== acceptedSourceHead) {
  errors.push("manifest sourceHead changed from the accepted production source");
}
if (manifest.sourceTree !== acceptedSourceTree) {
  errors.push("manifest sourceTree changed from the accepted production source");
}
if (manifest.acceptedIntegrationManifestSha256 !== acceptedIntegrationManifestSha256) {
  errors.push("accepted integration manifest identity changed");
}
if (manifest.entries.length !== 400) errors.push("manifest must contain 400 entries");
if (new Set(manifest.entries.map((entry) => entry.cellId)).size !== 400) {
  errors.push("manifest cell IDs are not unique");
}

for (const locale of locales) {
  const cells = manifest.entries.filter((entry) => entry.locale === locale);
  if (cells.length !== 100) errors.push(`${locale}: expected 100 entries`);
  const expectedFiles = new Set(cells.map((entry) => `${entry.lessonId}.${entry.actualFormat}`));
  const files = existsSync(join(publicRoot, locale))
    ? readdirSync(join(publicRoot, locale)).filter((name) => /\.(?:png|webp)$/.test(name))
    : [];
  if (files.length !== 100) errors.push(`${locale}: expected 100 public image files`);
  for (const file of files) {
    if (!expectedFiles.has(file)) errors.push(`${locale}: unexpected public image ${file}`);
  }
  for (const file of expectedFiles) {
    if (!files.includes(file)) errors.push(`${locale}: missing expected public image ${file}`);
  }
}

if (
  manifest.entries.filter((entry) => entry.actualFormat === "webp").length !== 396 ||
  manifest.entries.filter((entry) => entry.actualFormat === "png").length !== 4
) {
  errors.push("manifest must contain exactly 396 WebP and 4 PNG assets");
}
if (
  manifest.entries.filter((entry) => entry.sourceType === "infographic").length !== 396 ||
  manifest.entries.filter((entry) => entry.sourceType === "screenshot").length !== 4
) {
  errors.push("manifest must contain exactly 396 infographics and 4 screenshots");
}
if (manifest.entries.reduce((total, entry) => total + entry.assetBytes, 0) !== 117078840) {
  errors.push("manifest total image bytes changed");
}

for (const entry of manifest.entries) {
  const expectedPath = `/lesson-visuals/contextual-v2/${entry.locale}/${entry.lessonId}.${entry.actualFormat}`;
  if (entry.publicPath !== expectedPath) errors.push(`${entry.cellId}: wrong publicPath`);
  if (entry.productionStatus !== "verified") errors.push(`${entry.cellId}: not verified`);
  if (entry.sourceHead !== acceptedSourceHead) errors.push(`${entry.cellId}: wrong sourceHead`);
  if (
    entry.sourcePath !== `src/lib/locale-lessons/${entry.locale}/lessons/${entry.lessonId}.json`
  ) {
    errors.push(`${entry.cellId}: wrong sourcePath`);
  }
  const assetPath = join(repo, "public", entry.publicPath);
  if (!existsSync(assetPath)) {
    errors.push(`${entry.cellId}: missing public asset`);
    continue;
  }
  const bytes = readFileSync(assetPath);
  if (statSync(assetPath).size !== entry.assetBytes) errors.push(`${entry.cellId}: byte mismatch`);
  if (sha256(bytes) !== entry.assetSha256) errors.push(`${entry.cellId}: asset hash mismatch`);
  const isWebp =
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP";
  const isPng = bytes
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (entry.actualFormat === "webp" ? !isWebp : !isPng) {
    errors.push(`${entry.cellId}: format bytes mismatch`);
  }
  const sourcePath = join(repo, entry.sourcePath);
  if (!existsSync(sourcePath)) errors.push(`${entry.cellId}: missing source lesson`);
  else {
    // Git checkouts may convert the accepted LF bytes to CRLF on Windows.
    // Normalize only CRLF here; lone CR and every other byte remain significant.
    const sourceBytes = imageGenerationSourceBytes(
      entry,
      canonicalizeCheckoutLineEndings(readFileSync(sourcePath)),
    );
    if (sha256(sourceBytes) !== entry.sourceSha256)
      errors.push(`${entry.cellId}: source SHA-256 mismatch`);
    if (gitBlob(sourceBytes) !== entry.sourceBlob)
      errors.push(`${entry.cellId}: source blob mismatch`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("contextual-v2: verified 400 assets, 100 lessons, 4 locales");
