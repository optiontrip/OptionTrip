import { VI_WORLD_GUIDE_ARCHITECTURE } from './viWorldGuideArchitecture.js';
import { VI_WORLD_GUIDE_QUALITY_BAR } from './viWorldGuideQualityBar.js';
import { VI_WORLD_GUIDE_ROADMAP } from './viWorldGuideRoadmap.js';
import { VI_WORLD_GUIDE_TELEMETRY_EVENTS } from './viWorldGuideTelemetry.js';
import { VI_WORLD_GUIDE_PRIVACY } from './viWorldGuidePrivacy.js';
import { VI_WORLD_GUIDE_DECISION_ORDER } from './viWorldGuideDecisionOrder.js';

export const VI_WORLD_GUIDE_FINAL_CONTRACT = Object.freeze({
  architecture: VI_WORLD_GUIDE_ARCHITECTURE,
  qualityBar: VI_WORLD_GUIDE_QUALITY_BAR,
  decisionOrder: VI_WORLD_GUIDE_DECISION_ORDER,
  privacy: VI_WORLD_GUIDE_PRIVACY,
  telemetry: VI_WORLD_GUIDE_TELEMETRY_EVENTS,
  roadmap: VI_WORLD_GUIDE_ROADMAP,
});

export default VI_WORLD_GUIDE_FINAL_CONTRACT;
