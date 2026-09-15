import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const CookiePolicyPage = () => <>
  <PageMeta title="Cookie Policy" description="How OptionTrip uses cookies and similar technologies." keywords="OptionTrip cookie policy, cookies, privacy" path="/cookie-policy" />
  <div className="banner pt-8 pb-7 overflow-hidden" style={{backgroundImage:`url(/images/testimonial.png)`}}><div className="container"><div className="banner-content text-center"><h4 className="theme">Legal</h4><h1>Cookie Policy</h1><p>Information about cookies and similar technologies used by OptionTrip.</p></div></div></div>
  <section style={{padding:'70px 0'}}><div className="container"><div className="row justify-content-center"><div className="col-lg-9">
    <h2>How OptionTrip Uses Cookies</h2><p>OptionTrip may use cookies, local storage, and similar browser technologies needed to operate the site, remember settings such as language or currency, understand product usage, protect sessions, and support measurement or partner attribution where applicable.</p>
    <h3>Essential Technologies</h3><p>Some browser storage may be necessary for core site functions, authentication, security, and user preferences.</p>
    <h3>Preferences And Measurement</h3><p>Where enabled, browser technologies may help remember settings and understand how visitors use OptionTrip so the product can be improved. Third-party integrations may also use their own technologies subject to their policies and applicable consent requirements.</p>
    <h3>Your Choices</h3><p>You can clear or block cookies through your browser. Blocking required storage can prevent parts of OptionTrip from working correctly. We are continuing to improve user-facing consent and preference controls as the platform grows.</p>
    <h3>Questions</h3><p>For questions about cookies or privacy, email <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a>.</p>
  </div></div></div></section>
</>;
export default CookiePolicyPage;
