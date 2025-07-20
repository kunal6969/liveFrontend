
import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black transition-all duration-200 ease-in-out transform flex items-center justify-center shadow-lg hover:scale-[1.03] active:scale-[0.98]';
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500 shadow-indigo-500/30 hover:shadow-lg',
    secondary: 'bg-white/90 text-slate-800 hover:bg-white focus:ring-indigo-500 border border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 dark:border-white/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-black/5 hover:text-slate-900 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
  };

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabled || isLoading ? 'opacity-60 cursor-not-allowed !scale-100' : ''} ${className}`;

  return (
    <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, id, error, icon, className = '', ...props }) => {
  const baseInputClasses = "mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-black/20 border border-slate-300/70 dark:border-white/20 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition hover:border-indigo-400/70";
  const errorInputClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  const iconPadding = icon ? "pl-10" : "";

  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input id={id} className={`${baseInputClasses} ${error ? errorInputClasses : ''} ${iconPadding} ${className}`} {...props} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className = '', ...props }) => {
  const baseTextareaClasses = "mt-1 block w-full px-3 py-2 bg-white/80 dark:bg-black/20 border border-slate-300/70 dark:border-white/20 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 sm:text-sm transition hover:border-indigo-400/70";
  const errorTextareaClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      <textarea id={id} className={`${baseTextareaClasses} ${error ? errorTextareaClasses : ''} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};


interface SelectProps {
  label?: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  id?: string;
  error?: string;
  className?: string;
  buttonClassName?: string;
  required?: boolean;
  disabled?: boolean;
  isGradeSelect?: boolean; // New prop to identify grade selects
}

