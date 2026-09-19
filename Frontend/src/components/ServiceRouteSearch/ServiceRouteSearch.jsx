import React, { useEffect, useMemo, useState } from 'react';
import { searchAirports } from '../../services/flightService';
import { createRouteAwarePartnerDeepLink } from '../../services/travelInventoryService';
import './ServiceRouteSearch.css';

const SERVICE_MODES = Object.freeze({
  rail: 'route',
  bus: 'route',
  ferries: 'route',
  transfers: 'destination',
  city_passes: 'destination',
});

const BASE_COPY = {
  en: {
    from: 'From', to: 'To', destination: 'Destination', fromPlaceholder: 'City or nearby airport', toPlaceholder: 'City or nearby airport', destinationPlaceholder: 'City or nearby airport',
    selectSuggestion: 'Choose a city from the suggestions.', same: 'Choose two different cities.', change: 'Change search',
    genericUnavailable: 'A destination-specific handoff is not available right now. You can still use the live partner comparison below.',
  },
  ru: {
    from: 'Откуда', to: 'Куда', destination: 'Куда едете', fromPlaceholder: 'Город или ближайший аэропорт', toPlaceholder: 'Город или ближайший аэропорт', destinationPlaceholder: 'Город или ближайший аэропорт',
    selectSuggestion: 'Выберите город из подсказок.', same: 'Выберите два разных города.', change: 'Изменить поиск',
    genericUnavailable: 'Сейчас не удалось подготовить точный переход. Ниже по-прежнему доступно сравнение работающих партнеров.',
  },
  uk: {
    from: 'Звідки', to: 'Куди', destination: 'Куди їдете', fromPlaceholder: 'Місто або найближчий аеропорт', toPlaceholder: 'Місто або найближчий аеропорт', destinationPlaceholder: 'Місто або найближчий аеропорт',
    selectSuggestion: 'Оберіть місто з підказок.', same: 'Оберіть два різні міста.', change: 'Змінити пошук',
    genericUnavailable: 'Зараз не вдалося підготувати точний перехід. Нижче все одно доступне порівняння робочих партнерів.',
  },
};

const SERVICE_COPY = {
  en: {
    route: {
      title: 'Search this route', intro: 'Choose two cities. OptionTrip will prepare a route-specific partner page instead of sending you to a generic homepage.',
      search: 'Prepare booking route', searching: 'Preparing route…', ready: 'Route ready', continue: 'Continue to route options',
      hint: 'Your route is prefilled. Choose the travel date and final ticket on the provider page.', unavailable: 'A route-specific handoff is not available right now. You can still use the live partner comparison below.',
    },
    transfers: {
      title: 'Find an airport transfer', intro: 'Choose your destination. OptionTrip will open the verified transfer market for that country instead of a generic partner homepage.',
      search: 'Find transfer options', searching: 'Preparing transfers…', ready: 'Transfer market ready', continue: 'See transfer options',
      hint: 'Your destination country is selected. Enter the exact pickup and drop-off points on the provider page.', unavailable: 'A destination-specific transfer page is not available right now. You can still compare live transfer partners below.',
    },
    city_passes: {
      title: 'Check city passes', intro: 'Choose a destination. When Go City serves that city, OptionTrip will prepare the exact destination pass page.',
      search: 'Check city passes', searching: 'Checking passes…', ready: 'City pass page ready', continue: 'See city passes',
      hint: 'Compare the pass types, included attractions and dates on the provider page.', unavailable: 'Go City does not currently have a destination page for this city. You can still compare other live activity partners below.',
    },
  },
  ru: {
    route: {
      title: 'Найти маршрут', intro: 'Выберите два города. OptionTrip подготовит конкретную страницу маршрута у партнера, а не отправит вас на его главную страницу.',
      search: 'Подготовить маршрут', searching: 'Готовим маршрут…', ready: 'Маршрут готов', continue: 'Перейти к вариантам маршрута',
      hint: 'Маршрут уже подставлен. Дату поездки и конкретный билет выберите на странице партнера.', unavailable: 'Сейчас не удалось подготовить точный переход по маршруту. Ниже по-прежнему доступно сравнение работающих партнеров.',
    },
    transfers: {
      title: 'Найти трансфер из аэропорта', intro: 'Выберите пункт назначения. OptionTrip откроет страницу трансферов именно для этой страны, а не общую главную страницу партнера.',
      search: 'Найти трансферы', searching: 'Готовим трансферы…', ready: 'Трансферы доступны', continue: 'Посмотреть трансферы',
      hint: 'Страна назначения уже выбрана. Точную точку посадки и высадки укажите на странице партнера.', unavailable: 'Сейчас не удалось подготовить страницу трансферов для этого направления. Ниже можно сравнить других доступных партнеров.',
    },
    city_passes: {
      title: 'Проверить City Pass', intro: 'Выберите город. Если Go City работает в этом направлении, OptionTrip подготовит точную страницу городского пропуска.',
      search: 'Проверить City Pass', searching: 'Проверяем пропуска…', ready: 'City Pass найден', continue: 'Посмотреть City Pass',
      hint: 'На странице партнера сравните типы пропусков, включенные достопримечательности и даты.', unavailable: 'Go City сейчас не предлагает отдельную страницу для этого города. Ниже можно сравнить другие доступные сервисы активностей.',
    },
  },
  uk: {
    route: {
      title: 'Знайти маршрут', intro: 'Оберіть два міста. OptionTrip підготує конкретну сторінку маршруту в партнера, а не відправить вас на його головну сторінку.',
      search: 'Підготувати маршрут', searching: 'Готуємо маршрут…', ready: 'Маршрут готовий', continue: 'Перейти до варіантів маршруту',
      hint: 'Маршрут уже підставлено. Дату подорожі та конкретний квиток оберіть на сторінці партнера.', unavailable: 'Зараз не вдалося підготувати точний перехід за маршрутом. Нижче все одно доступне порівняння робочих партнерів.',
    },
    transfers: {
      title: 'Знайти трансфер з аеропорту', intro: 'Оберіть пункт призначення. OptionTrip відкриє сторінку трансферів саме для цієї країни, а не загальну головну сторінку партнера.',
      search: 'Знайти трансфери', searching: 'Готуємо трансфери…', ready: 'Трансфери доступні', continue: 'Переглянути трансфери',
      hint: 'Країну призначення вже вибрано. Точні точки посадки та висадки вкажіть на сторінці партнера.', unavailable: 'Зараз не вдалося підготувати сторінку трансферів для цього напрямку. Нижче можна порівняти інших доступних партнерів.',
    },
    city_passes: {
      title: 'Перевірити City Pass', intro: 'Оберіть місто. Якщо Go City працює в цьому напрямку, OptionTrip підготує точну сторінку міського пропуску.',
      search: 'Перевірити City Pass', searching: 'Перевіряємо пропуски…', ready: 'City Pass знайдено', continue: 'Переглянути City Pass',
      hint: 'На сторінці партнера порівняйте типи пропусків, включені пам’ятки та дати.', unavailable: 'Go City зараз не пропонує окрему сторінку для цього міста. Нижче можна порівняти інші доступні сервіси активностей.',
    },
  },
};

