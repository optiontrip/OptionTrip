import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { searchAirports } from '../../../services/flightService';
import { TRAVEL_SERVICES, getTravelServiceRoute } from '../../../config/travelServices';
import './TripServiceShortcuts.css';

const SERVICE_IDS = ['rail', 'bus', 'ferries', 'transfers', 'city_passes'];
const ROUTE_SERVICES = new Set(['rail', 'bus', 'ferries']);

const COPY = {
  en: {
    eyebrow: 'KEEP BUILDING THIS TRIP',
    title: 'Continue booking without starting over',
    intro: 'OptionTrip carries your saved route into transport and destination services, so you can keep planning from the same trip.',
    resolving: 'Preparing your route…',
    ready: 'Trip context ready',
    partial: 'Open service',
    labels: { rail: 'Train', bus: 'Bus', ferries: 'Ferry', transfers: 'Airport transfer', city_passes: 'City pass' },
    hints: {
      rail: 'Compare rail options for this route',
      bus: 'Compare bus options for this route',
      ferries: 'Check ferry options when available',
      transfers: 'Continue with transfers at your destination',
      city_passes: 'Check passes and attraction bundles',
    },
  },
  ru: {
    eyebrow: 'ПРОДОЛЖАЙТЕ ЭТУ ПОЕЗДКУ',
    title: 'Бронируйте дальше без повторного ввода маршрута',
    intro: 'OptionTrip переносит сохраненный маршрут в транспорт и сервисы пункта назначения, чтобы вы продолжали планирование из этой же поездки.',
    resolving: 'Готовим маршрут…',
    ready: 'Маршрут поездки готов',
    partial: 'Открыть сервис',
    labels: { rail: 'Поезд', bus: 'Автобус', ferries: 'Паром', transfers: 'Трансфер из аэропорта', city_passes: 'City Pass' },
    hints: {
      rail: 'Сравнить поезда по этому маршруту',
      bus: 'Сравнить автобусы по этому маршруту',
      ferries: 'Проверить паромы, если они доступны',
      transfers: 'Продолжить с трансфером в пункте назначения',
      city_passes: 'Проверить городские пропуска и достопримечательности',
    },
  },
  uk: {
    eyebrow: 'ПРОДОВЖУЙТЕ ЦЮ ПОДОРОЖ',
    title: 'Бронюйте далі без повторного введення маршруту',
    intro: 'OptionTrip переносить збережений маршрут у транспорт і сервіси пункту призначення, щоб ви продовжували планування з цієї ж подорожі.',
    resolving: 'Готуємо маршрут…',
    ready: 'Контекст подорожі готовий',
    partial: 'Відкрити сервіс',
    labels: { rail: 'Потяг', bus: 'Автобус', ferries: 'Пором', transfers: 'Трансфер з аеропорту', city_passes: 'City Pass' },
    hints: {
      rail: 'Порівняти потяги за цим маршрутом',
      bus: 'Порівняти автобуси за цим маршрутом',
      ferries: 'Перевірити пороми, якщо вони доступні',
      transfers: 'Продовжити з трансфером у пункті призначення',
      city_passes: 'Перевірити міські абонементи та пам’ятки',
    },
  },
  sr: {
    eyebrow: 'NASTAVITE OVU VOŽNJU',
    title: 'Nastavite rezervaciju bez ponovnog unosa rute',
    intro: 'OptionTrip prenosi sačuvanu rutu u prevoz i usluge na destinaciji, tako da planiranje nastavljate iz istog putovanja.',
    resolving: 'Pripremamo rutu…',
    ready: 'Kontekst putovanja je spreman',
    partial: 'Otvori uslugu',
    labels: { rail: 'Voz', bus: 'Autobus', ferries: 'Trajekt', transfers: 'Aerodromski transfer', city_passes: 'City Pass' },
    hints: {
      rail: 'Uporedite vozove za ovu rutu',
      bus: 'Uporedite autobuse za ovu rutu',
      ferries: 'Proverite trajekte kada su dostupni',
      transfers: 'Nastavite sa transferom na destinaciji',
      city_passes: 'Proverite gradske propusnice i atrakcije',
    },
  },
};

const SERVICE_ICONS = {
  rail: 'fa-train',
  bus: 'fa-bus',
  ferries: 'fa-ship',
  transfers: 'fa-taxi',
  city_passes: 'fa-ticket',
};

const labelOf = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || value.city || value.text || '';
};

const validIata = value => {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
};

const airportCodeFromItem = item => {
  if (!item || item.isCountry || item.entityType === 'country') return '';
  if (item.entityType === 'city' && Array.isArray(item.cityAirports)) {
    const airport = item.cityAirports.find(entry => validIata(entry?.iataCode));
    if (airport) return validIata(airport.iataCode);
  }
  return validIata(item.iataCode);
};

