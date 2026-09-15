import { getTravelpayoutsProgramDashboardState } from './travelpayoutsProgramState.js';
import { getTravelpayoutsVerticalCoverage } from './travelpayoutsVerticalCoverage.js';

export const getTravelpayoutsCatalogIntegrity = () => {
  const dashboard = getTravelpayoutsProgramDashboardState();
  const coverage = getTravelpayoutsVerticalCoverage();
  return {
    dashboard,
    verticalCount: coverage.length,
    coverage,
    completeTranscription: dashboard.untranscribedAvailablePrograms === 0,
  };
};
