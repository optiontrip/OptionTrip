import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageMeta from '../hooks/usePageMeta';
import './TravelBuddyPage.css';

const COPY = {
  en: {
    metaTitle: 'Meet Vi - Your Personal Travel Partner',
    metaDescription: "Meet Vi, OptionTrip's personal travel partner for planning, comparing and navigating your trip across the OptionTrip travel ecosystem.",
    eyebrow: 'Meet Vi',
    title: 'Your Personal Travel Partner',
    hero: "Vi is OptionTrip's intelligent travel partner, built to help you plan, compare, decide and keep moving throughout the whole trip.",
    heroCta: 'Start planning with Vi',
    why: 'WHY VI',
    introTitle: 'Travel planning that stays with you',
    intro1: 'Vi is more than a one-time itinerary generator. It connects inspiration, search, booking options, preparation and help on the road in one continuous OptionTrip experience.',
    intro2: 'Start with as much or as little information as you have. Vi can help you decide what to do next and move you into the right travel service when you are ready.',
    capabilities: 'CAPABILITIES',
    capabilitiesTitle: 'What Vi can help you do',
    capabilitiesIntro: 'Useful help before the trip, while you travel and when plans change.',
    how: 'HOW IT WORKS',
    howTitle: 'A simple travel flow',
    ctaTitle: 'Ready to plan your next trip?',
    ctaText: 'Start with the search you need now, or use Vi when you want help deciding what comes next.',
    ctaButton: 'Start on OptionTrip',
    imageAlt: 'Illustration of travel planning with Vi',
    features: [
      { icon: 'fas fa-comments', title: 'Natural conversations', desc: 'Tell Vi what you want in normal language. Vi keeps the travel context and helps turn an idea into a practical next step.' },
      { icon: 'fas fa-route', title: 'Trip planning', desc: 'Build routes, compare travel options and organize the trip around your dates, budget, pace and interests.' },
      { icon: 'fas fa-map-marked-alt', title: 'Help during the trip', desc: 'Use Vi for local ideas, nearby places, practical questions and changes while you are already traveling.' },
      { icon: 'fas fa-language', title: 'Multilingual support', desc: 'Plan in the language that feels natural to you. Vi is designed to follow the language you use in the conversation.' },
      { icon: 'fas fa-sync-alt', title: 'Plans that can change', desc: 'Trips change. Vi can help adjust an itinerary, rethink a day or compare another route without starting over.' },
      { icon: 'fas fa-compass', title: 'One travel ecosystem', desc: 'Flights, stays, cars, activities, trains, buses, transfers, city passes and other OptionTrip services stay connected.' },
    ],
    steps: [
      { num: '01', title: 'Tell Vi what you need', desc: 'A destination, a rough idea or even just a budget is enough to start.' },
      { num: '02', title: 'Compare the possibilities', desc: 'Vi helps narrow the options and points you to the right OptionTrip search or partner.' },
      { num: '03', title: 'Refine the trip', desc: 'Change dates, priorities, pace or route and continue from the same travel context.' },
      { num: '04', title: 'Keep Vi with you', desc: 'Come back before, during and after the trip when you need the next answer.' },
    ],
  },
  ru: {
    metaTitle: 'Знакомьтесь, Vi - ваш персональный помощник в путешествиях',
    metaDescription: 'Vi - персональный помощник OptionTrip для планирования, сравнения вариантов и сопровождения поездки в единой экосистеме OptionTrip.',
    eyebrow: 'Знакомьтесь, Vi',
    title: 'Ваш персональный помощник в путешествиях',
    hero: 'Vi - интеллектуальный помощник OptionTrip, который помогает планировать, сравнивать, принимать решения и сопровождать поездку от идеи до возвращения домой.',
    heroCta: 'Начать планирование с Vi',
    why: 'ПОЧЕМУ VI',
    introTitle: 'Планирование, которое остается с вами',
    intro1: 'Vi - это не разовый генератор маршрута. Он связывает идеи, поиск, варианты бронирования, подготовку и помощь в дороге в единый процесс OptionTrip.',
    intro2: 'Можно начать даже с одной мысли или примерного бюджета. Vi поможет понять следующий шаг и перейти к нужному сервису OptionTrip, когда вы будете готовы.',
    capabilities: 'ВОЗМОЖНОСТИ',
    capabilitiesTitle: 'Чем может помочь Vi',
    capabilitiesIntro: 'Полезная помощь до поездки, во время путешествия и когда планы меняются.',
    how: 'КАК ЭТО РАБОТАЕТ',
    howTitle: 'Простой путь от идеи до поездки',
    ctaTitle: 'Готовы планировать следующую поездку?',
    ctaText: 'Начните с нужного поиска или обратитесь к Vi, когда хотите понять, что делать дальше.',
    ctaButton: 'Начать в OptionTrip',
    imageAlt: 'Иллюстрация планирования путешествия с Vi',
    features: [
      { icon: 'fas fa-comments', title: 'Живой разговор', desc: 'Расскажите Vi обычными словами, чего вы хотите. Он сохраняет контекст поездки и превращает идею в понятный следующий шаг.' },
      { icon: 'fas fa-route', title: 'Планирование поездки', desc: 'Стройте маршруты, сравнивайте варианты и организуйте путешествие с учетом дат, бюджета, темпа и интересов.' },
      { icon: 'fas fa-map-marked-alt', title: 'Помощь во время поездки', desc: 'Спрашивайте Vi о местах рядом, транспорте, практических деталях и изменениях уже в дороге.' },
      { icon: 'fas fa-language', title: 'Поддержка разных языков', desc: 'Планируйте на удобном вам языке. Vi создан так, чтобы продолжать разговор на том языке, которым вы пользуетесь.' },
      { icon: 'fas fa-sync-alt', title: 'Планы можно менять', desc: 'Поездки меняются. Vi поможет перестроить маршрут, изменить день или сравнить другой вариант без начала с нуля.' },
      { icon: 'fas fa-compass', title: 'Единая экосистема путешествия', desc: 'Авиабилеты, отели, аренда авто, развлечения, поезда, автобусы, трансферы, туристические карты и другие сервисы OptionTrip остаются связанными.' },
    ],
    steps: [
      { num: '01', title: 'Скажите Vi, что вам нужно', desc: 'Для начала достаточно направления, примерной идеи или даже одного бюджета.' },
      { num: '02', title: 'Сравните варианты', desc: 'Vi поможет сузить выбор и переведет к подходящему поиску или сервису OptionTrip.' },
      { num: '03', title: 'Уточняйте поездку', desc: 'Меняйте даты, приоритеты, темп или маршрут и продолжайте с уже сохраненным контекстом.' },
      { num: '04', title: 'Оставляйте Vi рядом', desc: 'Возвращайтесь к Vi до поездки, в дороге и после нее, когда понадобится следующий ответ.' },
    ],
  },
  uk: {
    metaTitle: 'Знайомтеся, Vi - ваш персональний помічник у подорожах',
    metaDescription: 'Vi - персональний помічник OptionTrip для планування, порівняння варіантів і супроводу подорожі в єдиній екосистемі OptionTrip.',
    eyebrow: 'Знайомтеся, Vi',
    title: 'Ваш персональний помічник у подорожах',
    hero: 'Vi - інтелектуальний помічник OptionTrip, який допомагає планувати, порівнювати, ухвалювати рішення та супроводжувати подорож від ідеї до повернення додому.',
    heroCta: 'Почати планування з Vi',
    why: 'ЧОМУ VI',
    introTitle: 'Планування, яке залишається з вами',
    intro1: 'Vi - це не одноразовий генератор маршруту. Він поєднує ідеї, пошук, варіанти бронювання, підготовку та допомогу в дорозі в один процес OptionTrip.',
    intro2: 'Можна почати навіть з однієї думки або приблизного бюджету. Vi допоможе зрозуміти наступний крок і перейти до потрібного сервісу OptionTrip, коли ви будете готові.',
    capabilities: 'МОЖЛИВОСТІ',
    capabilitiesTitle: 'Чим може допомогти Vi',
    capabilitiesIntro: 'Корисна допомога до подорожі, під час неї та коли плани змінюються.',
    how: 'ЯК ЦЕ ПРАЦЮЄ',
    howTitle: 'Простий шлях від ідеї до подорожі',
    ctaTitle: 'Готові планувати наступну подорож?',
    ctaText: 'Почніть із потрібного пошуку або зверніться до Vi, коли хочете зрозуміти, що робити далі.',
    ctaButton: 'Почати в OptionTrip',
    imageAlt: 'Ілюстрація планування подорожі з Vi',
    features: [
      { icon: 'fas fa-comments', title: 'Жива розмова', desc: 'Розкажіть Vi звичайними словами, чого ви хочете. Він зберігає контекст подорожі та перетворює ідею на зрозумілий наступний крок.' },
      { icon: 'fas fa-route', title: 'Планування подорожі', desc: 'Будуйте маршрути, порівнюйте варіанти та організовуйте подорож з урахуванням дат, бюджету, темпу й інтересів.' },
      { icon: 'fas fa-map-marked-alt', title: 'Допомога під час подорожі', desc: 'Запитуйте Vi про місця поруч, транспорт, практичні деталі та зміни вже в дорозі.' },
      { icon: 'fas fa-language', title: 'Підтримка різних мов', desc: 'Плануйте зручною для вас мовою. Vi створений так, щоб продовжувати розмову мовою, якою ви користуєтеся.' },
      { icon: 'fas fa-sync-alt', title: 'Плани можна змінювати', desc: 'Подорожі змінюються. Vi допоможе перебудувати маршрут, змінити день або порівняти інший варіант без початку з нуля.' },
      { icon: 'fas fa-compass', title: 'Єдина екосистема подорожі', desc: 'Авіаквитки, готелі, оренда авто, розваги, потяги, автобуси, трансфери, туристичні картки та інші сервіси OptionTrip залишаються пов’язаними.' },
    ],
    steps: [
      { num: '01', title: 'Скажіть Vi, що вам потрібно', desc: 'Для початку достатньо напрямку, приблизної ідеї або навіть одного бюджету.' },
      { num: '02', title: 'Порівняйте варіанти', desc: 'Vi допоможе звузити вибір і переведе до відповідного пошуку або сервісу OptionTrip.' },
      { num: '03', title: 'Уточнюйте подорож', desc: 'Змінюйте дати, пріоритети, темп або маршрут і продовжуйте зі збереженим контекстом.' },
      { num: '04', title: 'Залишайте Vi поруч', desc: 'Повертайтеся до Vi до подорожі, в дорозі та після неї, коли знадобиться наступна відповідь.' },
    ],
  },
};

