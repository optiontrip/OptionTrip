import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import './TravelServicesPage.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;
const COPY = {
  en:{eyebrow:'OPTIONTRIP TRAVEL SERVICES',title:'What do you need for your trip?',intro:'Choose what you want to book or arrange. Start with a service below - OptionTrip will take you to search or help you choose the right option.',plan:'Plan my trip with Vi',trips:'My trips',trustTitle:'Clear booking, no guessing.',trust:'Direct booking opens search. Services that need a few details open a guided selection with Vi.'},
  ru:{eyebrow:'Сервисы OptionTrip',title:'Что вам нужно для поездки?',intro:'Выберите нужную услугу. Где доступен прямой поиск, сразу откроется бронирование. Если нужны уточнения, Vi поможет подобрать вариант шаг за шагом.',plan:'Спланировать поездку с Vi',trips:'Мои поездки',trustTitle:'Понятный путь к бронированию.',trust:'Прямые сервисы сразу открывают поиск. Для остальных Vi сначала уточнит необходимые данные и поможет выбрать.'},
  uk:{eyebrow:'Сервіси OptionTrip',title:'Що вам потрібно для подорожі?',intro:'Оберіть потрібну послугу. Де доступний прямий пошук, одразу відкриється бронювання. Якщо потрібні уточнення, Vi допоможе крок за кроком.',plan:'Спланувати подорож з Vi',trips:'Мої подорожі',trustTitle:'Зрозумілий шлях до бронювання.',trust:'Прямі сервіси одразу відкривають пошук. Для інших Vi спочатку уточнить необхідні дані.'}
};
export default function TravelServicesPage(){
 const {i18n}=useTranslation(); const location=useLocation(); const language=(i18n.language||'en').split('-')[0]; const labels=getTravelServiceLabels(language); const copy=COPY[language]||COPY.en;
 useEffect(()=>{if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),0)}},[location.hash]);
 return <main className="travel-services-page">
  <section className="travel-services-hero"><div className="container"><span className="travel-services-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p><div className="travel-services-actions"><Link className="nir-btn" to="/travel-buddy?intent=plan-trip">{copy.plan}</Link><Link className="travel-services-secondary" to="/my-trips">{copy.trips}</Link></div></div></section>
  <div className="container travel-services-groups">{TRAVEL_SERVICE_GROUPS.map(group=><section className="travel-services-group" id={group.id} key={group.id} aria-labelledby={`services-${group.id}`}><h2 id={`services-${group.id}`}>{labels[group.id]||group.label}</h2><div className="travel-services-grid">{group.services.map(service=>{const direct=Boolean(service.live&&service.route);const route=direct?service.route:viRoute(service);const serviceLabel=labels[service.id]||service.label;return <Link className="travel-service-card" to={route} key={service.id}><span className="travel-service-icon" aria-hidden="true"><i className={`fa ${service.icon}`}/></span><span className="travel-service-copy"><strong>{serviceLabel}</strong></span><span className="travel-service-status">{direct?labels.open:labels.choose} <i className="fa fa-arrow-right" aria-hidden="true"/></span></Link>})}</div></section>)}</div>
  <section className="container travel-services-trust"><strong>{copy.trustTitle}</strong><span>{copy.trust}</span></section>
 </main>;
}
