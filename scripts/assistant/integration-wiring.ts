import ts from "typescript";
import path from "node:path";
import type { IntegrationIssue } from "../../src/lib/card-assistant/integration-contract";

const normalized = (file: string) => file.replace(/\\/g, "/").replace(/\.(tsx?|jsx?)$/, "");
function importedPath(from: string, target: string): string {
  return normalized(target.startsWith("@/") ? "src/" + target.slice(2) : path.posix.join(path.posix.dirname(from), target));
}
/** Inspect actual imports and JSX calls; comments or unused imports cannot satisfy the template gate. */
export function verifyAssistantWiring(read: (file: string) => string): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];
  const edges = [
    ["src/components/assistant/AssistantPanel.tsx", "src/components/assistant/AssistantConversationPanel", "AssistantConversationPanel"],
    ["src/components/assistant/CardPathAssistant.tsx", "src/components/assistant/AssistantConversationPanel", "AssistantConversationPanel"],
    ["src/components/academic-education/AcademicAssistantPanel.tsx", "src/components/assistant/AssistantConversationPanel", "AssistantConversationPanel"],
    ["src/components/kids/KidsLessonBody.tsx", "src/components/assistant/CardPathAssistant", "CardPathAssistant"],
    ["src/routes/technical.learn.$lessonId.tsx", "src/components/assistant/CardPathAssistant", "CardPathAssistant"],
    ["src/components/academic-education/AcademicLessonPage.tsx", "src/components/academic-education/AcademicAssistantPanel", "AcademicAssistantPanel"],
  ];
  for (const [file, target, exported] of edges) {
    try {
      const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      let local: string | undefined;
      for (const statement of source.statements) if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) &&
        importedPath(file, statement.moduleSpecifier.text) === target && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
        local = statement.importClause.namedBindings.elements.find(specifier => (specifier.propertyName ?? specifier.name).text === exported)?.name.text;
      }
      let mounted = false;
      const visit = (node: ts.Node) => {
        if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && ts.isIdentifier(node.tagName) && node.tagName.text === local) mounted = true;
        ts.forEachChild(node, visit);
      };
      visit(source);
      if (!mounted) issues.push({ code: "SHARED_TEMPLATE", location: file, message: `Import and render ${exported} from ${target}; per-card UI copies do not satisfy this contract.` });
    } catch { issues.push({ code: "MISSING_TEMPLATE", location: file, message: "Restore the shared assistant mount file." }); }
  }
  // These are the implemented per-area authoritative access contracts. Their
  // authorization semantics are exercised by backend/SQL tests, not inferred here.
  const access = [
    ["supabase/functions/assistant-runtime/handler.ts", "assistant_card_content_access", "reserve_learner_ai_access"],
    ["src/lib/card-assistant/assistant.server.ts", "card_assistant_access", "card_assistant_take_question"],
    ["src/lib/academic-education/assistant.server.ts", "academic_assistant_access", "academic_assistant_take_question"],
  ];
  for (const [file, ...required] of access) {
    try {
      const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);
      const calls = new Set<string>();
      const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node)) for (const argument of node.arguments) if (ts.isStringLiteral(argument)) calls.add(argument.text);
        ts.forEachChild(node, visit);
      };
      visit(source);
      for (const name of required) if (!calls.has(name)) issues.push({ code: "ACCESS_ADAPTER", location: file, message: `Restore the authoritative ${name} call and rerun its authorization tests.` });
    } catch { issues.push({ code: "ACCESS_ADAPTER", location: file, message: "Restore the registered area access adapter." }); }
  }
  return issues;
}
