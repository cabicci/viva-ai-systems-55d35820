import type { IntroLessonContent } from "../intro-lesson-types";
import { WHAT_IS_AI_CONTENT } from "./intro-m1-l1-what-is-ai";
import { AI_VS_SOFTWARE_CONTENT } from "./intro-m1-l5-ai-vs-software";
import { AI_CAN_CANNOT_CONTENT } from "./intro-m1-l4-ai-can-cannot";
import { LEARN_WITHOUT_FEAR_CONTENT } from "./intro-m1-l6-learn-without-fear";
import { CREATOR_M1_WHY_CONTENT_BLOCKS } from "./creator-m1-why-content";
import { CREATOR_M1_ATTENTION_ECONOMY_BLOCKS } from "./creator-m1-attention-economy";
import { CREATOR_M2_HOOK_BLOCKS } from "./creator-m2-hook";
import { CREATOR_M2_SCRIPT_STRUCTURE_BLOCKS } from "./creator-m2-script-structure";
import { CREATOR_M2_CTA_BLOCKS } from "./creator-m2-cta";
import { CREATOR_M3_KNOW_AUDIENCE_BLOCKS } from "./creator-m3-know-audience";
import { CREATOR_M3_CONTENT_PILLARS_BLOCKS } from "./creator-m3-content-pillars";
import { CREATOR_M4_REALITY_CHECK_BLOCKS } from "./creator-m4-reality-check";
import { CREATOR_M4_MOBILE_SHOOTING_BLOCKS } from "./creator-m4-mobile-shooting";
import { CREATOR_M4_AI_WRITING_BLOCKS } from "./creator-m4-ai-writing";
import { CREATOR_M5_PLATFORMS_BLOCKS } from "./creator-m5-platforms";
import { CREATOR_M5_SCHEDULING_BLOCKS } from "./creator-m5-scheduling";
import { CREATOR_M5_ANALYTICS_BLOCKS } from "./creator-m5-analytics";
import { CREATOR_M5_LEADS_BLOCKS } from "./creator-m5-leads";
import { BUILDER_M1_WHAT_IS_LLM_BLOCKS } from "./builder-m1-l1-what-is-llm";
import { BUILDER_M1_TOKENS_TRAINING_BLOCKS } from "./builder-m1-l2-tokens-training";
import { BUILDER_M2_PROMPT_LAYER_BLOCKS } from "./builder-m2-l3-prompt-layer";
import { BUILDER_M2_INSTRUCTIONS_EXAMPLES_BLOCKS } from "./builder-m2-l4-instructions-examples";
import { BUILDER_M2_STYLE_CONTROL_BLOCKS } from "./builder-m2-l5-style-control";
import { BUILDER_M3_CONTEXT_LAYER_BLOCKS } from "./builder-m3-l6-context-layer";
import { BUILDER_M3_MEMORY_LIMITS_BLOCKS } from "./builder-m3-l7-memory-limits";
import { BUILDER_M4_TEMPERATURE_BLOCKS } from "./builder-m4-l8-parameters";
import { BUILDER_M5_FRONTEND_BLOCKS } from "./builder-m5-l10-frontend";
import { BUILDER_M5_BACKEND_API_BLOCKS } from "./builder-m5-l11-backend-api";
import { BUILDER_M5_DATABASE_INTRO_BLOCKS } from "./builder-m5-l12-database-intro";
import { BUILDER_M6_IDEA_TO_PAGE_BLOCKS } from "./builder-m6-l13-idea-to-page";
import { BUILDER_M6_COMPONENTS_ROUTES_BLOCKS } from "./builder-m6-l16-components-routes";
import { BUILDER_M7_SESSIONS_JWT_BLOCKS } from "./builder-m8-l22-sessions-jwt";
import { BUILDER_M7_RLS_BLOCKS } from "./builder-m8-l23-rls";
import { BUILDER_M8_TABLES_COLUMNS_BLOCKS } from "./builder-m7-l19-tables-columns";
import { BUILDER_M8_RELATIONS_BLOCKS } from "./builder-m7-l20-relations";
import { BUILDER_M8_QUERIES_BLOCKS } from "./builder-m7-l21-queries";
import { BUILDER_M9_EMBEDDINGS_BLOCKS } from "./builder-m9-l25-embeddings";
import { BUILDER_M9_RAG_BLOCKS } from "./builder-m9-l24-rag";
import { BUILDER_M9_AGENTS_BLOCKS } from "./builder-m9-l26-agents";
import { BUILDER_M10_DEPLOY_DOMAIN_BLOCKS } from "./builder-m10-deploy-domain";
import { BUILDER_M10_FIRST_USERS_BLOCKS } from "./builder-m10-first-users";
import { AUTOMATOR_M0_WHERE_YOU_ARE_BLOCKS } from "./automator-m0-where-you-are";
import { AUTOMATOR_M1_SYSTEMS_VIEW_BLOCKS } from "./automator-m1-systems-view";
import { AUTOMATOR_M1_SPOT_PATTERNS_BLOCKS } from "./automator-m1-spot-patterns";
import { AUTOMATOR_M1_DECIDE_WHAT_TO_AUTOMATE_BLOCKS } from "./automator-m1-decide-what-to-automate";
import { AUTOMATOR_M2_TOOLS_LANDSCAPE_BLOCKS } from "./automator-m2-tools-landscape";
import { AUTOMATOR_M2_TRIGGERS_ACTIONS_BLOCKS } from "./automator-m2-triggers-actions";
import { AUTOMATOR_M2_FILTERS_ROUTERS_BLOCKS } from "./automator-m2-filters-routers";
import { AUTOMATOR_M3_CONNECT_DATABASE_BLOCKS } from "./automator-m3-connect-database";
import { AUTOMATOR_M3_WEBHOOKS_API_BLOCKS } from "./automator-m3-webhooks-api";
import { AUTOMATOR_M3_ERROR_HANDLING_BLOCKS } from "./automator-m3-error-handling";
import { AUTOMATOR_M4_LLM_IN_FLOW_BLOCKS } from "./automator-m4-llm-in-flow";
import { AUTOMATOR_M4_RAG_IN_N8N_BLOCKS } from "./automator-m4-rag-in-n8n";
import { AUTOMATOR_M4_AGENTS_BLOCKS } from "./automator-m4-agents";
import { AUTOMATOR_M5_LEAD_CAPTURE_BLOCKS } from "./automator-m5-lead-capture";
import { AUTOMATOR_M5_WHATSAPP_FLOW_BLOCKS } from "./automator-m5-whatsapp-flow";
import { AUTOMATOR_M5_FOLLOW_UP_BLOCKS } from "./automator-m5-follow-up";
import { AUTOMATOR_M6_CLOSING_LOOP_BLOCKS } from "./automator-m6-closing-loop";
import { INTRO_FIRST_PROMPT_CONTENT } from "./intro-m1-l2-first-prompt";
import { INTRO_CHOOSE_YOUR_PATH_CONTENT } from "./intro-m1-l7-choose-your-path";
import { BUILDER_M6_WIREFRAME_BLOCKS } from "./builder-m6-l14-wireframe";
import { BUILDER_M6_FIRST_PROMPT_TO_LOVABLE_BLOCKS } from "./builder-m6-l15-first-prompt-to-lovable";
import { BUILDER_M6_ITERATION_BLOCKS } from "./builder-m6-l17-iteration";
import { BUILDER_M6_DEBUGGING_BLOCKS } from "./builder-m6-l18-debugging";
import { CREATOR_M4_EDITING_BLOCKS } from "./creator-m4-editing";
import { CREATOR_M4_THUMBNAILS_CAPTIONS_BLOCKS } from "./creator-m4-thumbnails-captions";
import { CREATOR_M6_BRAND_BASICS_BLOCKS } from "./creator-m6-brand-basics";
import { CREATOR_M6_GRID_CONSISTENCY_BLOCKS } from "./creator-m6-grid-consistency";
import { INTRO_SETUP_YOUR_AI_CONTENT } from "./intro-m1-l3-setup-your-ai";
import { BUILDER_M5_TRANSITION_BLOCKS } from "./builder-m5-l9-transition";
/* Analyst (12) */
import { ANALYST_M0_FROM_AUTOMATION_TO_INSIGHT_BLOCKS } from "./analyst-m0-from-automation-to-insight";
import { ANALYST_M1_FEELING_TO_QUESTION_BLOCKS } from "./analyst-m1-feeling-to-question";
import { ANALYST_M1_RIGHT_QUESTION_RULE_BLOCKS } from "./analyst-m1-right-question-rule";
import { ANALYST_M2_THREE_SOURCES_BLOCKS } from "./analyst-m2-three-sources";
import { ANALYST_M2_AI_SUMMARIZATION_BLOCKS } from "./analyst-m2-ai-summarization";
import { ANALYST_M3_PATTERN_VS_OUTLIER_BLOCKS } from "./analyst-m3-pattern-vs-outlier";
import { ANALYST_M3_DECISION_RULE_BLOCKS } from "./analyst-m3-decision-rule";
import { ANALYST_M4_FOUR_NUMBERS_DASHBOARD_BLOCKS } from "./analyst-m4-four-numbers-dashboard";
import { ANALYST_M4_WEEKLY_REVIEW_RITUAL_BLOCKS } from "./analyst-m4-weekly-review-ritual";
import { ANALYST_M5_QUESTION_MISTAKES_BLOCKS } from "./analyst-m5-question-mistakes";
import { ANALYST_M5_INTERPRETATION_MISTAKES_BLOCKS } from "./analyst-m5-interpretation-mistakes";
import { ANALYST_M6_FROM_DECISIONS_TO_BUSINESS_BLOCKS } from "./analyst-m6-from-decisions-to-business";
/* Business (12) */
import { BUSINESS_M0_FROM_DECISIONS_TO_LEADERSHIP_BLOCKS } from "./business-m0-from-decisions-to-leadership";
import { BUSINESS_M1_REACTIVE_VS_PROACTIVE_BLOCKS } from "./business-m1-reactive-vs-proactive";
import { BUSINESS_M1_WEEKLY_RHYTHM_BLOCKS } from "./business-m1-weekly-rhythm";
import { BUSINESS_M2_CUSTOMER_LIFECYCLE_BLOCKS } from "./business-m2-customer-lifecycle";
import { BUSINESS_M2_RETENTION_FLOW_BLOCKS } from "./business-m2-retention-flow";
import { BUSINESS_M3_STRATEGIC_OPERATIONAL_ADMIN_BLOCKS } from "./business-m3-strategic-operational-admin";
import { BUSINESS_M3_DELEGATE_OR_AUTOMATE_BLOCKS } from "./business-m3-delegate-or-automate";
import { BUSINESS_M4_READINESS_SIGNALS_BLOCKS } from "./business-m4-readiness-signals";
import { BUSINESS_M4_SYSTEM_THEN_PEOPLE_BLOCKS } from "./business-m4-system-then-people";
import { BUSINESS_M5_REACTIVE_RELAPSE_BLOCKS } from "./business-m5-reactive-relapse";
import { BUSINESS_M5_PREMATURE_SCALING_BLOCKS } from "./business-m5-premature-scaling";
import { BUSINESS_M6_FULL_ECOSYSTEM_BLOCKS } from "./business-m6-full-ecosystem";

