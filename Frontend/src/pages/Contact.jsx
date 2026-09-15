import React, { useState } from 'react';
import PageMeta from '../hooks/usePageMeta';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = async (e) => {
    e.preventDefault(); setStatus('loading'); setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (res.ok && data.success) { setStatus('success'); setFormData({ name: '', email: '', subject: '', message: '' }); }
      else { setStatus('error'); setErrorMsg(data.message || 'Something went wrong. Please try again.'); }
    } catch { setStatus('error'); setErrorMsg('Network error. Please check your connection and try again.'); }
  };

  return <>
    <PageMeta title="Contact OptionTrip" description="Contact the OptionTrip team for travel questions, support, feedback, partnerships, or press enquiries." keywords="contact optiontrip, optiontrip support, travel help" path="/contact" />
    <div className="banner pt-8 pb-7 overflow-hidden" style={{ backgroundImage: `url(/images/testimonial.png)` }}><div className="container"><div className="banner-content text-center"><h4 className="theme mb-2">Contact OptionTrip</h4><h1>How Can We Help?</h1><p className="mb-0">Questions about OptionTrip, Travel Partner Vi, your trip, partnerships, or feedback are welcome.</p></div></div></div>
    <section className="trending pb-6 pt-6"><div className="container"><div className="row">
      <div className="col-lg-8 mb-4"><div className="box-shadow bg-white p-4 rounded"><h3 className="mb-4">Send Us A Message</h3>
      {status === 'success' ? <div style={{padding: 36, textAlign:'center'}}><h4>Message Sent</h4><p>Thank you. The OptionTrip team received your message and will reply as soon as possible.</p><button className="nir-btn" onClick={() => setStatus('idle')}>Send Another Message</button></div> :
      <form onSubmit={handleSubmit}><div className="row">
        <div className="col-lg-6 mb-3"><input type="text" name="name" className="form-control" placeholder="Your Name" value={formData.name} onChange={handleChange} required disabled={status==='loading'} /></div>
        <div className="col-lg-6 mb-3"><input type="email" name="email" className="form-control" placeholder="Your Email" value={formData.email} onChange={handleChange} required disabled={status==='loading'} /></div>
        <div className="col-lg-12 mb-3"><input type="text" name="subject" className="form-control" placeholder="Subject" value={formData.subject} onChange={handleChange} required disabled={status==='loading'} /></div>
        <div className="col-lg-12 mb-3"><textarea name="message" className="form-control" rows="6" placeholder="How can we help?" value={formData.message} onChange={handleChange} required disabled={status==='loading'} /></div>
        {status==='error' && <div className="col-lg-12 mb-3"><div style={{color:'#b91c1c'}}>{errorMsg}</div></div>}
        <div className="col-lg-12"><button type="submit" className="nir-btn" disabled={status==='loading'}>{status==='loading' ? 'Sending...' : 'Send Message'}</button></div>
      </div></form>}
      </div></div>
      <div className="col-lg-4"><div className="box-shadow bg-white p-4 rounded"><h3 className="mb-4">Contact Information</h3><p><strong>Email</strong><br/><a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a></p><p><strong>Team</strong><br/>OptionTrip is a young travel technology team building tools to make travel planning and travel itself simpler and more useful.</p><p><strong>Support</strong><br/>Worldwide, online.</p></div></div>
    </div></div></section>
  </>;
};

export default Contact;
