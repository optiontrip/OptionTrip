import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageMeta from '../../hooks/usePageMeta';
import { TRAVEL_SERVICE_GROUPS } from '../../config/travelServices';
import { getTravelServiceLabels } from '../../config/travelServiceLabels';
import { fetchTravelInventoryStatus, getInventoryStateForService } from '../../services/travelInventoryService';
import './TravelServicesPage.css';

const viRoute = service => `/travel-buddy?service=${encodeURIComponent(service.id)}&intent=find-service`;
const COPY = {
  en:{eyebrow:'OPTIONTRIP TRAVEL SERVICES',title:'What do you need for your trip?',intro:'Choose what you want to book or arrange. Live services open directly. Other services go to Vi, who keeps your trip context and routes you to the best available option.',plan:'Plan my trip with Vi',trips:'My trips',trustTitle:'Clear booking, no guessing.',trust:'OptionTrip only labels a service live when a working integration is available. Everything else stays useful through Vi instead of becoming a dead end.',direct:'Open service',partner:'Available with Vi',guided:'Ask Vi'},
  ru:{eyebrow:'Сервисы OptionTrip',title:'Что вам нужно для поездки?',intro:'Выберите, что хотите забронировать или организовать. Работающие сервисы открываются сразу. По остальным Vi сохранит контекст поездки и поможет перейти к доступному варианту.',plan:'Спланировать поездку с Vi',trips:'Мои поездки',trustTitle:'Понятное бронирование без догадок.',trust:'OptionTrip помечает сервис как доступный только тогда, когда интеграция действительно работает. В остальных случаях Vi помогает подобрать решение, чтобы не было тупиков и мёртвых кнопок.',direct:'Открыть сервис',partner:'Доступно через Vi',guided:'Спросить Vi'},
  uk:{eyebrow:'Сервіси OptionTrip',title:'Що вам потрібно для подорожі?',intro:'Оберіть, що хочете забронювати або організувати. Робочі сервіси відкриваються одразу. Для решти Vi збереже контекст подорожі та допоможе перейти до доступного варіанта.',plan:'Спланувати подорож з Vi',trips:'Мої подорожі',trustTitle:'Зрозуміле бронювання без здогадок.',trust:'OptionTrip позначає сервіс доступним лише тоді, коли інтеграція справді працює. В інших випадках Vi допомагає знайти рішення, щоб не було глухих кутів і мертвих кнопок.',direct:'Відкрити сервіс',partner:'Доступно через Vi',guided:'Запитати Vi'}
};
export default function TravelServicesPage(){
 const {i18n}=useTranslation(); const location=useLocation(); const language=(i18n.language||'en').split('-')[0]; const labels=getTravelServiceLabels(language); const copy=COPY[language]||COPY.en; const [inventory,setInventory]=useState({});
 useEffect(()=>{let active=true;fetchTravelInventoryStatus().then(data=>{if(active)setInventory(data)});return()=>{active=false}},[]);
 useEffect(()=>{if(location.hash){const el=document.getElementById(location.hash.slice(1));if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),0)}},[location.hash]);
 const statusLabel=state=>state.direct?copy.direct:state.status==='partner-ready'?copy.partner:copy.guided;
 return <main className="travel-services-page">
  <PageMeta title="Travel Services - Flights, Hotels, Cars, Tours and More" description="Explore OptionTrip travel services for flights, stays, car rental, tours, eSIM, trains, buses, transfers, insurance, luggage storage and more with Travel Partner Vi." keywords="travel services, flights, hotels, car rental, tours, esim, trains, buses, airport transfers, travel insurance, OptionTrip" path="/services" />
  <section className="travel-services-hero"><div className="container"><span className="travel-services-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p><div className="travel-services-actions"><Link className="nir-btn" to="/travel-buddy?intent=plan-trip">{copy.plan}</Link><Link className="travel-services-secondary" to="/my-trips">{copy.trips}</Link></div></div></section>
  <div className="container travel-services-groups">{TRAVEL_SERVICE_GROUPS.map(group=><section className="travel-services-group" id={group.id} key={group.id} aria-labelledby={`services-${group.id}`}><h2 id={`services-${group.id}`}>{labels[group.id]||group.label}</h2><div className="travel-services-grid">{group.services.map(service=>{const state=getInventoryStateForService(service,inventory);const route=state.direct?service.route:viRoute(service);const serviceLabel=labels[service.id]||service.label;return <Link className="travel-service-card" to={route} key={service.id}><span className="travel-service-icon" aria-hidden="true"><i className={`fa ${service.icon}`}/></span><span className="travel-service-copy"><strong>{serviceLabel}</strong></span><span className="travel-service-status">{statusLabel(state)} <i className="fa fa-arrow-right" aria-hidden="true"/></span></Link>})}</div></section>)}</div>
  <section className="container travel-services-trust"><strong>{copy.trustTitle}</strong><span>{copy.trust}</span></section>
 </main>;
}
