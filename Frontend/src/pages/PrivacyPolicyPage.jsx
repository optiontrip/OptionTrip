import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import { CONTACT_EMAIL } from '../config/contact';

const sections = [
  { title: '1. Information We Collect', text: 'OptionTrip may collect information you provide when creating an account, planning a trip, saving preferences, or contacting us, together with technical information needed to operate and protect the service. Location information is used only when the relevant feature and permission allow it.' },
  { title: '2. How We Use Information', text: 'Information may be used to operate OptionTrip, personalize travel planning, maintain accounts and saved trips, respond to support requests, improve the product, measure performance, prevent abuse, and meet legal obligations.' },
  { title: '3. Travel Partner Vi And Automated Processing', text: 'Travel Partner Vi can process the travel details and preferences you provide to generate or refine travel suggestions. AI-generated travel information can be incomplete or become outdated, so important entry, safety, schedule, price, and availability information should be verified before relying on it.' },
  { title: '4. Service Providers And Travel Partners', text: 'OptionTrip may rely on infrastructure, analytics, AI, email, mapping, travel inventory, affiliate, and other technology providers to deliver features. Information is shared only as needed for the relevant service and subject to applicable requirements. OptionTrip does not claim that every booking is processed directly by OptionTrip.' },
  { title: '5. Data Retention', text: `We retain information for as long as needed to provide the service, maintain legitimate business or security records, and meet legal obligations. Account or data requests can be sent to ${CONTACT_EMAIL}.` },
  { title: '6. Your Choices And Rights', text: `Depending on where you live, privacy law may provide rights to access, correct, delete, restrict, or obtain certain personal information. Send privacy requests to ${CONTACT_EMAIL}.` },
  { title: '7. Security', text: 'We use reasonable technical and organizational safeguards appropriate to the services we operate. No internet service can guarantee absolute security.' },
  { title: '8. Cookies And Similar Technologies', text: 'OptionTrip may use cookies, local storage, and similar technologies for core functions, preferences, measurement, security, and partner attribution where applicable. See the Cookie Policy for more information.' },
  { title: '9. Changes', text: 'This policy may be updated as OptionTrip adds or changes features, providers, and legal requirements. The current version will be published on this page.' },
  { title: '10. Contact', text: `Questions and privacy requests can be sent to ${CONTACT_EMAIL}.` },
];

const PrivacyPolicyPage = () => <>
  <PageMeta title="Privacy Policy" description="How OptionTrip handles information used across travel planning, Travel Partner Vi, accounts, support, and connected services." keywords="OptionTrip privacy policy, data protection, travel privacy" path="/privacy-policy" />
  <div className="banner pt-8 pb-7 overflow-hidden" style={{backgroundImage:`url(/images/testimonial.png)`}}><div className="container"><div className="banner-content text-center"><h4 className="theme">Legal</h4><h1>Privacy Policy</h1><p>How information is handled as you use OptionTrip and Travel Partner Vi.</p></div></div></div>
  <section style={{padding:'70px 0',background:'#fff'}}><div className="container"><div className="row justify-content-center"><div className="col-lg-9"><p style={{fontSize:17,lineHeight:1.8}}>OptionTrip is a growing travel technology platform. This page describes the privacy principles that apply to the website and connected OptionTrip services. As the platform expands, this policy will be updated to reflect the services actually in use.</p>{sections.map(section=><div key={section.title} style={{marginBottom:32}}><h3>{section.title}</h3><p style={{lineHeight:1.8,color:'#666'}}>{section.text}</p></div>)}</div></div></div></section>
</>;
export default PrivacyPolicyPage;
