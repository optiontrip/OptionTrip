import { TRAVELPAYOUTS_CATALOG_VERSION } from './travelpayoutsCatalogVersion.js';

export const getTravelpayoutsProgramDashboardState = () => ({
  available: TRAVELPAYOUTS_CATALOG_VERSION.observedAvailableCount,
  unlockMore: TRAVELPAYOUTS_CATALOG_VERSION.observedUnlockMoreCount,
  transcribedAvailablePrograms: TRAVELPAYOUTS_CATALOG_VERSION.transcribedProgramCount,
  untranscribedAvailablePrograms: Math.max(0, TRAVELPAYOUTS_CATALOG_VERSION.observedAvailableCount - TRAVELPAYOUTS_CATALOG_VERSION.transcribedProgramCount),
});
