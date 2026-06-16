'use client';
import { forwardRef, useId, useState, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react';
import { Icon } from './Icons';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  label: string;
  /** Optional explicit error text — shake + red ring. */
  error?: string;
  /** Show the success tick on blur when the field is non-empty AND has no error. */
  validateOnBlur?: boolean;
  /** Custom validator. Returns null for valid, or an error string. */
  validate?: (value: string) => string | null;
};

/**
 * Modern floating-label input — label sits inside the field at rest and
 * lifts to the top-left on focus or when the field has a value.
 *  - red ring + shake on validation errors
 *  - green tick pop-in on successful blur (when `validateOnBlur` is set)
 */
export const FloatingInput = forwardRef<HTMLInputElement, Props>(
  function FloatingInput(props, ref) {
    const id = useId();
    const {
      label, error, validateOnBlur, validate,
      className = '', onBlur, onChange,
      ...rest
    } = props;

    const [internalError, setInternalError] = useState<string | null>(null);
    const [shaking, setShaking] = useState(false);
    const [touched, setTouched] = useState(false);
    const [value, setValue] = useState((rest.value as string) ?? (rest.defaultValue as string) ?? '');

    const errMsg = error ?? internalError;
    const hasError = !!errMsg;
    const hasValue = value.length > 0;
    const showTick = validateOnBlur && touched && !hasError && hasValue;

    const fireShake = () => {
      setShaking(true);
      setTimeout(() => setShaking(false), 360);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (validate) {
        const v = e.target.value;
        const err = validate(v);
        setInternalError(err);
        if (err) fireShake();
      }
      onBlur?.(e);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (internalError) setInternalError(null);   // forgiving — clear on retype
      onChange?.(e);
    };

    return (
      <div className={`relative ${shaking ? 'voltik-shake' : ''}`}>
        <input
          id={id}
          placeholder=" "
          ref={ref}
          {...rest}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          /* Browser autofill extensions (Edge AutoFill, Bing Wallet,
             FormBoss, etc.) silently inject `fdprocessedid` into every
             form input on first paint. That tripped React's hydration
             check. suppressHydrationWarning is the supported escape
             hatch for exactly this case. */
          suppressHydrationWarning
          className={`peer w-full bg-transparent text-sm text-ink placeholder-transparent
            px-4 pt-5 pb-2 rounded-xl border transition-colors outline-none
            focus:ring-2 focus:ring-brand/50
            ${hasError
              ? 'border-danger focus:border-danger focus:ring-danger/40'
              : 'border-line focus:border-brand'}
            ${className}`}
        />

        {/* Floating label */}
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 transition-all
            text-muted font-medium select-none origin-left
            top-3.5 text-sm
            peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:tracking-wide peer-focus:uppercase peer-focus:font-semibold peer-focus:text-brand
            peer-[:not(:placeholder-shown)]:top-1.5
            peer-[:not(:placeholder-shown)]:text-[10px]
            peer-[:not(:placeholder-shown)]:tracking-wide
            peer-[:not(:placeholder-shown)]:uppercase
            peer-[:not(:placeholder-shown)]:font-semibold
            ${hasError ? 'peer-focus:!text-danger peer-[:not(:placeholder-shown)]:!text-danger' : ''}`}
        >
          {label}
        </label>

        {/* Right-side adornment: success tick or error icon */}
        {(showTick || hasError) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <Icon.close width={16} height={16} className="text-danger" />
            ) : (
              <span className="grid place-items-center h-5 w-5 rounded-full bg-success text-white animate-[tickPop_400ms_cubic-bezier(0.34,1.56,0.64,1)_both]">
                <Icon.check width={11} height={11} strokeWidth={3} />
              </span>
            )}
          </span>
        )}

        {/* Error text */}
        {hasError && (
          <p className="text-xs text-danger mt-1.5 flex items-center gap-1.5 animate-[slidein_180ms_ease-out]">
            <Icon.close width={11} height={11} /> {errMsg}
          </p>
        )}
      </div>
    );
  }
);
