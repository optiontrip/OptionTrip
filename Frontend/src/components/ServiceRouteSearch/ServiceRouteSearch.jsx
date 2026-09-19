import React, { useEffect, useMemo, useState } from 'react';
import { searchAirports } from '../../services/flightService';
import { createRouteAwarePartnerDeepLink } from '../../services/travelInventoryService';
import './ServiceRouteSearch.css';

const SUPPORTED = new Set(['rail', 'bus', 'ferries']);

const COPY = {
  en: {
    title: 'Search this route',
    intro: 'Choose two cities. OptionTrip will prepare a route-specific partner page instead of sending you to a generic homepage.',
    from: 'From', to: 'To', fromPlaceholder: 'City or nearby airport', toPlaceholder: 'City or nearby airport',
    search: 'Prepare booking route', searching: 'Preparing route…', ready: 'Route ready',
    continue: 'Continue to route options', routeVia: 'Route prepared with', change: 'Change route',
    selectSuggestion: 'Choose a city from the suggestions.', same: 'Choose two different cities.',
    unavailable: 'A route-specific handoff is not available right now. You can still use the live partner comparison below.',
    hint: 'Your route is prefilled. Choose the travel date and final ticket on the provider page.',
  },
  ru: {
    title: 'Найти маршрут',
    intro: 'Выберите два города. OptionTrip подготовит конкретную страницу маршрута у партнера, а не отправит вас на его главную страницу.',
    from: 'Откуда', to: 'Куда', fromPlaceholder: 'Город или ближайший аэропорт', toPlaceholder: 'Город или ближайший аэропорт',
    search: 'Подготовить маршрут', searching: 'Готовим маршрут…', ready: 'Маршрут готов',
    continue: 'Перейти к вариантам маршрута', routeVia: 'Маршрут подготовлен через', change: 'Изменить маршрут',
    selectSuggestion: 'Выберите город из подсказок.', same: 'Выберите два разных города.',
    unavailable: 'Сейчас не удалось подготовить точный переход по маршруту. Ниже по-прежнему доступно сравнение работающих партнеров.',
    hint: 'Маршрут уже подставлен. Дату поездки и конкретный билет выберите на странице партнера.',
  },
  uk: {
    title: 'Знайти маршрут',
    intro: 'Оберіть два міста. OptionTrip підготує конкретну сторінку маршруту в партнера, а не відправить вас на його головну сторінку.',
    from: 'Звідки', to: 'Куди', fromPlaceholder: 'Місто або найближчий аеропорт', toPlaceholder: 'Місто або найближчий аеропорт',
    search: 'Підготувати маршрут', searching: 'Готуємо маршрут…', ready: 'Маршрут готовий',
    continue: 'Перейти до варіантів маршруту', routeVia: 'Маршрут підготовлено через', change: 'Змінити маршрут',
    selectSuggestion: 'Оберіть місто з підказок.', same: 'Оберіть два різні міста.',
    unavailable: 'Зараз не вдалося підготувати точний перехід за маршрутом. Нижче все одно доступне порівняння робочих партнерів.',
    hint: 'Маршрут уже підставлено. Дату подорожі та конкретний квиток оберіть на сторінці партнера.',
  },
};

const itemCode = item => {
  if (item?.entityType === 'country' || item?.isCountry) return null;
  if (item?.entityType === 'city' && Array.isArray(item?.cityAirports) && item.cityAirports.length) {
    return item.cityAirports.find(airport => /^[A-Z]{3}$/.test(String(airport?.iataCode || '')))?.iataCode || null;
  }
  const code = String(item?.iataCode || '').toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
};

const displayLabel = item => {
  const city = item?.requestedPlace || item?.cityName || item?.name || item?.iataCode || '';
  const country = item?.countryName || '';
  const airport = item?.entityType === 'nearest-airport' ? item?.name : '';
  if (airport) return airport;
  return country && !String(city).includes(country) ? `${city}, ${country}` : city;
};