/**
 * Registry of full Introduction lesson bodies, keyed by route slug.
 * To add a new intro lesson body: create a new content file and
 * register it here. No other UI wiring required.
 */
export const INTRO_LESSON_CONTENT: Record<string, IntroLessonContent> = {
  "intro-m1-l3-setup-your-ai": INTRO_SETUP_YOUR_AI_CONTENT,
  "intro-m1-l1-what-is-ai": WHAT_IS_AI_CONTENT,
  "intro-m1-l5-ai-vs-software": AI_VS_SOFTWARE_CONTENT,
  "intro-m1-l4-ai-can-cannot": AI_CAN_CANNOT_CONTENT,
  "intro-m1-l6-learn-without-fear": LEARN_WITHOUT_FEAR_CONTENT,
  "creator-m1-why-content": CREATOR_M1_WHY_CONTENT_BLOCKS,
  "creator-m1-attention-economy": CREATOR_M1_ATTENTION_ECONOMY_BLOCKS,
  "creator-m2-hook": CREATOR_M2_HOOK_BLOCKS,
  "creator-m2-script-structure": CREATOR_M2_SCRIPT_STRUCTURE_BLOCKS,
  "creator-m2-cta": CREATOR_M2_CTA_BLOCKS,
  "creator-m3-know-audience": CREATOR_M3_KNOW_AUDIENCE_BLOCKS,
  "creator-m3-content-pillars": CREATOR_M3_CONTENT_PILLARS_BLOCKS,
  "creator-m4-reality-check": CREATOR_M4_REALITY_CHECK_BLOCKS,
  "creator-m4-mobile-shooting": CREATOR_M4_MOBILE_SHOOTING_BLOCKS,
  "creator-m4-ai-writing": CREATOR_M4_AI_WRITING_BLOCKS,
  "creator-m5-platforms": CREATOR_M5_PLATFORMS_BLOCKS,
  "creator-m5-scheduling": CREATOR_M5_SCHEDULING_BLOCKS,
  "creator-m5-analytics": CREATOR_M5_ANALYTICS_BLOCKS,
  "creator-m5-leads": CREATOR_M5_LEADS_BLOCKS,
  "builder-m1-l1-what-is-llm": BUILDER_M1_WHAT_IS_LLM_BLOCKS,
  "builder-m1-l2-tokens-training": BUILDER_M1_TOKENS_TRAINING_BLOCKS,
  "builder-m2-l3-prompt-layer": BUILDER_M2_PROMPT_LAYER_BLOCKS,
  "builder-m2-l4-instructions-examples": BUILDER_M2_INSTRUCTIONS_EXAMPLES_BLOCKS,
  "builder-m2-l5-style-control": BUILDER_M2_STYLE_CONTROL_BLOCKS,
  "builder-m3-l6-context-layer": BUILDER_M3_CONTEXT_LAYER_BLOCKS,
  "builder-m3-l7-memory-limits": BUILDER_M3_MEMORY_LIMITS_BLOCKS,
  "builder-m4-l8-parameters": BUILDER_M4_TEMPERATURE_BLOCKS,
  "builder-m4-l8-parameters": BUILDER_M4_PARAMETERS_BLOCKS,
  "builder-m5-l10-frontend": BUILDER_M5_FRONTEND_BLOCKS,
  "builder-m5-l9-transition": BUILDER_M5_TRANSITION_BLOCKS,
  "builder-m5-l11-backend-api": BUILDER_M5_BACKEND_API_BLOCKS,
  "builder-m5-l12-database-intro": BUILDER_M5_DATABASE_INTRO_BLOCKS,
  "builder-m6-l13-idea-to-page": BUILDER_M6_IDEA_TO_PAGE_BLOCKS,
  "builder-m6-l16-components-routes": BUILDER_M6_COMPONENTS_ROUTES_BLOCKS,
  "builder-m8-l22-sessions-jwt": BUILDER_M7_SESSIONS_JWT_BLOCKS,
  "builder-m8-l23-rls": BUILDER_M7_RLS_BLOCKS,
  "builder-m7-l19-tables-columns": BUILDER_M8_TABLES_COLUMNS_BLOCKS,
  "builder-m7-l20-relations": BUILDER_M8_RELATIONS_BLOCKS,
  "builder-m7-l21-queries": BUILDER_M8_QUERIES_BLOCKS,
  "builder-m9-l25-embeddings": BUILDER_M9_EMBEDDINGS_BLOCKS,
  "builder-m9-l24-rag": BUILDER_M9_RAG_BLOCKS,
  "builder-m9-l26-agents": BUILDER_M9_AGENTS_BLOCKS,
  "builder-m10-deploy-domain": BUILDER_M10_DEPLOY_DOMAIN_BLOCKS,
  "builder-m10-first-users": BUILDER_M10_FIRST_USERS_BLOCKS,
  "automator-m0-where-you-are": AUTOMATOR_M0_WHERE_YOU_ARE_BLOCKS,
  "automator-m1-systems-view": AUTOMATOR_M1_SYSTEMS_VIEW_BLOCKS,
  "automator-m1-spot-patterns": AUTOMATOR_M1_SPOT_PATTERNS_BLOCKS,
  "automator-m1-decide-what-to-automate": AUTOMATOR_M1_DECIDE_WHAT_TO_AUTOMATE_BLOCKS,
  "automator-m2-tools-landscape": AUTOMATOR_M2_TOOLS_LANDSCAPE_BLOCKS,
  "automator-m2-triggers-actions": AUTOMATOR_M2_TRIGGERS_ACTIONS_BLOCKS,
  "automator-m2-filters-routers": AUTOMATOR_M2_FILTERS_ROUTERS_BLOCKS,
  "automator-m3-connect-database": AUTOMATOR_M3_CONNECT_DATABASE_BLOCKS,
  "automator-m3-webhooks-api": AUTOMATOR_M3_WEBHOOKS_API_BLOCKS,
  "automator-m3-error-handling": AUTOMATOR_M3_ERROR_HANDLING_BLOCKS,
  "automator-m4-llm-in-flow": AUTOMATOR_M4_LLM_IN_FLOW_BLOCKS,
  "automator-m4-rag-in-n8n": AUTOMATOR_M4_RAG_IN_N8N_BLOCKS,
  "automator-m4-agents": AUTOMATOR_M4_AGENTS_BLOCKS,
  "automator-m5-lead-capture": AUTOMATOR_M5_LEAD_CAPTURE_BLOCKS,
  "automator-m5-whatsapp-flow": AUTOMATOR_M5_WHATSAPP_FLOW_BLOCKS,
  "automator-m5-follow-up": AUTOMATOR_M5_FOLLOW_UP_BLOCKS,
  "automator-m6-closing-loop": AUTOMATOR_M6_CLOSING_LOOP_BLOCKS,
  "intro-m1-l2-first-prompt": INTRO_FIRST_PROMPT_CONTENT,
  "intro-m1-l7-choose-your-path": INTRO_CHOOSE_YOUR_PATH_CONTENT,
  "builder-m6-l14-wireframe": BUILDER_M6_WIREFRAME_BLOCKS,
  "builder-m6-l15-first-prompt-to-lovable": BUILDER_M6_FIRST_PROMPT_TO_LOVABLE_BLOCKS,
  "builder-m6-l17-iteration": BUILDER_M6_ITERATION_BLOCKS,
  "builder-m6-l18-debugging": BUILDER_M6_DEBUGGING_BLOCKS,
  "creator-m4-editing": CREATOR_M4_EDITING_BLOCKS,
  "creator-m4-thumbnails-captions": CREATOR_M4_THUMBNAILS_CAPTIONS_BLOCKS,
  "creator-m6-brand-basics": CREATOR_M6_BRAND_BASICS_BLOCKS,
  "creator-m6-grid-consistency": CREATOR_M6_GRID_CONSISTENCY_BLOCKS,
  /* Analyst */
  "analyst-m0-from-automation-to-insight": ANALYST_M0_FROM_AUTOMATION_TO_INSIGHT_BLOCKS,
  "analyst-m1-feeling-to-question": ANALYST_M1_FEELING_TO_QUESTION_BLOCKS,
  "analyst-m1-right-question-rule": ANALYST_M1_RIGHT_QUESTION_RULE_BLOCKS,
  "analyst-m2-three-sources": ANALYST_M2_THREE_SOURCES_BLOCKS,
  "analyst-m2-ai-summarization": ANALYST_M2_AI_SUMMARIZATION_BLOCKS,
  "analyst-m3-pattern-vs-outlier": ANALYST_M3_PATTERN_VS_OUTLIER_BLOCKS,
  "analyst-m3-decision-rule": ANALYST_M3_DECISION_RULE_BLOCKS,
  "analyst-m4-four-numbers-dashboard": ANALYST_M4_FOUR_NUMBERS_DASHBOARD_BLOCKS,
  "analyst-m4-weekly-review-ritual": ANALYST_M4_WEEKLY_REVIEW_RITUAL_BLOCKS,
  "analyst-m5-question-mistakes": ANALYST_M5_QUESTION_MISTAKES_BLOCKS,
  "analyst-m5-interpretation-mistakes": ANALYST_M5_INTERPRETATION_MISTAKES_BLOCKS,
  "analyst-m6-from-decisions-to-business": ANALYST_M6_FROM_DECISIONS_TO_BUSINESS_BLOCKS,
  /* Business */
  "business-m0-from-decisions-to-leadership": BUSINESS_M0_FROM_DECISIONS_TO_LEADERSHIP_BLOCKS,
  "business-m1-reactive-vs-proactive": BUSINESS_M1_REACTIVE_VS_PROACTIVE_BLOCKS,
  "business-m1-weekly-rhythm": BUSINESS_M1_WEEKLY_RHYTHM_BLOCKS,
  "business-m2-customer-lifecycle": BUSINESS_M2_CUSTOMER_LIFECYCLE_BLOCKS,
  "business-m2-retention-flow": BUSINESS_M2_RETENTION_FLOW_BLOCKS,
  "business-m3-strategic-operational-admin": BUSINESS_M3_STRATEGIC_OPERATIONAL_ADMIN_BLOCKS,
  "business-m3-delegate-or-automate": BUSINESS_M3_DELEGATE_OR_AUTOMATE_BLOCKS,
  "business-m4-readiness-signals": BUSINESS_M4_READINESS_SIGNALS_BLOCKS,
  "business-m4-system-then-people": BUSINESS_M4_SYSTEM_THEN_PEOPLE_BLOCKS,
  "business-m5-reactive-relapse": BUSINESS_M5_REACTIVE_RELAPSE_BLOCKS,
  "business-m5-premature-scaling": BUSINESS_M5_PREMATURE_SCALING_BLOCKS,
  "business-m6-full-ecosystem": BUSINESS_M6_FULL_ECOSYSTEM_BLOCKS,
};