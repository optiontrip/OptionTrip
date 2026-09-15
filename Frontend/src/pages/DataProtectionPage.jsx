import React from 'react';
import PageMeta from '../hooks/usePageMeta';
import { CONTACT_EMAIL } from '../config/contact';

const principles = [
  { icon: 'fas fa-balance-scale', title: 'Lawfulness & Fairness', desc: 'We only process your data where we have a lawful basis to do so, and we are transparent about how your data is used.' },
  { icon: 'fas fa-bullseye', title: 'Purpose Limitation', desc: 'Your data is collected for specific, explicit, and legitimate purposes and not processed in ways incompatible with those purposes.' },
  { icon: 'fas fa-compress-arrows-alt', title: 'Data Minimization', desc: 'We only collect the personal data that is necessary for the specific purpose it is being collected for — nothing more.' },
  { icon: 'fas fa-check-double', title: 'Accuracy', desc: 'We take reasonable steps to ensure that personal data is accurate and kept up to date. You can update your information at any time.' },
  { icon: 'fas fa-hourglass-half', title: 'Storage Limitation', desc: 'We keep personal data only for as long as necessary. Data is deleted or anonymized when no longer needed.' },
  { icon: 'fas fa-shield-alt', title: 'Security', desc: 'We implement appropriate technical and organizational measures to protect personal data against unauthorized access, loss, or destruction.' },
];

const rights = [
  { icon: 'fas fa-eye', title: 'Right of Access', desc: 'Request a copy of the personal data we hold about you, including how it is being processed.' },
  { icon: 'fas fa-pen', title: 'Right to Rectification', desc: 'Request correction of inaccurate or incomplete personal data we hold about you.' },
  { icon: 'fas fa-trash-alt', title: 'Right to Erasure', desc: 'Request deletion of your personal data ("right to be forgotten") where there is no compelling reason for continued processing.' },
  { icon: 'fas fa-pause-circle', title: 'Right to Restriction', desc: 'Request restriction of processing of your personal data in certain circumstances.' },
  { icon: 'fas fa-file-export', title: 'Right to Data Portability', desc: 'Receive your personal data in a structured, commonly used, machine-readable format and transfer it to another controller.' },
  { icon: 'fas fa-hand-paper', title: 'Right to Object', desc: 'Object to processing of your personal data for direct marketing or where processing is based on legitimate interests.' },
];