const resolveEndpoint = async label => {
  const query = String(label || '').trim();
  if (!query) return null;
  try {
    const matches = await searchAirports(query);
    const candidate = (matches || []).find(item => airportCodeFromItem(item));
    const code = airportCodeFromItem(candidate);
    if (!code) return null;
    return {
      code,
      label: candidate?.requestedPlace || candidate?.cityName || candidate?.name || query,
    };
  } catch {
    return null;
  }
};

const flightEndpoints = selectedFlight => {
  const segments = Array.isArray(selectedFlight?.segments) ? selectedFlight.segments : [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    originCode: validIata(first?.origin) || validIata(selectedFlight?.origin),
    destinationCode: validIata(last?.destination) || validIata(selectedFlight?.destination),
  };
};

const buildServiceHref = ({ serviceId, origin, destination }) => {
  const service = TRAVEL_SERVICES.find(item => item.id === serviceId);
  const base = service ? getTravelServiceRoute(service).split('?')[0] : `/services/${serviceId}`;
  const params = new URLSearchParams();

  if (destination?.code) {
    params.set('destinationCode', destination.code);
    params.set('destination', destination.label || destination.code);
  }
  if (ROUTE_SERVICES.has(serviceId) && origin?.code) {
    params.set('originCode', origin.code);
    params.set('origin', origin.label || origin.code);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
};

export default function TripServiceShortcuts({ tripData, selectedFlight }) {
  const { i18n } = useTranslation();
  const language = String(i18n.language || 'en').split('-')[0];
  const copy = COPY[language] || COPY.en;

  const tripOriginLabel = labelOf(tripData?.origin);
  const tripDestinationLabel = labelOf(tripData?.destination);
  const selectedCodes = useMemo(() => flightEndpoints(selectedFlight), [selectedFlight]);

  const [origin, setOrigin] = useState(() => selectedCodes.originCode ? { code: selectedCodes.originCode, label: tripOriginLabel || selectedCodes.originCode } : null);
  const [destination, setDestination] = useState(() => selectedCodes.destinationCode ? { code: selectedCodes.destinationCode, label: tripDestinationLabel || selectedCodes.destinationCode } : null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const flightCodes = flightEndpoints(selectedFlight);
      setResolving(true);
      try {
        const [resolvedOrigin, resolvedDestination] = await Promise.all([
          flightCodes.originCode
            ? Promise.resolve({ code: flightCodes.originCode, label: tripOriginLabel || flightCodes.originCode })
            : resolveEndpoint(tripOriginLabel),
          flightCodes.destinationCode
            ? Promise.resolve({ code: flightCodes.destinationCode, label: tripDestinationLabel || flightCodes.destinationCode })
            : resolveEndpoint(tripDestinationLabel),
        ]);
        if (!active) return;
        setOrigin(resolvedOrigin);
        setDestination(resolvedDestination);
      } finally {
        if (active) setResolving(false);
      }
    };
    run();
    return () => { active = false; };
  }, [selectedFlight, tripOriginLabel, tripDestinationLabel]);

  const contextReady = Boolean(destination?.code && origin?.code);

  return (
    <section className="trip-service-shortcuts" aria-label="Continue booking this trip">
      <div className="trip-service-shortcuts__head">
        <div>
          <span className="trip-service-shortcuts__eyebrow">{copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <div className={`trip-service-shortcuts__status${contextReady ? ' is-ready' : ''}`}>
          <i className={`fa ${resolving ? 'fa-spinner fa-spin' : contextReady ? 'fa-check-circle' : 'fa-compass'}`} aria-hidden="true" />
          <span>{resolving ? copy.resolving : contextReady ? copy.ready : copy.partial}</span>
        </div>
      </div>

      {(origin?.code || destination?.code) && (
        <div className="trip-service-shortcuts__route">
          {origin?.code && <span><strong>{origin.label || origin.code}</strong><small>{origin.code}</small></span>}
          {origin?.code && destination?.code && <i className="fa fa-arrow-right" aria-hidden="true" />}
          {destination?.code && <span><strong>{destination.label || destination.code}</strong><small>{destination.code}</small></span>}
        </div>
      )}

      <div className="trip-service-shortcuts__grid">
        {SERVICE_IDS.map(serviceId => {
          const href = buildServiceHref({ serviceId, origin, destination });
          const hasNeededContext = ROUTE_SERVICES.has(serviceId)
            ? Boolean(origin?.code && destination?.code)
            : Boolean(destination?.code);
          return (
            <Link key={serviceId} to={href} className="trip-service-shortcut">
              <span className="trip-service-shortcut__icon"><i className={`fa ${SERVICE_ICONS[serviceId]}`} aria-hidden="true" /></span>
              <span className="trip-service-shortcut__copy">
                <strong>{copy.labels[serviceId]}</strong>
                <small>{copy.hints[serviceId]}</small>
              </span>
              <span className={`trip-service-shortcut__context${hasNeededContext ? ' is-ready' : ''}`}>
                {hasNeededContext ? <i className="fa fa-check" aria-label={copy.ready} /> : <i className="fa fa-arrow-right" aria-hidden="true" />}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
