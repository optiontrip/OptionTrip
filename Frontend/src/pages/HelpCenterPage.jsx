import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../hooks/usePageMeta';
import { CONTACT_EMAIL, CONTACT_MAILTO } from '../config/contact';

const faqs = [
  { category: 'Getting Started', icon: 'fas fa-rocket', questions: [
    { q: 'What is OptionTrip?', a: 'OptionTrip is a travel technology platform being built around Travel Partner Vi. It brings trip discovery, planning, comparison, destination context, and travel tools into one connected experience.' },
    { q: 'What is Travel Partner Vi?', a: 'Vi is the central travel assistant inside OptionTrip. You can use Vi to discuss a destination, trip idea, dates, budget, interests, and other preferences and continue planning from that context.' },
    { q: 'Can I change language, currency, and country?', a: 'Yes. Use the language, currency, and country selectors available on OptionTrip. We are continuing to improve consistency across translated pages.' },
  ]},
  { category: 'Planning & Booking', icon: 'fas fa-map-marked-alt', questions: [
    { q: 'How do I start planning?', a: 'Open Travel Partner Vi or the planning tools and tell us where you want to go, or describe the type of trip you want. Add dates, budget, travelers, and preferences when you know them.' },
    { q: 'Does OptionTrip sell every travel service directly?', a: 'Not yet. OptionTrip combines its own planning experience with travel inventory and legitimate partner integrations. Some booking actions may continue on a partner or provider website.' },
    { q: 'Should I verify important travel requirements?', a: 'Yes. Entry rules, visas, operating hours, schedules, prices, safety information, and availability can change. OptionTrip is building more live and official-source checks, but travelers should verify critical requirements before relying on them.' },
  ]},
  { category: 'Account & Data', icon: 'fas fa-user-cog', questions: [
    { q: 'Where can I get account help?', a: `Use the Contact page or email ${CONTACT_EMAIL}. Include the email associated with your OptionTrip account and a short description of the problem.` },
    { q: 'How do I request access, correction, or deletion of my data?', a: `Email ${CONTACT_EMAIL} with your request. You can also review the Privacy Policy and Data Protection pages for current information about data requests.` },
  ]},
  { category: 'Support & Feedback', icon: 'fas fa-life-ring', questions: [
    { q: 'How do I contact the OptionTrip team?', a: `Email ${CONTACT_EMAIL} or use the Contact Us form. Travel questions, product feedback, partnership enquiries, and bug reports are welcome.` },
    { q: 'I found a broken page or incorrect information. What should I do?', a: `Please send the page address and a short description to ${CONTACT_EMAIL}. Screenshots are especially useful for visual or translation problems.` },
  ]},
];

const HelpCenterPage = () => {
  const [openCat, setOpenCat] = useState(0);
  const [openQ, setOpenQ] = useState(null);
  return <>
    <PageMeta title="OptionTrip Help Center" description="Get help with OptionTrip, Travel Partner Vi, trip planning, accounts, data requests, and feedback." keywords="OptionTrip help, support, Travel Partner Vi, travel help" path="/help-center" />
    <div className="banner pt-8 pb-7 overflow-hidden" style={{ backgroundImage: `url(/images/bg/bg1.jpg)` }}><div className="container"><div className="banner-content text-center"><h4 style={{color:'#fdc703'}}>OptionTrip Support</h4><h1 style={{color:'#fff'}}>Help Center</h1><p style={{color:'rgba(255,255,255,.92)'}}>Find practical answers or contact our team when something needs personal attention.</p></div></div></div>
    <section style={{padding:'55px 0',background:'#fff'}}><div className="container"><div className="row g-4">
      <div className="col-lg-4"><div className="p-4 rounded h-100" style={{background:'#e8f0fe'}}><h4>Email Support</h4><p>Questions, account help, partnerships, feedback, or bug reports.</p><a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a></div></div>
      <div className="col-lg-4"><div className="p-4 rounded h-100" style={{background:'#e8f8f6'}}><h4>Travel Partner Vi</h4><p>Use Vi for travel planning and trip questions inside OptionTrip.</p><Link to="/travel-buddy">Open Vi</Link></div></div>
      <div className="col-lg-4"><div className="p-4 rounded h-100" style={{background:'#fff7e6'}}><h4>Contact Form</h4><p>Send a structured message directly to the OptionTrip team.</p><Link to="/contact">Contact Us</Link></div></div>
    </div></div></section>
    <section style={{padding:'50px 0 80px',background:'#f8f9fa'}}><div className="container"><div className="text-center mb-5"><h4 style={{color:'#029e9d'}}>FAQ</h4><h2>Frequently Asked Questions</h2></div><div className="row g-4"><div className="col-lg-3">{faqs.map((cat,i)=><button key={cat.category} onClick={()=>{setOpenCat(i);setOpenQ(null);}} style={{display:'block',width:'100%',padding:'12px 14px',marginBottom:8,border:0,borderRadius:10,textAlign:'left',background:openCat===i?'#029e9d':'#fff',color:openCat===i?'#fff':'#333'}}><i className={`${cat.icon} me-2`}></i>{cat.category}</button>)}</div><div className="col-lg-9"><h4 className="mb-3">{faqs[openCat].category}</h4>{faqs[openCat].questions.map((item,i)=><div key={item.q} style={{background:'#fff',borderRadius:12,marginBottom:10,overflow:'hidden'}}><button onClick={()=>setOpenQ(openQ===i?null:i)} style={{width:'100%',padding:'17px 20px',border:0,background:'transparent',textAlign:'left',fontWeight:600}}>{item.q}</button>{openQ===i&&<p style={{padding:'0 20px 18px',margin:0,color:'#666'}}>{item.a}</p>}</div>)}</div></div></div></section>
    <section style={{padding:'60px 0',background:'linear-gradient(135deg,#0A539D,#029e9d)',textAlign:'center'}}><div className="container"><h2 style={{color:'#fff'}}>Still Need Help?</h2><p style={{color:'rgba(255,255,255,.9)'}}>Contact the OptionTrip team and tell us what you need.</p><a href={CONTACT_MAILTO} className="btn-white">Email {CONTACT_EMAIL}</a></div></section>
  </>;
};
export default HelpCenterPage;
