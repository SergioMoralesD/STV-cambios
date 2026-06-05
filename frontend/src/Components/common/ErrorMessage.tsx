import './ErrorMessage.css';

export interface ErrorMessageProps {
  message: string;
  onClear: () => void;
}

export default function ErrorMessage({ message, onClear }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="error-message-overlay">
      <div className="error-message-card">
        <div className="error-message-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="error-message-content">
          <h3>Error de Sistema</h3>
          <p>{message}</p>
        </div>
        <button type="button" className="error-message-close" onClick={onClear}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