const TravelBuddyPage = () => {
  const { i18n } = useTranslation();
  const language = (i18n.language || 'en').split('-')[0];
  const copy = COPY[language] || COPY.en;

  return (
    <div className="tb-page">
      <PageMeta
        title={copy.metaTitle}
        description={copy.metaDescription}
        keywords="AI travel assistant, travel partner, Vi, trip planner, travel planning, OptionTrip"
        path="/travel-buddy"
      />

      <section className="tb-hero" style={{ backgroundImage: 'url(/images/bg/bg2.jpg)' }}>
        <div className="container">
          <div className="tb-hero__content">
            <span className="tb-eyebrow"><i className="fas fa-plane" aria-hidden="true" /> {copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.hero}</p>
            <Link to="/" className="tb-primary-cta">{copy.heroCta} <i className="fas fa-arrow-right" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="tb-section">
        <div className="container">
          <div className="tb-intro-grid">
            <div className="tb-intro-visual">
              <img src="/images/illu1.png" alt={copy.imageAlt} loading="lazy" />
            </div>
            <div className="tb-intro-copy">
              <p className="tb-kicker">{copy.why}</p>
              <h2>{copy.introTitle}</h2>
              <p>{copy.intro1}</p>
              <p>{copy.intro2}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="tb-section tb-section--soft">
        <div className="container">
          <div className="tb-section-heading">
            <p className="tb-kicker">{copy.capabilities}</p>
            <h2>{copy.capabilitiesTitle}</h2>
            <p>{copy.capabilitiesIntro}</p>
          </div>
          <div className="tb-features">
            {copy.features.map(feature => (
              <article className="tb-feature" key={feature.title}>
                <div className="tb-feature__icon"><i className={feature.icon} aria-hidden="true" /></div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tb-section">
        <div className="container">
          <div className="tb-section-heading">
            <p className="tb-kicker">{copy.how}</p>
            <h2>{copy.howTitle}</h2>
          </div>
          <div className="tb-steps">
            {copy.steps.map(step => (
              <article className="tb-step" key={step.num}>
                <div className="tb-step__num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tb-cta">
        <div className="container">
          <h2>{copy.ctaTitle}</h2>
          <p>{copy.ctaText}</p>
          <Link to="/" className="tb-secondary-cta">{copy.ctaButton}</Link>
        </div>
      </section>
    </div>
  );
};

export default TravelBuddyPage;