const PROVIDER_NAMES = Object.freeze({
  twelve_go: '12Go',
  kiwitaxi: 'Kiwitaxi',
  go_city: 'Go City',
});

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
  const mode = SERVICE_MODES[serviceId] || null;
  const base = BASE_COPY[language] || BASE_COPY.en;
  const languageCopy = SERVICE_COPY[language] || SERVICE_COPY.en;
  const copy = serviceId === 'transfers'
    ? languageCopy.transfers
    : serviceId === 'city_passes'
      ? languageCopy.city_passes
      : languageCopy.route;

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const sameRoute = mode === 'route' && origin?.resolvedCode && destination?.resolvedCode && origin.resolvedCode === destination.resolvedCode;
  const canSearch = mode === 'route'
    ? Boolean(origin?.resolvedCode && destination?.resolvedCode && !loading)
    : Boolean(destination?.resolvedCode && !loading);

  const resultLabel = useMemo(() => {
    if (mode === 'route' && result?.origin?.city && result?.destination?.city) {
      return `${result.origin.city} → ${result.destination.city}`;
    }
    if (result?.destination?.city) {
      return result.destination.country
        ? `${result.destination.city}, ${result.destination.country}`
        : result.destination.city;
    }
    return '';
  }, [mode, result]);

  if (!mode) return null;

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
    if (!destination?.resolvedCode || (mode === 'route' && !origin?.resolvedCode)) {
      setError(base.selectSuggestion);
      return;
    }
    if (sameRoute) {
      setError(base.same);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await createRouteAwarePartnerDeepLink({
        serviceId,
        originCode: mode === 'route' ? origin.resolvedCode : undefined,
        destinationCode: destination.resolvedCode,
      });
      setResult(data);
    } catch {
      setError(copy.unavailable || base.genericUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const resetRoute = () => {
    setResult(null);
    setError('');
  };

  const providerName = PROVIDER_NAMES[result?.provider] || result?.provider || '';

  return (
    <div className={`service-route-search service-route-search--${mode}`}>
      <div className="service-route-search__head">
        <span className="service-route-search__mark"><i className={`fa ${mode === 'route' ? 'fa-route' : serviceId === 'transfers' ? 'fa-taxi' : 'fa-ticket-alt'}`} aria-hidden="true" /></span>
        <div>
          <strong>{copy.title}</strong>
          <p>{copy.intro}</p>
        </div>
      </div>

      {!result ? (
        <form className={`service-route-search__form ${mode === 'destination' ? 'service-route-search__form--destination' : ''}`} onSubmit={prepareRoute}>
          {mode === 'route' && (
            <LocationField
              label={base.from}
              placeholder={base.fromPlaceholder}
              value={originText}
              selection={origin}
              onValueChange={updateOriginText}
              onSelect={chooseOrigin}
            />
          )}
          <LocationField
            label={mode === 'route' ? base.to : base.destination}
            placeholder={mode === 'route' ? base.toPlaceholder : base.destinationPlaceholder}
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
            <strong>{resultLabel}</strong>
            <span>{providerName ? `${providerName}. ` : ''}{copy.hint}</span>
          </div>
          <a
            className="nir-btn service-route-search__continue"
            href={result.partnerUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {copy.continue} <i className="fa fa-arrow-right" aria-hidden="true" />
          </a>
          <button type="button" className="service-route-search__change" onClick={resetRoute}>{base.change}</button>
        </div>
      )}

      {error && <div className="service-route-search__error" role="alert">{error}</div>}
    </div>
  );
}
