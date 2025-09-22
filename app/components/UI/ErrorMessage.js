'use client';

const ErrorMessage = ({ 
  title = 'Error', 
  message, 
  error,
  onRetry, 
  onReport,
  showDetails = false,
  variant = 'default',
  className = '' 
}) => {
  const variants = {
    default: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      secondaryButton: 'bg-gray-600 hover:bg-gray-700 text-white'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      secondaryButton: 'bg-gray-600 hover:bg-gray-700 text-white'
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondaryButton: 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  };

  const style = variants[variant];

  const getErrorIcon = () => {
    switch (variant) {
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatErrorMessage = (err) => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    if (err?.error) return err.error;
    return 'An unexpected error occurred';
  };

  const displayMessage = message || formatErrorMessage(error) || 'Something went wrong';

  return (
    <div className={`border rounded-lg p-6 ${style.container} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${style.icon}`}>
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.title}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${style.message}`}>
            <p>{displayMessage}</p>
          </div>
          
          {showDetails && error && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className={`text-xs cursor-pointer hover:underline ${style.message}`}>
                Show technical details (development only)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                <pre className="whitespace-pre-wrap">
                  {error?.stack || JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </details>
          )}
          
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${style.button}`}
              >
                Try Again
              </button>
            )}
            
            {onReport && (
              <button
                onClick={onReport}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${style.secondaryButton}`}
              >
                Report Issue
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${style.secondaryButton}`}
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NetworkError = ({ onRetry }) => (
  <ErrorMessage
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    variant="warning"
  />
);

export const NotFoundError = ({ resource = 'resource', onRetry }) => (
  <ErrorMessage
    title="Not Found"
    message={`The requested ${resource} could not be found.`}
    onRetry={onRetry}
    variant="info"
  />
);

export const PermissionError = ({ onRetry }) => (
  <ErrorMessage
    title="Permission Denied"
    message="You don't have permission to access this resource."
    onRetry={onRetry}
    variant="warning"
  />
);

export const ServerError = ({ onRetry, onReport }) => (
  <ErrorMessage
    title="Server Error"
    message="An internal server error occurred. Our team has been notified."
    onRetry={onRetry}
    onReport={onReport}
    variant="default"
  />
);

export default ErrorMessage;