const DataProtectionPage = () => {
  return (
    <>
      <PageMeta
        title="Data Protection"
        description="OptionTrip's approach to data protection — the principles we follow to keep your information safe and used responsibly."
        keywords="data protection, GDPR, data rights, optiontrip"
        path="/data-protection"
      />

      <div className="banner pt-10 pb-0 overflow-hidden" style={{ backgroundImage: `url(/images/testimonial.png)` }}>
        <div className="container"><div className="banner-in"><div className="row align-items-center"><div className="col-lg-12 mb-4"><div className="banner-content text-center">
          <h4 className="theme mb-0">Legal</h4><h1>Data Protection</h1>
          <p className="mb-4">Your data belongs to you. Discover how we protect it, who can access it, and the rights you have over it.</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Last updated: March 1, 2026</p>
        </div></div></div></div></div>
      </div>

      <section style={{ padding: '80px 0', background: '#fff' }}><div className="container"><div className="row justify-content-center"><div className="col-lg-9">
        <div style={{ background: 'linear-gradient(135deg, rgba(10,83,157,0.05), rgba(2,158,157,0.08))', borderRadius: '16px', padding: '28px 32px', marginBottom: '56px', borderLeft: '4px solid #029e9d' }}>
          <p style={{ color: '#555', lineHeight: '1.8', margin: 0 }}>Option Trip is committed to protecting your personal data and respecting your privacy rights. This Data Protection page outlines our commitment to data protection principles, your legal rights, and how we comply with applicable data protection regulations including GDPR and similar frameworks worldwide.</p>
        </div>
        <div style={{ marginBottom: '56px' }}><div className="text-center mb-4"><h4 className="theme mb-2" style={{ color: '#029e9d' }}>Our Principles</h4><h2 style={{ color: '#17233e' }}>Data Protection by Design</h2><p style={{ color: '#777', maxWidth: '560px', margin: '0 auto' }}>We embed privacy into everything we build — from how VI processes your travel preferences to how we secure your account.</p></div>
          <div className="row g-4 mt-3">{principles.map((p, i) => <div className="col-lg-4 col-md-6" key={i}><div style={{ background: '#f8f9fa', borderRadius: '14px', padding: '24px', height: '100%', transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(2,158,157,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.boxShadow = 'none'; }}><i className={p.icon} style={{ color: '#029e9d', fontSize: '24px', marginBottom: '14px', display: 'block' }}></i><h6 style={{ color: '#17233e', marginBottom: '8px' }}>{p.title}</h6><p style={{ color: '#777', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{p.desc}</p></div></div>)}</div>
        </div>
        <div style={{ marginBottom: '56px' }}><h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '28px' }}>Your Data Rights</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{rights.map((r, i) => <div key={i} style={{ display: 'flex', gap: '16px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '20px', alignItems: 'flex-start' }}><div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(10,83,157,0.1), rgba(2,158,157,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={r.icon} style={{ color: '#029e9d', fontSize: '18px' }}></i></div><div><h6 style={{ color: '#17233e', marginBottom: '6px' }}>{r.title}</h6><p style={{ color: '#777', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{r.desc}</p></div></div>)}</div></div>
        <div style={{ marginBottom: '56px' }}><h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>Legal Bases for Processing</h3><p style={{ color: '#777', lineHeight: '1.8', marginBottom: '16px' }}>We rely on the following legal bases to process your personal data:</p>{[
          { title: 'Contractual Necessity', desc: 'Processing needed to provide our travel planning services to you (e.g., creating your account, generating itineraries).' },
          { title: 'Legitimate Interests', desc: 'Processing for our legitimate business interests such as improving the platform, preventing fraud, and ensuring security.' },
          { title: 'Consent', desc: 'Processing based on your explicit consent, such as for marketing emails or optional analytics. You can withdraw consent at any time.' },
          { title: 'Legal Obligation', desc: 'Processing necessary to comply with our legal obligations, such as tax laws and regulatory requirements.' },
        ].map((lb, i) => <div key={i} style={{ marginBottom: '16px', paddingLeft: '20px', borderLeft: '3px solid #029e9d' }}><h6 style={{ color: '#17233e', marginBottom: '6px' }}>{lb.title}</h6><p style={{ color: '#777', margin: 0, lineHeight: '1.7' }}>{lb.desc}</p></div>)}</div>
        <div style={{ marginBottom: '56px' }}><h3 style={{ color: '#17233e', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px', marginBottom: '16px' }}>International Data Transfers</h3><p style={{ color: '#777', lineHeight: '1.8', margin: 0 }}>Option Trip operates globally. Your data may be transferred to and processed in countries outside your home country. When we transfer data internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by relevant data protection authorities, to ensure your data is protected to the same standard as in your home country.</p></div>
        <div style={{ background: 'linear-gradient(135deg, #0A539D, #029e9d)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}><h3 style={{ color: '#fff', marginBottom: '12px' }}>Exercise Your Rights</h3><p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '24px', lineHeight: '1.7' }}>To exercise any of your data rights, submit a request to our Data Protection team. We will respond within 30 days.</p><a href={`mailto:${CONTACT_EMAIL}?subject=Data Protection Request`} className="btn-white">Submit a Request</a><p style={{ color: 'rgba(255,255,255,0.65)', marginTop: '16px', marginBottom: 0, fontSize: '13px' }}>{CONTACT_EMAIL} · Typically responded to within 30 days</p></div>
      </div></div></div></section>
    </>
  );
};

export default DataProtectionPage;
