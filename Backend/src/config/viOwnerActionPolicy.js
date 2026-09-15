export const VI_OWNER_ACTION_POLICY = Object.freeze({
  automateWhenPossible: true,
  ownerOnly: [
    'external_login_or_2fa',
    'provider_approval',
    'credential_issuance_or_secret_entry',
    'financial_acceptance',
    'legal_acceptance_or_decision',
    'account_ownership_verification',
  ],
});

export default VI_OWNER_ACTION_POLICY;
