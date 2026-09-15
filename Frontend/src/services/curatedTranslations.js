const CURATED_TRANSLATIONS = {
  ru: {
    'Stay Inspired': 'Вдохновляйтесь путешествиями',
    'OptionTrip travel news and personalized updates are being expanded.': 'Мы развиваем новости OptionTrip и персональные рекомендации для путешественников.',
    'Travel News': 'Новости путешествий',
    'OptionTrip is a young travel technology team building a simpler way to discover, plan, compare, prepare for, and experience trips with Travel Partner Vi at the center.': 'OptionTrip - команда в сфере туристических технологий. Мы упрощаем поиск направлений, планирование, сравнение вариантов и подготовку к поездкам, а помощник в путешествиях Vi сопровождает вас на каждом этапе.',
    'Travel Partner Vi': 'Помощник в путешествиях Vi',
    'Personalized trip planning': 'Персональное планирование поездок',
    'Useful travel recommendations': 'Полезные рекомендации для путешествий',
    'Company': 'О компании',
    'About OptionTrip': 'Об OptionTrip',
    'How It Works': 'Как это работает',
    'Contact Us': 'Связаться с нами',
    'Travel': 'Путешествия',
    'Explore Destinations': 'Направления',
    'Trip Ideas': 'Идеи для поездок',
    'Travel Map': 'Карта путешествий',
    'Popular Routes': 'Популярные маршруты',
    'Travel Tips': 'Советы путешественникам',
    'Support': 'Помощь',
    'Help Center': 'Справочный центр',
    'Contact Support': 'Связаться с поддержкой',
    'Travel Questions': 'Вопросы о путешествиях',
    'Feedback': 'Обратная связь',
    'Legal': 'Документы',
    'Privacy Policy': 'Политика конфиденциальности',
    'Terms of Service': 'Условия использования',
    'Cookie Policy': 'Политика использования cookie',
    'Data Protection': 'Защита данных',
    'All rights reserved.': 'Все права защищены.'
  }
};

export const getCuratedTranslation = (text, targetLang) => {
  const target = (targetLang || 'en').split('-')[0];
  const key = String(text ?? '').trim();
  return CURATED_TRANSLATIONS[target]?.[key] || null;
};

export default CURATED_TRANSLATIONS;
