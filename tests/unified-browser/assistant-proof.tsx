import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { CourseLessonAssistant } from "../../src/components/assistant/CourseLessonAssistant";
import { changeFixture, useAuth, useLocale, fixtureCalls } from "./context-fixture";
import "../../src/styles.css";
function Proof() {
  const { user } = useAuth(), { locale } = useLocale(); const [lesson, setLesson] = useState("fixture-a");
  return <main style={{ padding: 24, minHeight: "100vh" }}>
    <h1>Unified assistant browser fixture</h1>
    <p>Real AI course mount, launcher, conversation, history and owned SDK helper; explicit fixture auth/SDK replies. No real model or account.</p>
    <p id="actor">{user.id}</p>
    <button id="actor-switch" onClick={() => changeFixture({ actor: user.id.endsWith("a") ? "browser-fixture-b" : "browser-fixture-a" })}>Switch fixture actor</button>
    <button id="locale-switch" onClick={() => changeFixture({ locale: locale === "en" ? "ar-EG" : "en" })}>Switch fixture locale</button>
    <button id="lesson-switch" onClick={() => setLesson(value => value === "fixture-a" ? "fixture-b" : "fixture-a")}>Switch fixture lesson</button>
    <button id="deny" onClick={() => changeFixture({ denied: true })}>Deny fixture request</button>
    <output id="requests">{fixtureCalls.length}</output>
    <CourseLessonAssistant area="ai" pathId="intro" lessonId={lesson} locale={locale as "en" | "ar-EG"} contextOverride={null} />
    <button id="continue" data-assistant-avoid style={{ position: "fixed", left: 16, bottom: 16, width: 220, height: 56, background: "#bcdfee" }}>Continue fixture lesson</button>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Proof />);
