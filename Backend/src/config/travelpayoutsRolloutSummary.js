import { TRAVELPAYOUTS_AVAILABLE_PROGRAMS } from './travelpayoutsAvailablePrograms.js';
import { getTravelpayoutsProgramExposure } from './travelpayoutsProgramPolicy.js';

export const getTravelpayoutsRolloutSummary = () => {
  const programs = TRAVELPAYOUTS_AVAILABLE_PROGRAMS.map(program => {
    const providerName = program === 'aviasales' ? 'travelpayouts' : program;
    return getTravelpayoutsProgramExposure(providerName);
  });

  return {
    knownPrograms: programs.length,
    configuredPrograms: programs.filter(program => program.canExposeLive).length,
    pendingConfiguration: programs.filter(program => !program.canExposeLive).length,
    programs,
  };
};
