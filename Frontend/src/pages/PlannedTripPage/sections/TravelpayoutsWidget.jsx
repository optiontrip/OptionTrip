import React, { useEffect, useRef, useState } from 'react';

const LOAD_TIMEOUT_MS = 10000;

const TravelpayoutsWidget = ({ src, title }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    setStatus('loading');
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.charset = 'utf-8';
    script.setAttribute('data-optiontrip-widget', 'travelpayouts');

    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setStatus('ready');
    };
    const markError = () => {
      if (settled) return;
      settled = true;
      setStatus('error');
    };

    script.addEventListener('load', markReady, { once: true });
    script.addEventListener('error', markError, { once: true });
    container.appendChild(script);

    const timeoutId = window.setTimeout(() => {
      if (!settled && container.childElementCount <= 1) markError();
      else markReady();
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', markReady);
      script.removeEventListener('error', markError);
      container.innerHTML = '';
    };
  }, [src, attempt]);

  return (
    <div className="cr-tp-widget" data-widget-status={status}>
      {title && <h3 className="cr-tp-widget__title">{title}</h3>}
      <div
        ref={containerRef}
        className="cr-tp-widget__slot"
        aria-busy={status === 'loading'}
        aria-label={title || 'Travel booking options'}
      />
      {status === 'loading' && (
        <div className="cr-tp-widget__state" role="status">Loading live booking options...</div>
      )}
      {status === 'error' && (
        <div className="cr-tp-widget__state cr-tp-widget__state--error" role="alert">
          <strong>Booking options did not load.</strong>
          <span>Check your connection or try again. Your trip is still saved.</span>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
        </div>
      )}
    </div>
  );
};

export default TravelpayoutsWidget;
