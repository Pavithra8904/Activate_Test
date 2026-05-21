import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import './StatsCard.scss';

const getAccentShade = (hexColor, factor = 0.2) => {
  const normalized = String(hexColor).replace('#', '');
  const hex = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const intValue = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, Math.floor(((intValue >> 16) & 0xff) * (1 - factor))));
  const g = Math.max(0, Math.min(255, Math.floor(((intValue >> 8) & 0xff) * (1 - factor))));
  const b = Math.max(0, Math.min(255, Math.floor((intValue & 0xff) * (1 - factor))));
  return `rgb(${r}, ${g}, ${b})`;
};

const StatsCard = ({ title, value, color = '#2f80ed', link = '/tables', navigationState, trendText = '', trendPositive = true, icon: Icon = BarChart3, tooltipContent }) => {
  const navigate = useNavigate();
  const accentDark = getAccentShade(color);

  const handleClick = () => {
    if (link) {
      navigate(link, navigationState ? { state: navigationState } : undefined);
    }
  };

  const handleKeyDown = (event) => {
    if (link && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      navigate(link, navigationState ? { state: navigationState } : undefined);
    }
  };
  return (
    <div
      className="stats-card stats-card--clickable"
      style={{ '--accent': color, '--accent-dark': accentDark }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="stats-card__header">
        <span className="stats-card__badge" aria-hidden="true">
          <Icon size={18} />
        </span>
        <span className="stats-card__label">{title}</span>
      </div>
      <div className="stats-card__body">
        <h2>{value}</h2>
      </div>
      {tooltipContent && (
        <div className="stats-card__tooltip">
          {tooltipContent}
        </div>
      )}
      {trendText && (
        <div className={`stats-card__footer ${trendPositive ? 'positive' : 'negative'}`}>
          {trendPositive ? (
            <ArrowUp size={14} className="stats-card__footer-icon" />
          ) : (
            <ArrowDown size={14} className="stats-card__footer-icon" />
          )}
          <span>{trendText}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