export const Select: React.FC<SelectProps> = ({ label, id, error, options, value, onChange, className = '', buttonClassName = '', placeholder, icon, required, disabled, isGradeSelect = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder || 'Select...';

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced styling for grade selection
  const getGradeColor = (gradeValue: string) => {
    const grade = parseFloat(gradeValue);
    if (grade >= 9) return 'text-emerald-400';
    if (grade >= 7) return 'text-cyan-400';
    if (grade >= 5) return 'text-yellow-400';
    if (grade >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeBgColor = (gradeValue: string) => {
    const grade = parseFloat(gradeValue);
    if (grade >= 9) return 'bg-emerald-500/10 border-emerald-500/30';
    if (grade >= 7) return 'bg-cyan-500/10 border-cyan-500/30';
    if (grade >= 5) return 'bg-yellow-500/10 border-yellow-500/30';
    if (grade >= 4) return 'bg-orange-500/10 border-orange-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className={`w-full ${className}`} ref={selectRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          className={`relative w-full cursor-default rounded-lg py-3 pl-4 pr-12 text-left shadow-lg border-2 transition-all duration-200 ease-out ${
            selectedOption && isGradeSelect
              ? `${getGradeBgColor(selectedOption.value)} ${getGradeColor(selectedOption.value)} font-semibold` 
              : selectedOption
              ? 'bg-slate-800/50 border-slate-600 text-slate-200 font-medium'
              : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-cyan-500/50'
          } ${error ? 'border-red-500/50 bg-red-500/10' : ''} ${
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
          } ${isOpen ? 'ring-2 ring-cyan-500/50 border-cyan-500' : ''} ${buttonClassName}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
        >
          {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">{icon}</span>}
          <span className={`block truncate text-base ${icon ? 'ml-6' : ''}`}>
            {selectedOption ? (
              isGradeSelect ? (
                <span className="flex items-center gap-2">
                  <span className="font-bold">{selectedOption.label.split(' - ')[0]}</span>
                  <span className="text-sm opacity-80">({selectedOption.label.split(' - ')[1]})</span>
                </span>
              ) : (
                <span>{selectedOption.label}</span>
              )
            ) : (
              <span className="italic">{selectedLabel}</span>
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg 
              className={`h-6 w-6 transition-all duration-300 ${
                isOpen ? 'rotate-180 text-cyan-400' : 'rotate-0 text-slate-500'
              } ${selectedOption && isGradeSelect ? getGradeColor(selectedOption.value) : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 shadow-2xl animate-pop-in">
            <div className="py-2">
              {placeholder && !options.some(opt => opt.value === '') && (
                <div
                  onClick={() => handleSelect('')}
                  className="text-slate-400 relative cursor-pointer select-none py-3 px-4 transition-all duration-200 hover:bg-slate-700/50 hover:text-slate-300 rounded-lg mx-2 italic"
                >
                  <span className="text-sm">{placeholder}</span>
                </div>
              )}
              {options.map((option, index) => {
                const isSelected = value === option.value;
                
                if (isGradeSelect) {
                  // Grade-specific rendering
                  const gradeInfo = option.label.split(' - ');
                  const gradeLetter = gradeInfo[0];
                  const gradePoints = gradeInfo[1];
                  
                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`dropdown-option relative cursor-pointer select-none py-3 px-4 mx-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] ${
                        isSelected 
                          ? `${getGradeBgColor(option.value)} ${getGradeColor(option.value)} shadow-lg border ${getGradeBgColor(option.value).split(' ')[1]}` 
                          : `text-slate-300 hover:bg-slate-700/50 hover:${getGradeColor(option.value)} hover:shadow-md`
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg ${isSelected ? getGradeColor(option.value) : 'text-slate-200'}`}>
                            {gradeLetter}
                          </span>
                          <span className={`text-sm font-medium ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                            Grade Point: {gradePoints}
                          </span>
                        </div>
                        {isSelected && (
                          <svg className={`w-5 h-5 ${getGradeColor(option.value)}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // Regular option rendering (for room listing, hostels, etc.)
                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`dropdown-option relative cursor-pointer select-none py-3 px-4 mx-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-cyan-300 shadow-lg border border-cyan-500/30' 
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-cyan-300 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">
                          {option.label}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-r-2 border-purple-500 border-l-indigo-500 ${sizeClasses[size]} ${className}`}></div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-modal-backdrop" onClick={onClose}>
      <div 
        className={`bg-white/95 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl p-6 m-4 w-full animate-modal-content ${sizeClasses[size]}`}
        onClick={e => e.stopPropagation()} 
      >
        {title && (
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/90 dark:border-white/15">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="text-slate-700 dark:text-slate-300">{children}</div>
        {footer && <div className="mt-6 pt-4 border-t border-slate-200/90 dark:border-white/15 flex justify-end space-x-3">{footer}</div>}
      </div>
    </div>
  );
};

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string; 
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message, onClose, className = '' }) => {
  const baseClasses = "p-4 mb-4 text-sm rounded-lg flex justify-between items-start border shadow-md";
  const typeClasses = {
    success: "bg-green-100/80 border-green-300 text-green-900 dark:bg-green-900/40 dark:border-green-700/50 dark:text-green-200",
    error: "bg-red-100/80 border-red-300 text-red-900 dark:bg-red-900/40 dark:border-red-700/50 dark:text-red-200",
    warning: "bg-yellow-100/80 border-yellow-300 text-yellow-900 dark:bg-yellow-800/40 dark:border-yellow-600/50 dark:text-yellow-200",
    info: "bg-blue-100/80 border-blue-300 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700/50 dark:text-blue-200",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`} role="alert">
      <div className="flex">
        <span className="font-medium mr-2">{message}</span>
      </div>
      {onClose && (
        <button 
            type="button" 
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8"
            onClick={onClose}
            aria-label="Close"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      )}
    </div>
  );
};

const IconBaseSmall: React.FC<{className?: string, children: ReactNode}> = ({className, children}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 text-slate-400 dark:text-slate-500 ${className || ''}`}>
        {children}
    </svg>
);


export const AtSymbolIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
  </IconBaseSmall>
);

export const LockClosedIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </IconBaseSmall>
);

export const MessageIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </IconBaseSmall>
);

export const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </IconBaseSmall>
);

export const UserCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconBaseSmall>
);

export const IdCardIcon: React.FC<{className?: string}> = ({className}) => (
    <IconBaseSmall className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6H6v12H3.75V6zM3.75 6A2.25 2.25 0 001.5 8.25v7.5A2.25 2.25 0 003.75 18h2.25A2.25 2.25 0 008.25 15.75v-7.5A2.25 2.25 0 006 3.75H3.75z" />
    </IconBaseSmall>
);

export const TagIcon: React.FC<{className?: string}> = ({className}) => (
    <IconBaseSmall className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </IconBaseSmall>
);

export const UsersIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 0112 15v-2.25A3.75 3.75 0 0115.75 9v-2.25A3.75 3.75 0 0112 3V4.5m-7.5 4.5M12 12.75a3 3 0 01-3-3v-1.5a3 3 0 013-3v1.5a3 3 0 013 3v1.5a3 3 0 01-3 3m-3.75 2.25A3.75 3.75 0 0112 18v-2.25a3.75 3.75 0 013.75-3.75V15m-7.5-3v3.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V12m-4.5 0V9A3.75 3.75 0 0112 5.25v1.5A3.75 3.75 0 0115.75 9V12m0-3h-1.5M12 9h1.5" />
  </IconBaseSmall>
);

export const ImageIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </IconBaseSmall>
);

export const ChartBarIcon: React.FC<{className?: string}> = ({className}) => (
  <IconBaseSmall className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </IconBaseSmall>
);
