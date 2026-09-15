import { getViWorldGuideSafetyGate } from './viWorldGuideSafetyGate.js';

export const getViWorldGuideReleaseGate = ({ flightRegressionPassed = false, hotelRegressionPassed = false, jsonRegressionPassed = false } = {}) => {
  const safety = getViWorldGuideSafetyGate();
  return {
    ready: safety.canLoadModules && flightRegressionPassed && hotelRegressionPassed && jsonRegressionPassed,
    safety,
    regressions: {
      flight: flightRegressionPassed,
      hotel: hotelRegressionPassed,
      json: jsonRegressionPassed,
    },
  };
};

export default getViWorldGuideReleaseGate;