const dedupeSuggestions = items => {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .filter(item => itemCode(item))
    .filter(item => {
      const code = itemCode(item);
      const city = String(item?.cityName || item?.requestedPlace || '').toLowerCase();
      const key = `${city}:${code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
};

const LocationField = ({ label, placeholder, value, onValueChange, selection, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = String(value || '').trim();
    if (selection || query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchAirports(query)
        .then(items => {
          if (active) setSuggestions(dedupeSuggestions(items));
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, selection]);

  const choose = item => {
    const code = itemCode(item);
    if (!code) return;
    onSelect({ ...item, resolvedCode: code, displayLabel: displayLabel(item) });
    setSuggestions([]);
  };

  return (
    <label className="service-route-search__field">
      <span>{label}</span>
      <div className="service-route-search__input-wrap">
        <i className="fa fa-location-dot" aria-hidden="true" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={event => onValueChange(event.target.value)}
          aria-autocomplete="list"
        />
        {loading && <span className="service-route-search__mini-spinner" aria-hidden="true" />}
      </div>
      {suggestions.length > 0 && (
        <div className="service-route-search__suggestions" role="listbox">
          {suggestions.map(item => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={`${itemCode(item)}:${displayLabel(item)}`}
              onClick={() => choose(item)}
            >
              <span className="service-route-search__suggestion-icon"><i className="fa fa-location-dot" aria-hidden="true" /></span>
              <span>
                <strong>{displayLabel(item)}</strong>
                <small>{itemCode(item)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
};

export default function ServiceRouteSearch({ serviceId, language = 'en' }) {
  const copy = COPY[language] || COPY.en;
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const supported = SUPPORTED.has(serviceId);
  const sameRoute = origin?.resolvedCode && destination?.resolvedCode && origin.resolvedCode === destination.resolvedCode;
  const canSearch = Boolean(origin?.resolvedCode && destination?.resolvedCode && !sameRoute && !loading);

  const routeLabel = useMemo(() => {
    if (!result?.origin?.city || !result?.destination?.city) return '';
    return `${result.origin.city} → ${result.destination.city}`;
  }, [result]);

  if (!supported) return null;

  const updateOriginText = value => {
    setOriginText(value);
    setOrigin(null);
    setResult(null);
    setError('');
  };
  const updateDestinationText = value => {
    setDestinationText(value);
    setDestination(null);
    setResult(null);
    setError('');
  };
  const chooseOrigin = item => {
    setOrigin(item);
    setOriginText(item.displayLabel);
    setResult(null);
    setError('');
  };
  const chooseDestination = item => {
    setDestination(item);
    setDestinationText(item.displayLabel);
    setResult(null);
    setError('');
  };

  const prepareRoute = async event => {
    event.preventDefault();
    if (!origin?.resolvedCode || !destination?.resolvedCode) {
      setError(copy.selectSuggestion);
      return;
    }
    if (sameRoute) {
      setError(copy.same);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await createRouteAwarePartnerDeepLink({
        serviceId,
        originCode: origin.resolvedCode,
        destinationCode: destination.resolvedCode,
      });
      setResult(data);
    } catch {
      setError(copy.unavailable);
    } finally {
      setLoading(false);
    }
  };

  const resetRoute = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="service-route-search">
      <div className="service-route-search__head">
        <span className="service-route-search__mark"><i className="fa fa-route" aria-hidden="true" /></span>
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.intro}</p>
        </div>
      </div>

      {!result ? (
        <form className="service-route-search__form" onSubmit={prepareRoute}>
          <LocationField
            label={copy.from}
            placeholder={copy.fromPlaceholder}
            value={originText}
            selection={origin}
            onValueChange={updateOriginText}
            onSelect={chooseOrigin}
          />
          <LocationField
            label={copy.to}
            placeholder={copy.toPlaceholder}
            value={destinationText}
            selection={destination}
            onValueChange={updateDestinationText}
            onSelect={chooseDestination}
          />
          <button type="submit" className="nir-btn service-route-search__submit" disabled={!canSearch}>
            {loading ? copy.searching : copy.search}
          </button>
        </form>
      ) : (
        <div className="service-route-search__ready">
          <span className="service-route-search__ready-icon"><i className="fa fa-check" aria-hidden="true" /></span>
          <div className="service-route-search__ready-copy">
            <small>{copy.ready}</small>
            <strong>{routeLabel}</strong>
            <span>{copy.routeVia} 12Go. {copy.hint}</span>
          </div>
          <a
            className="nir-btn service-route-search__continue"
            href={result.partnerUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {copy.continue} <i className="fa fa-arrow-right" aria-hidden="true" />
          </a>
          <button type="button" className="service-route-search__change" onClick={resetRoute}>{copy.change}</button>
        </div>
      )}

      {error && <div className="service-route-search__error" role="alert">{error}</div>}
    </div>
  );
}
