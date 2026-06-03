// Auto-managed by remotion/scripts/build-lesson.py.
// Each entry maps a lesson id to its generated scenes module.
// New lessons are appended automatically; do NOT edit by hand.

import type { LessonRendererProps } from "./LessonRenderer";

export type LessonModule = LessonRendererProps & {
  id: string;
  totalFrames: number;
};

// The build script appends imports + entries below the marker.
/* @lesson-imports-start */
import { SCENES as L_builder_m2_prompt_layer_S, SCENE_FRAMES as L_builder_m2_prompt_layer_F, TOTAL_FRAMES as L_builder_m2_prompt_layer_T } from "./lessons-generated/builder-m2-l3-prompt-layer.gen";
import { SCENES as L_builder_m2_instructions_examples_S, SCENE_FRAMES as L_builder_m2_instructions_examples_F, TOTAL_FRAMES as L_builder_m2_instructions_examples_T } from "./lessons-generated/builder-m2-l4-instructions-examples.gen";
import { SCENES as L_builder_m2_style_control_S, SCENE_FRAMES as L_builder_m2_style_control_F, TOTAL_FRAMES as L_builder_m2_style_control_T } from "./lessons-generated/builder-m2-l5-style-control.gen";
import { SCENES as L_builder_m3_context_layer_S, SCENE_FRAMES as L_builder_m3_context_layer_F, TOTAL_FRAMES as L_builder_m3_context_layer_T } from "./lessons-generated/builder-m3-l6-context-layer.gen";
import { SCENES as L_builder_m3_memory_limits_S, SCENE_FRAMES as L_builder_m3_memory_limits_F, TOTAL_FRAMES as L_builder_m3_memory_limits_T } from "./lessons-generated/builder-m3-l7-memory-limits.gen";
import { SCENES as L_builder_m5_database_intro_S, SCENE_FRAMES as L_builder_m5_database_intro_F, TOTAL_FRAMES as L_builder_m5_database_intro_T } from "./lessons-generated/builder-m5-l12-database-intro.gen";
import { SCENES as L_builder_m5_transition_S, SCENE_FRAMES as L_builder_m5_transition_F, TOTAL_FRAMES as L_builder_m5_transition_T } from "./lessons-generated/builder-m5-l9-transition.gen";
import { SCENES as L_builder_m6_idea_to_page_S, SCENE_FRAMES as L_builder_m6_idea_to_page_F, TOTAL_FRAMES as L_builder_m6_idea_to_page_T } from "./lessons-generated/builder-m6-l13-idea-to-page.gen";
import { SCENES as L_builder_m6_wireframe_S, SCENE_FRAMES as L_builder_m6_wireframe_F, TOTAL_FRAMES as L_builder_m6_wireframe_T } from "./lessons-generated/builder-m6-l14-wireframe.gen";
import { SCENES as L_builder_m6_first_prompt_to_lovable_S, SCENE_FRAMES as L_builder_m6_first_prompt_to_lovable_F, TOTAL_FRAMES as L_builder_m6_first_prompt_to_lovable_T } from "./lessons-generated/builder-m6-l15-first-prompt-to-lovable.gen";
import { SCENES as L_builder_m6_components_routes_S, SCENE_FRAMES as L_builder_m6_components_routes_F, TOTAL_FRAMES as L_builder_m6_components_routes_T } from "./lessons-generated/builder-m6-l16-components-routes.gen";
import { SCENES as L_builder_m6_iteration_S, SCENE_FRAMES as L_builder_m6_iteration_F, TOTAL_FRAMES as L_builder_m6_iteration_T } from "./lessons-generated/builder-m6-l17-iteration.gen";
import { SCENES as L_builder_m7_sessions_jwt_S, SCENE_FRAMES as L_builder_m7_sessions_jwt_F, TOTAL_FRAMES as L_builder_m7_sessions_jwt_T } from "./lessons-generated/builder-m8-l22-sessions-jwt.gen";
import { SCENES as L_builder_m8_relations_S, SCENE_FRAMES as L_builder_m8_relations_F, TOTAL_FRAMES as L_builder_m8_relations_T } from "./lessons-generated/builder-m7-l20-relations.gen";
import { SCENES as L_builder_m8_queries_S, SCENE_FRAMES as L_builder_m8_queries_F, TOTAL_FRAMES as L_builder_m8_queries_T } from "./lessons-generated/builder-m7-l21-queries.gen";
import { SCENES as L_builder_m9_agents_S, SCENE_FRAMES as L_builder_m9_agents_F, TOTAL_FRAMES as L_builder_m9_agents_T } from "./lessons-generated/builder-m9-l26-agents.gen";
import { SCENES as L_builder_m9_embeddings_S, SCENE_FRAMES as L_builder_m9_embeddings_F, TOTAL_FRAMES as L_builder_m9_embeddings_T } from "./lessons-generated/builder-m9-l25-embeddings.gen";
import { SCENES as L_builder_m9_rag_S, SCENE_FRAMES as L_builder_m9_rag_F, TOTAL_FRAMES as L_builder_m9_rag_T } from "./lessons-generated/builder-m9-l24-rag.gen";
import { SCENES as L_builder_m10_deploy_domain_S, SCENE_FRAMES as L_builder_m10_deploy_domain_F, TOTAL_FRAMES as L_builder_m10_deploy_domain_T } from "./lessons-generated/builder-m10-deploy-domain.gen";
import { SCENES as L_builder_m10_first_users_S, SCENE_FRAMES as L_builder_m10_first_users_F, TOTAL_FRAMES as L_builder_m10_first_users_T } from "./lessons-generated/builder-m10-first-users.gen";
import { SCENES as L_creator_m1_attention_economy_S, SCENE_FRAMES as L_creator_m1_attention_economy_F, TOTAL_FRAMES as L_creator_m1_attention_economy_T } from "./lessons-generated/creator-m1-attention-economy.gen";
import { SCENES as L_creator_m1_why_content_S, SCENE_FRAMES as L_creator_m1_why_content_F, TOTAL_FRAMES as L_creator_m1_why_content_T } from "./lessons-generated/creator-m1-why-content.gen";
import { SCENES as L_creator_m2_cta_S, SCENE_FRAMES as L_creator_m2_cta_F, TOTAL_FRAMES as L_creator_m2_cta_T } from "./lessons-generated/creator-m2-cta.gen";
import { SCENES as L_creator_m2_hook_S, SCENE_FRAMES as L_creator_m2_hook_F, TOTAL_FRAMES as L_creator_m2_hook_T } from "./lessons-generated/creator-m2-hook.gen";
import { SCENES as L_creator_m2_script_structure_S, SCENE_FRAMES as L_creator_m2_script_structure_F, TOTAL_FRAMES as L_creator_m2_script_structure_T } from "./lessons-generated/creator-m2-script-structure.gen";
import { SCENES as L_creator_m3_content_pillars_S, SCENE_FRAMES as L_creator_m3_content_pillars_F, TOTAL_FRAMES as L_creator_m3_content_pillars_T } from "./lessons-generated/creator-m3-content-pillars.gen";
import { SCENES as L_creator_m3_know_audience_S, SCENE_FRAMES as L_creator_m3_know_audience_F, TOTAL_FRAMES as L_creator_m3_know_audience_T } from "./lessons-generated/creator-m3-know-audience.gen";
import { SCENES as L_creator_m4_ai_writing_S, SCENE_FRAMES as L_creator_m4_ai_writing_F, TOTAL_FRAMES as L_creator_m4_ai_writing_T } from "./lessons-generated/creator-m4-ai-writing.gen";
import { SCENES as L_creator_m4_editing_S, SCENE_FRAMES as L_creator_m4_editing_F, TOTAL_FRAMES as L_creator_m4_editing_T } from "./lessons-generated/creator-m4-editing.gen";
import { SCENES as L_creator_m4_mobile_shooting_S, SCENE_FRAMES as L_creator_m4_mobile_shooting_F, TOTAL_FRAMES as L_creator_m4_mobile_shooting_T } from "./lessons-generated/creator-m4-mobile-shooting.gen";
import { SCENES as L_creator_m4_reality_check_S, SCENE_FRAMES as L_creator_m4_reality_check_F, TOTAL_FRAMES as L_creator_m4_reality_check_T } from "./lessons-generated/creator-m4-reality-check.gen";
import { SCENES as L_creator_m4_thumbnails_captions_S, SCENE_FRAMES as L_creator_m4_thumbnails_captions_F, TOTAL_FRAMES as L_creator_m4_thumbnails_captions_T } from "./lessons-generated/creator-m4-thumbnails-captions.gen";
import { SCENES as L_creator_m5_leads_S, SCENE_FRAMES as L_creator_m5_leads_F, TOTAL_FRAMES as L_creator_m5_leads_T } from "./lessons-generated/creator-m5-leads.gen";
import { SCENES as L_creator_m5_platforms_S, SCENE_FRAMES as L_creator_m5_platforms_F, TOTAL_FRAMES as L_creator_m5_platforms_T } from "./lessons-generated/creator-m5-platforms.gen";
import { SCENES as L_creator_m5_scheduling_S, SCENE_FRAMES as L_creator_m5_scheduling_F, TOTAL_FRAMES as L_creator_m5_scheduling_T } from "./lessons-generated/creator-m5-scheduling.gen";
import { SCENES as L_creator_m6_grid_consistency_S, SCENE_FRAMES as L_creator_m6_grid_consistency_F, TOTAL_FRAMES as L_creator_m6_grid_consistency_T } from "./lessons-generated/creator-m6-grid-consistency.gen";
import { SCENES as L_creator_m6_brand_basics_S, SCENE_FRAMES as L_creator_m6_brand_basics_F, TOTAL_FRAMES as L_creator_m6_brand_basics_T } from "./lessons-generated/creator-m6-brand-basics.gen";
import { SCENES as L_automator_m1_decide_what_to_automate_S, SCENE_FRAMES as L_automator_m1_decide_what_to_automate_F, TOTAL_FRAMES as L_automator_m1_decide_what_to_automate_T } from "./lessons-generated/automator-m1-decide-what-to-automate.gen";
import { SCENES as L_automator_m4_agents_S, SCENE_FRAMES as L_automator_m4_agents_F, TOTAL_FRAMES as L_automator_m4_agents_T } from "./lessons-generated/automator-m4-agents.gen";
import { SCENES as L_automator_m4_llm_in_flow_S, SCENE_FRAMES as L_automator_m4_llm_in_flow_F, TOTAL_FRAMES as L_automator_m4_llm_in_flow_T } from "./lessons-generated/automator-m4-llm-in-flow.gen";
import { SCENES as L_automator_m1_systems_view_S, SCENE_FRAMES as L_automator_m1_systems_view_F, TOTAL_FRAMES as L_automator_m1_systems_view_T } from "./lessons-generated/automator-m1-systems-view.gen";
import { SCENES as L_automator_m4_rag_in_n8n_S, SCENE_FRAMES as L_automator_m4_rag_in_n8n_F, TOTAL_FRAMES as L_automator_m4_rag_in_n8n_T } from "./lessons-generated/automator-m4-rag-in-n8n.gen";
import { SCENES as L_automator_m2_filters_routers_S, SCENE_FRAMES as L_automator_m2_filters_routers_F, TOTAL_FRAMES as L_automator_m2_filters_routers_T } from "./lessons-generated/automator-m2-filters-routers.gen";
import { SCENES as L_automator_m5_follow_up_S, SCENE_FRAMES as L_automator_m5_follow_up_F, TOTAL_FRAMES as L_automator_m5_follow_up_T } from "./lessons-generated/automator-m5-follow-up.gen";
import { SCENES as L_automator_m5_whatsapp_flow_S, SCENE_FRAMES as L_automator_m5_whatsapp_flow_F, TOTAL_FRAMES as L_automator_m5_whatsapp_flow_T } from "./lessons-generated/automator-m5-whatsapp-flow.gen";
import { SCENES as L_automator_m3_connect_database_S, SCENE_FRAMES as L_automator_m3_connect_database_F, TOTAL_FRAMES as L_automator_m3_connect_database_T } from "./lessons-generated/automator-m3-connect-database.gen";
import { SCENES as L_automator_m6_closing_loop_S, SCENE_FRAMES as L_automator_m6_closing_loop_F, TOTAL_FRAMES as L_automator_m6_closing_loop_T } from "./lessons-generated/automator-m6-closing-loop.gen";
import { SCENES as L_automator_m3_error_handling_S, SCENE_FRAMES as L_automator_m3_error_handling_F, TOTAL_FRAMES as L_automator_m3_error_handling_T } from "./lessons-generated/automator-m3-error-handling.gen";
import { SCENES as L_automator_m3_webhooks_api_S, SCENE_FRAMES as L_automator_m3_webhooks_api_F, TOTAL_FRAMES as L_automator_m3_webhooks_api_T } from "./lessons-generated/automator-m3-webhooks-api.gen";
import { SCENES as L_automator_m1_spot_patterns_S, SCENE_FRAMES as L_automator_m1_spot_patterns_F, TOTAL_FRAMES as L_automator_m1_spot_patterns_T } from "./lessons-generated/automator-m1-spot-patterns.gen";
import { SCENES as L_business_m3_strategic_operational_admin_S, SCENE_FRAMES as L_business_m3_strategic_operational_admin_F, TOTAL_FRAMES as L_business_m3_strategic_operational_admin_T } from "./lessons-generated/business-m3-strategic-operational-admin.gen";
import { SCENES as L_analyst_m3_pattern_vs_outlier_S, SCENE_FRAMES as L_analyst_m3_pattern_vs_outlier_F, TOTAL_FRAMES as L_analyst_m3_pattern_vs_outlier_T } from "./lessons-generated/analyst-m3-pattern-vs-outlier.gen";
import { SCENES as L_business_m0_from_decisions_to_leadership_S, SCENE_FRAMES as L_business_m0_from_decisions_to_leadership_F, TOTAL_FRAMES as L_business_m0_from_decisions_to_leadership_T } from "./lessons-generated/business-m0-from-decisions-to-leadership.gen";
import { SCENES as L_business_m4_readiness_signals_S, SCENE_FRAMES as L_business_m4_readiness_signals_F, TOTAL_FRAMES as L_business_m4_readiness_signals_T } from "./lessons-generated/business-m4-readiness-signals.gen";
import { SCENES as L_analyst_m1_feeling_to_question_S, SCENE_FRAMES as L_analyst_m1_feeling_to_question_F, TOTAL_FRAMES as L_analyst_m1_feeling_to_question_T } from "./lessons-generated/analyst-m1-feeling-to-question.gen";
import { SCENES as L_business_m1_reactive_vs_proactive_S, SCENE_FRAMES as L_business_m1_reactive_vs_proactive_F, TOTAL_FRAMES as L_business_m1_reactive_vs_proactive_T } from "./lessons-generated/business-m1-reactive-vs-proactive.gen";
import { SCENES as L_analyst_m4_four_numbers_dashboard_S, SCENE_FRAMES as L_analyst_m4_four_numbers_dashboard_F, TOTAL_FRAMES as L_analyst_m4_four_numbers_dashboard_T } from "./lessons-generated/analyst-m4-four-numbers-dashboard.gen";
import { SCENES as L_business_m4_system_then_people_S, SCENE_FRAMES as L_business_m4_system_then_people_F, TOTAL_FRAMES as L_business_m4_system_then_people_T } from "./lessons-generated/business-m4-system-then-people.gen";
import { SCENES as L_business_m5_premature_scaling_S, SCENE_FRAMES as L_business_m5_premature_scaling_F, TOTAL_FRAMES as L_business_m5_premature_scaling_T } from "./lessons-generated/business-m5-premature-scaling.gen";
import { SCENES as L_analyst_m5_interpretation_mistakes_S, SCENE_FRAMES as L_analyst_m5_interpretation_mistakes_F, TOTAL_FRAMES as L_analyst_m5_interpretation_mistakes_T } from "./lessons-generated/analyst-m5-interpretation-mistakes.gen";
import { SCENES as L_analyst_m2_ai_summarization_S, SCENE_FRAMES as L_analyst_m2_ai_summarization_F, TOTAL_FRAMES as L_analyst_m2_ai_summarization_T } from "./lessons-generated/analyst-m2-ai-summarization.gen";
import { SCENES as L_business_m2_retention_flow_S, SCENE_FRAMES as L_business_m2_retention_flow_F, TOTAL_FRAMES as L_business_m2_retention_flow_T } from "./lessons-generated/business-m2-retention-flow.gen";
import { SCENES as L_analyst_m5_question_mistakes_S, SCENE_FRAMES as L_analyst_m5_question_mistakes_F, TOTAL_FRAMES as L_analyst_m5_question_mistakes_T } from "./lessons-generated/analyst-m5-question-mistakes.gen";
import { SCENES as L_business_m6_full_ecosystem_S, SCENE_FRAMES as L_business_m6_full_ecosystem_F, TOTAL_FRAMES as L_business_m6_full_ecosystem_T } from "./lessons-generated/business-m6-full-ecosystem.gen";
import { SCENES as L_business_m3_delegate_or_automate_S, SCENE_FRAMES as L_business_m3_delegate_or_automate_F, TOTAL_FRAMES as L_business_m3_delegate_or_automate_T } from "./lessons-generated/business-m3-delegate-or-automate.gen";
import { SCENES as L_analyst_m3_decision_rule_S, SCENE_FRAMES as L_analyst_m3_decision_rule_F, TOTAL_FRAMES as L_analyst_m3_decision_rule_T } from "./lessons-generated/analyst-m3-decision-rule.gen";
import { SCENES as L_automator_m3_foundations_S, SCENE_FRAMES as L_automator_m3_foundations_F, TOTAL_FRAMES as L_automator_m3_foundations_T } from "./lessons-generated/automator-m3-foundations.gen";
import { SCENES as L_automator_m4_llm_node_bridge_S, SCENE_FRAMES as L_automator_m4_llm_node_bridge_F, TOTAL_FRAMES as L_automator_m4_llm_node_bridge_T } from "./lessons-generated/automator-m4-llm-node-bridge.gen";
import { SCENES as L_builder_m1_tokens_training_S, SCENE_FRAMES as L_builder_m1_tokens_training_F, TOTAL_FRAMES as L_builder_m1_tokens_training_T } from "./lessons-generated/builder-m1-l2-tokens-training.gen";
import { SCENES as L_builder_m5_backend_api_S, SCENE_FRAMES as L_builder_m5_backend_api_F, TOTAL_FRAMES as L_builder_m5_backend_api_T } from "./lessons-generated/builder-m5-l11-backend-api.gen";
import { SCENES as L_builder_m5_frontend_S, SCENE_FRAMES as L_builder_m5_frontend_F, TOTAL_FRAMES as L_builder_m5_frontend_T } from "./lessons-generated/builder-m5-l10-frontend.gen";
import { SCENES as L_business_m1_weekly_rhythm_S, SCENE_FRAMES as L_business_m1_weekly_rhythm_F, TOTAL_FRAMES as L_business_m1_weekly_rhythm_T } from "./lessons-generated/business-m1-weekly-rhythm.gen";
import { SCENES as L_builder_m1_what_is_llm_S, SCENE_FRAMES as L_builder_m1_what_is_llm_F, TOTAL_FRAMES as L_builder_m1_what_is_llm_T } from "./lessons-generated/builder-m1-l1-what-is-llm.gen";
import { SCENES as L_automator_m2_tools_landscape_S, SCENE_FRAMES as L_automator_m2_tools_landscape_F, TOTAL_FRAMES as L_automator_m2_tools_landscape_T } from "./lessons-generated/automator-m2-tools-landscape.gen";
import { SCENES as L_analyst_m2_three_sources_S, SCENE_FRAMES as L_analyst_m2_three_sources_F, TOTAL_FRAMES as L_analyst_m2_three_sources_T } from "./lessons-generated/analyst-m2-three-sources.gen";
import { SCENES as L_analyst_m0_from_automation_to_insight_S, SCENE_FRAMES as L_analyst_m0_from_automation_to_insight_F, TOTAL_FRAMES as L_analyst_m0_from_automation_to_insight_T } from "./lessons-generated/analyst-m0-from-automation-to-insight.gen";
import { SCENES as L_analyst_m4_weekly_review_ritual_S, SCENE_FRAMES as L_analyst_m4_weekly_review_ritual_F, TOTAL_FRAMES as L_analyst_m4_weekly_review_ritual_T } from "./lessons-generated/analyst-m4-weekly-review-ritual.gen";
import { SCENES as L_builder_m6_debugging_S, SCENE_FRAMES as L_builder_m6_debugging_F, TOTAL_FRAMES as L_builder_m6_debugging_T } from "./lessons-generated/builder-m6-l18-debugging.gen";
import { SCENES as L_automator_m5_lead_capture_S, SCENE_FRAMES as L_automator_m5_lead_capture_F, TOTAL_FRAMES as L_automator_m5_lead_capture_T } from "./lessons-generated/automator-m5-lead-capture.gen";
import { SCENES as L_business_m5_reactive_relapse_S, SCENE_FRAMES as L_business_m5_reactive_relapse_F, TOTAL_FRAMES as L_business_m5_reactive_relapse_T } from "./lessons-generated/business-m5-reactive-relapse.gen";
import { SCENES as L_business_m2_customer_lifecycle_S, SCENE_FRAMES as L_business_m2_customer_lifecycle_F, TOTAL_FRAMES as L_business_m2_customer_lifecycle_T } from "./lessons-generated/business-m2-customer-lifecycle.gen";
import { SCENES as L_analyst_m1_right_question_rule_S, SCENE_FRAMES as L_analyst_m1_right_question_rule_F, TOTAL_FRAMES as L_analyst_m1_right_question_rule_T } from "./lessons-generated/analyst-m1-right-question-rule.gen";
import { SCENES as L_builder_m7_rls_S, SCENE_FRAMES as L_builder_m7_rls_F, TOTAL_FRAMES as L_builder_m7_rls_T } from "./lessons-generated/builder-m8-l23-rls.gen";
import { SCENES as L_automator_m2_triggers_actions_S, SCENE_FRAMES as L_automator_m2_triggers_actions_F, TOTAL_FRAMES as L_automator_m2_triggers_actions_T } from "./lessons-generated/automator-m2-triggers-actions.gen";
import { SCENES as L_automator_m0_where_you_are_S, SCENE_FRAMES as L_automator_m0_where_you_are_F, TOTAL_FRAMES as L_automator_m0_where_you_are_T } from "./lessons-generated/automator-m0-where-you-are.gen";
import { SCENES as L_creator_m5_analytics_S, SCENE_FRAMES as L_creator_m5_analytics_F, TOTAL_FRAMES as L_creator_m5_analytics_T } from "./lessons-generated/creator-m5-analytics.gen";
import { SCENES as L_analyst_m6_from_decisions_to_business_S, SCENE_FRAMES as L_analyst_m6_from_decisions_to_business_F, TOTAL_FRAMES as L_analyst_m6_from_decisions_to_business_T } from "./lessons-generated/analyst-m6-from-decisions-to-business.gen";
import { SCENES as L_builder_m8_tables_columns_S, SCENE_FRAMES as L_builder_m8_tables_columns_F, TOTAL_FRAMES as L_builder_m8_tables_columns_T } from "./lessons-generated/builder-m7-l19-tables-columns.gen";
import { SCENES as L_intro_what_is_ai_S, SCENE_FRAMES as L_intro_what_is_ai_F, TOTAL_FRAMES as L_intro_what_is_ai_T } from "./lessons-generated/intro-m1-l1-what-is-ai.gen";
import { SCENES as L_intro_m1_l4_ai_can_cannot_S, SCENE_FRAMES as L_intro_m1_l4_ai_can_cannot_F, TOTAL_FRAMES as L_intro_m1_l4_ai_can_cannot_T } from "./lessons-generated/intro-m1-l4-ai-can-cannot.gen";
import { SCENES as L_intro_m1_l2_first_prompt_S, SCENE_FRAMES as L_intro_m1_l2_first_prompt_F, TOTAL_FRAMES as L_intro_m1_l2_first_prompt_T } from "./lessons-generated/intro-m1-l2-first-prompt.gen";
import { SCENES as L_intro_m1_l3_setup_your_ai_S, SCENE_FRAMES as L_intro_m1_l3_setup_your_ai_F, TOTAL_FRAMES as L_intro_m1_l3_setup_your_ai_T } from "./lessons-generated/intro-m1-l3-setup-your-ai.gen";
import { SCENES as L_intro_m1_l5_ai_vs_software_S, SCENE_FRAMES as L_intro_m1_l5_ai_vs_software_F, TOTAL_FRAMES as L_intro_m1_l5_ai_vs_software_T } from "./lessons-generated/intro-m1-l5-ai-vs-software.gen";
import { SCENES as L_intro_m1_l6_learn_without_fear_S, SCENE_FRAMES as L_intro_m1_l6_learn_without_fear_F, TOTAL_FRAMES as L_intro_m1_l6_learn_without_fear_T } from "./lessons-generated/intro-m1-l6-learn-without-fear.gen";
import { SCENES as L_intro_m1_l7_choose_your_path_S, SCENE_FRAMES as L_intro_m1_l7_choose_your_path_F, TOTAL_FRAMES as L_intro_m1_l7_choose_your_path_T } from "./lessons-generated/intro-m1-l7-choose-your-path.gen";
import { SCENES as L_builder_m4_l8_parameters_S, SCENE_FRAMES as L_builder_m4_l8_parameters_F, TOTAL_FRAMES as L_builder_m4_l8_parameters_T } from "./lessons-generated/builder-m4-l8-parameters.gen";
/* @lesson-imports-end */

