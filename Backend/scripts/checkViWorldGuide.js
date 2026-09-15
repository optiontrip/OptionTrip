import { validateViWorldGuideContract } from '../src/config/viWorldGuideAcceptance.js';

const result = validateViWorldGuideContract();
if (!result.valid) {
  console.error('Vi world-guide contract failed:');
  for (const error of result.errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Vi world-guide contract OK');
