import React from 'react';
import { Link } from 'react-router-dom';
import './ActionableEmptyState.css';

const Action = ({ action, primary = false }) => {
  if (!action?.label) return null;
  const className = `aes__action${primary ? ' aes__action--primary' : ''}`;

  if (action.to) {
    return <Link className={className} to={action.to}>{action.label}</Link>;
  }

  return (
    <button type="button" className={className} onClick={action.onClick}>
      {action.label}
    </button>
  );
};

const ActionableEmptyState = ({
  icon = '✨',
  eyebrow = 'OptionTrip can keep going',
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = false,
}) => (
  <div className={`aes${compact ? ' aes--compact' : ''}`} role="status">
    <div className="aes__icon" aria-hidden="true">{icon}</div>
    <div className="aes__copy">
      <span className="aes__eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="aes__actions">
          <Action action={primaryAction} primary />
          <Action action={secondaryAction} />
        </div>
      )}
    </div>
  </div>
);

export default ActionableEmptyState;