export const LESSONS: LessonModule[] = [
  /* @lesson-entries-start */
    { id: "builder-m2-l3-prompt-layer", scenes: L_builder_m2_prompt_layer_S, sceneFrames: L_builder_m2_prompt_layer_F, totalFrames: L_builder_m2_prompt_layer_T },
    { id: "builder-m2-l4-instructions-examples", scenes: L_builder_m2_instructions_examples_S, sceneFrames: L_builder_m2_instructions_examples_F, totalFrames: L_builder_m2_instructions_examples_T },
    { id: "builder-m2-l5-style-control", scenes: L_builder_m2_style_control_S, sceneFrames: L_builder_m2_style_control_F, totalFrames: L_builder_m2_style_control_T },
    { id: "builder-m3-l6-context-layer", scenes: L_builder_m3_context_layer_S, sceneFrames: L_builder_m3_context_layer_F, totalFrames: L_builder_m3_context_layer_T },
    { id: "builder-m3-l7-memory-limits", scenes: L_builder_m3_memory_limits_S, sceneFrames: L_builder_m3_memory_limits_F, totalFrames: L_builder_m3_memory_limits_T },
    { id: "builder-m5-l12-database-intro", scenes: L_builder_m5_database_intro_S, sceneFrames: L_builder_m5_database_intro_F, totalFrames: L_builder_m5_database_intro_T },
    { id: "builder-m5-l9-transition", scenes: L_builder_m5_transition_S, sceneFrames: L_builder_m5_transition_F, totalFrames: L_builder_m5_transition_T },
    { id: "builder-m6-l13-idea-to-page", scenes: L_builder_m6_idea_to_page_S, sceneFrames: L_builder_m6_idea_to_page_F, totalFrames: L_builder_m6_idea_to_page_T },
    { id: "builder-m6-l14-wireframe", scenes: L_builder_m6_wireframe_S, sceneFrames: L_builder_m6_wireframe_F, totalFrames: L_builder_m6_wireframe_T },
    { id: "builder-m6-l15-first-prompt-to-lovable", scenes: L_builder_m6_first_prompt_to_lovable_S, sceneFrames: L_builder_m6_first_prompt_to_lovable_F, totalFrames: L_builder_m6_first_prompt_to_lovable_T },
    { id: "builder-m6-l16-components-routes", scenes: L_builder_m6_components_routes_S, sceneFrames: L_builder_m6_components_routes_F, totalFrames: L_builder_m6_components_routes_T },
    { id: "builder-m6-l17-iteration", scenes: L_builder_m6_iteration_S, sceneFrames: L_builder_m6_iteration_F, totalFrames: L_builder_m6_iteration_T },
    { id: "builder-m8-l22-sessions-jwt", scenes: L_builder_m7_sessions_jwt_S, sceneFrames: L_builder_m7_sessions_jwt_F, totalFrames: L_builder_m7_sessions_jwt_T },
    { id: "builder-m7-l20-relations", scenes: L_builder_m8_relations_S, sceneFrames: L_builder_m8_relations_F, totalFrames: L_builder_m8_relations_T },
    { id: "builder-m7-l21-queries", scenes: L_builder_m8_queries_S, sceneFrames: L_builder_m8_queries_F, totalFrames: L_builder_m8_queries_T },
    { id: "builder-m9-l26-agents", scenes: L_builder_m9_agents_S, sceneFrames: L_builder_m9_agents_F, totalFrames: L_builder_m9_agents_T },
    { id: "builder-m9-l25-embeddings", scenes: L_builder_m9_embeddings_S, sceneFrames: L_builder_m9_embeddings_F, totalFrames: L_builder_m9_embeddings_T },
    { id: "builder-m9-l24-rag", scenes: L_builder_m9_rag_S, sceneFrames: L_builder_m9_rag_F, totalFrames: L_builder_m9_rag_T },
    { id: "builder-m10-deploy-domain", scenes: L_builder_m10_deploy_domain_S, sceneFrames: L_builder_m10_deploy_domain_F, totalFrames: L_builder_m10_deploy_domain_T },
    { id: "builder-m10-first-users", scenes: L_builder_m10_first_users_S, sceneFrames: L_builder_m10_first_users_F, totalFrames: L_builder_m10_first_users_T },
    { id: "creator-m1-attention-economy", scenes: L_creator_m1_attention_economy_S, sceneFrames: L_creator_m1_attention_economy_F, totalFrames: L_creator_m1_attention_economy_T },
    { id: "creator-m1-why-content", scenes: L_creator_m1_why_content_S, sceneFrames: L_creator_m1_why_content_F, totalFrames: L_creator_m1_why_content_T },
    { id: "creator-m2-cta", scenes: L_creator_m2_cta_S, sceneFrames: L_creator_m2_cta_F, totalFrames: L_creator_m2_cta_T },
    { id: "creator-m2-hook", scenes: L_creator_m2_hook_S, sceneFrames: L_creator_m2_hook_F, totalFrames: L_creator_m2_hook_T },
    { id: "creator-m2-script-structure", scenes: L_creator_m2_script_structure_S, sceneFrames: L_creator_m2_script_structure_F, totalFrames: L_creator_m2_script_structure_T },
    { id: "creator-m3-content-pillars", scenes: L_creator_m3_content_pillars_S, sceneFrames: L_creator_m3_content_pillars_F, totalFrames: L_creator_m3_content_pillars_T },
    { id: "creator-m3-know-audience", scenes: L_creator_m3_know_audience_S, sceneFrames: L_creator_m3_know_audience_F, totalFrames: L_creator_m3_know_audience_T },
    { id: "creator-m4-ai-writing", scenes: L_creator_m4_ai_writing_S, sceneFrames: L_creator_m4_ai_writing_F, totalFrames: L_creator_m4_ai_writing_T },
    { id: "creator-m4-editing", scenes: L_creator_m4_editing_S, sceneFrames: L_creator_m4_editing_F, totalFrames: L_creator_m4_editing_T },
    { id: "creator-m4-mobile-shooting", scenes: L_creator_m4_mobile_shooting_S, sceneFrames: L_creator_m4_mobile_shooting_F, totalFrames: L_creator_m4_mobile_shooting_T },
    { id: "creator-m4-reality-check", scenes: L_creator_m4_reality_check_S, sceneFrames: L_creator_m4_reality_check_F, totalFrames: L_creator_m4_reality_check_T },
    { id: "creator-m4-thumbnails-captions", scenes: L_creator_m4_thumbnails_captions_S, sceneFrames: L_creator_m4_thumbnails_captions_F, totalFrames: L_creator_m4_thumbnails_captions_T },
    { id: "creator-m5-leads", scenes: L_creator_m5_leads_S, sceneFrames: L_creator_m5_leads_F, totalFrames: L_creator_m5_leads_T },
    { id: "creator-m5-platforms", scenes: L_creator_m5_platforms_S, sceneFrames: L_creator_m5_platforms_F, totalFrames: L_creator_m5_platforms_T },
    { id: "creator-m5-scheduling", scenes: L_creator_m5_scheduling_S, sceneFrames: L_creator_m5_scheduling_F, totalFrames: L_creator_m5_scheduling_T },
    { id: "creator-m6-grid-consistency", scenes: L_creator_m6_grid_consistency_S, sceneFrames: L_creator_m6_grid_consistency_F, totalFrames: L_creator_m6_grid_consistency_T },
    { id: "creator-m6-brand-basics", scenes: L_creator_m6_brand_basics_S, sceneFrames: L_creator_m6_brand_basics_F, totalFrames: L_creator_m6_brand_basics_T },
    { id: "automator-m1-decide-what-to-automate", scenes: L_automator_m1_decide_what_to_automate_S, sceneFrames: L_automator_m1_decide_what_to_automate_F, totalFrames: L_automator_m1_decide_what_to_automate_T },
    { id: "automator-m4-agents", scenes: L_automator_m4_agents_S, sceneFrames: L_automator_m4_agents_F, totalFrames: L_automator_m4_agents_T },
    { id: "automator-m4-llm-in-flow", scenes: L_automator_m4_llm_in_flow_S, sceneFrames: L_automator_m4_llm_in_flow_F, totalFrames: L_automator_m4_llm_in_flow_T },
    { id: "automator-m1-systems-view", scenes: L_automator_m1_systems_view_S, sceneFrames: L_automator_m1_systems_view_F, totalFrames: L_automator_m1_systems_view_T },
    { id: "automator-m4-rag-in-n8n", scenes: L_automator_m4_rag_in_n8n_S, sceneFrames: L_automator_m4_rag_in_n8n_F, totalFrames: L_automator_m4_rag_in_n8n_T },
    { id: "automator-m2-filters-routers", scenes: L_automator_m2_filters_routers_S, sceneFrames: L_automator_m2_filters_routers_F, totalFrames: L_automator_m2_filters_routers_T },
    { id: "automator-m5-follow-up", scenes: L_automator_m5_follow_up_S, sceneFrames: L_automator_m5_follow_up_F, totalFrames: L_automator_m5_follow_up_T },
    { id: "automator-m5-whatsapp-flow", scenes: L_automator_m5_whatsapp_flow_S, sceneFrames: L_automator_m5_whatsapp_flow_F, totalFrames: L_automator_m5_whatsapp_flow_T },
    { id: "automator-m3-connect-database", scenes: L_automator_m3_connect_database_S, sceneFrames: L_automator_m3_connect_database_F, totalFrames: L_automator_m3_connect_database_T },
    { id: "automator-m6-closing-loop", scenes: L_automator_m6_closing_loop_S, sceneFrames: L_automator_m6_closing_loop_F, totalFrames: L_automator_m6_closing_loop_T },
    { id: "automator-m3-error-handling", scenes: L_automator_m3_error_handling_S, sceneFrames: L_automator_m3_error_handling_F, totalFrames: L_automator_m3_error_handling_T },
    { id: "automator-m3-webhooks-api", scenes: L_automator_m3_webhooks_api_S, sceneFrames: L_automator_m3_webhooks_api_F, totalFrames: L_automator_m3_webhooks_api_T },
    { id: "automator-m1-spot-patterns", scenes: L_automator_m1_spot_patterns_S, sceneFrames: L_automator_m1_spot_patterns_F, totalFrames: L_automator_m1_spot_patterns_T },
    { id: "business-m3-strategic-operational-admin", scenes: L_business_m3_strategic_operational_admin_S, sceneFrames: L_business_m3_strategic_operational_admin_F, totalFrames: L_business_m3_strategic_operational_admin_T },
    { id: "analyst-m3-pattern-vs-outlier", scenes: L_analyst_m3_pattern_vs_outlier_S, sceneFrames: L_analyst_m3_pattern_vs_outlier_F, totalFrames: L_analyst_m3_pattern_vs_outlier_T },
    { id: "business-m0-from-decisions-to-leadership", scenes: L_business_m0_from_decisions_to_leadership_S, sceneFrames: L_business_m0_from_decisions_to_leadership_F, totalFrames: L_business_m0_from_decisions_to_leadership_T },
    { id: "business-m4-readiness-signals", scenes: L_business_m4_readiness_signals_S, sceneFrames: L_business_m4_readiness_signals_F, totalFrames: L_business_m4_readiness_signals_T },
    { id: "analyst-m1-feeling-to-question", scenes: L_analyst_m1_feeling_to_question_S, sceneFrames: L_analyst_m1_feeling_to_question_F, totalFrames: L_analyst_m1_feeling_to_question_T },
    { id: "business-m1-reactive-vs-proactive", scenes: L_business_m1_reactive_vs_proactive_S, sceneFrames: L_business_m1_reactive_vs_proactive_F, totalFrames: L_business_m1_reactive_vs_proactive_T },
    { id: "analyst-m4-four-numbers-dashboard", scenes: L_analyst_m4_four_numbers_dashboard_S, sceneFrames: L_analyst_m4_four_numbers_dashboard_F, totalFrames: L_analyst_m4_four_numbers_dashboard_T },
    { id: "business-m4-system-then-people", scenes: L_business_m4_system_then_people_S, sceneFrames: L_business_m4_system_then_people_F, totalFrames: L_business_m4_system_then_people_T },
    { id: "business-m5-premature-scaling", scenes: L_business_m5_premature_scaling_S, sceneFrames: L_business_m5_premature_scaling_F, totalFrames: L_business_m5_premature_scaling_T },
    { id: "analyst-m5-interpretation-mistakes", scenes: L_analyst_m5_interpretation_mistakes_S, sceneFrames: L_analyst_m5_interpretation_mistakes_F, totalFrames: L_analyst_m5_interpretation_mistakes_T },
    { id: "analyst-m2-ai-summarization", scenes: L_analyst_m2_ai_summarization_S, sceneFrames: L_analyst_m2_ai_summarization_F, totalFrames: L_analyst_m2_ai_summarization_T },
    { id: "business-m2-retention-flow", scenes: L_business_m2_retention_flow_S, sceneFrames: L_business_m2_retention_flow_F, totalFrames: L_business_m2_retention_flow_T },
    { id: "analyst-m5-question-mistakes", scenes: L_analyst_m5_question_mistakes_S, sceneFrames: L_analyst_m5_question_mistakes_F, totalFrames: L_analyst_m5_question_mistakes_T },
    { id: "business-m6-full-ecosystem", scenes: L_business_m6_full_ecosystem_S, sceneFrames: L_business_m6_full_ecosystem_F, totalFrames: L_business_m6_full_ecosystem_T },
    { id: "business-m3-delegate-or-automate", scenes: L_business_m3_delegate_or_automate_S, sceneFrames: L_business_m3_delegate_or_automate_F, totalFrames: L_business_m3_delegate_or_automate_T },
    { id: "analyst-m3-decision-rule", scenes: L_analyst_m3_decision_rule_S, sceneFrames: L_analyst_m3_decision_rule_F, totalFrames: L_analyst_m3_decision_rule_T },
    { id: "automator-m3-foundations", scenes: L_automator_m3_foundations_S, sceneFrames: L_automator_m3_foundations_F, totalFrames: L_automator_m3_foundations_T },
    { id: "automator-m4-llm-node-bridge", scenes: L_automator_m4_llm_node_bridge_S, sceneFrames: L_automator_m4_llm_node_bridge_F, totalFrames: L_automator_m4_llm_node_bridge_T },
    { id: "builder-m1-l2-tokens-training", scenes: L_builder_m1_tokens_training_S, sceneFrames: L_builder_m1_tokens_training_F, totalFrames: L_builder_m1_tokens_training_T },
    { id: "builder-m5-l11-backend-api", scenes: L_builder_m5_backend_api_S, sceneFrames: L_builder_m5_backend_api_F, totalFrames: L_builder_m5_backend_api_T },
    { id: "builder-m5-l10-frontend", scenes: L_builder_m5_frontend_S, sceneFrames: L_builder_m5_frontend_F, totalFrames: L_builder_m5_frontend_T },
    { id: "business-m1-weekly-rhythm", scenes: L_business_m1_weekly_rhythm_S, sceneFrames: L_business_m1_weekly_rhythm_F, totalFrames: L_business_m1_weekly_rhythm_T },
    { id: "builder-m1-l1-what-is-llm", scenes: L_builder_m1_what_is_llm_S, sceneFrames: L_builder_m1_what_is_llm_F, totalFrames: L_builder_m1_what_is_llm_T },
    { id: "automator-m2-tools-landscape", scenes: L_automator_m2_tools_landscape_S, sceneFrames: L_automator_m2_tools_landscape_F, totalFrames: L_automator_m2_tools_landscape_T },
    { id: "analyst-m2-three-sources", scenes: L_analyst_m2_three_sources_S, sceneFrames: L_analyst_m2_three_sources_F, totalFrames: L_analyst_m2_three_sources_T },
    { id: "analyst-m0-from-automation-to-insight", scenes: L_analyst_m0_from_automation_to_insight_S, sceneFrames: L_analyst_m0_from_automation_to_insight_F, totalFrames: L_analyst_m0_from_automation_to_insight_T },
    { id: "analyst-m4-weekly-review-ritual", scenes: L_analyst_m4_weekly_review_ritual_S, sceneFrames: L_analyst_m4_weekly_review_ritual_F, totalFrames: L_analyst_m4_weekly_review_ritual_T },
    { id: "builder-m6-l18-debugging", scenes: L_builder_m6_debugging_S, sceneFrames: L_builder_m6_debugging_F, totalFrames: L_builder_m6_debugging_T },
    { id: "automator-m5-lead-capture", scenes: L_automator_m5_lead_capture_S, sceneFrames: L_automator_m5_lead_capture_F, totalFrames: L_automator_m5_lead_capture_T },
    { id: "business-m5-reactive-relapse", scenes: L_business_m5_reactive_relapse_S, sceneFrames: L_business_m5_reactive_relapse_F, totalFrames: L_business_m5_reactive_relapse_T },
    { id: "business-m2-customer-lifecycle", scenes: L_business_m2_customer_lifecycle_S, sceneFrames: L_business_m2_customer_lifecycle_F, totalFrames: L_business_m2_customer_lifecycle_T },
    { id: "analyst-m1-right-question-rule", scenes: L_analyst_m1_right_question_rule_S, sceneFrames: L_analyst_m1_right_question_rule_F, totalFrames: L_analyst_m1_right_question_rule_T },
    { id: "builder-m8-l23-rls", scenes: L_builder_m7_rls_S, sceneFrames: L_builder_m7_rls_F, totalFrames: L_builder_m7_rls_T },
    { id: "automator-m2-triggers-actions", scenes: L_automator_m2_triggers_actions_S, sceneFrames: L_automator_m2_triggers_actions_F, totalFrames: L_automator_m2_triggers_actions_T },
    { id: "automator-m0-where-you-are", scenes: L_automator_m0_where_you_are_S, sceneFrames: L_automator_m0_where_you_are_F, totalFrames: L_automator_m0_where_you_are_T },
    { id: "creator-m5-analytics", scenes: L_creator_m5_analytics_S, sceneFrames: L_creator_m5_analytics_F, totalFrames: L_creator_m5_analytics_T },
    { id: "analyst-m6-from-decisions-to-business", scenes: L_analyst_m6_from_decisions_to_business_S, sceneFrames: L_analyst_m6_from_decisions_to_business_F, totalFrames: L_analyst_m6_from_decisions_to_business_T },
    { id: "builder-m7-l19-tables-columns", scenes: L_builder_m8_tables_columns_S, sceneFrames: L_builder_m8_tables_columns_F, totalFrames: L_builder_m8_tables_columns_T },
    { id: "intro-m1-l1-what-is-ai", scenes: L_intro_what_is_ai_S, sceneFrames: L_intro_what_is_ai_F, totalFrames: L_intro_what_is_ai_T },
    { id: "intro-m1-l4-ai-can-cannot", scenes: L_intro_m1_l4_ai_can_cannot_S, sceneFrames: L_intro_m1_l4_ai_can_cannot_F, totalFrames: L_intro_m1_l4_ai_can_cannot_T },
    { id: "intro-m1-l2-first-prompt", scenes: L_intro_m1_l2_first_prompt_S, sceneFrames: L_intro_m1_l2_first_prompt_F, totalFrames: L_intro_m1_l2_first_prompt_T },
    { id: "intro-m1-l3-setup-your-ai", scenes: L_intro_m1_l3_setup_your_ai_S, sceneFrames: L_intro_m1_l3_setup_your_ai_F, totalFrames: L_intro_m1_l3_setup_your_ai_T },
    { id: "intro-m1-l5-ai-vs-software", scenes: L_intro_m1_l5_ai_vs_software_S, sceneFrames: L_intro_m1_l5_ai_vs_software_F, totalFrames: L_intro_m1_l5_ai_vs_software_T },
    { id: "intro-m1-l6-learn-without-fear", scenes: L_intro_m1_l6_learn_without_fear_S, sceneFrames: L_intro_m1_l6_learn_without_fear_F, totalFrames: L_intro_m1_l6_learn_without_fear_T },
    { id: "intro-m1-l7-choose-your-path", scenes: L_intro_m1_l7_choose_your_path_S, sceneFrames: L_intro_m1_l7_choose_your_path_F, totalFrames: L_intro_m1_l7_choose_your_path_T },
    { id: "builder-m4-l8-parameters", scenes: L_builder_m4_l8_parameters_S, sceneFrames: L_builder_m4_l8_parameters_F, totalFrames: L_builder_m4_l8_parameters_T },
  /* @lesson-entries-end */
];