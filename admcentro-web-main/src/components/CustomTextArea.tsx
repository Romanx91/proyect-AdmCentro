import { useState } from 'react';
import FormError from './FormError';

type Props = {
  placeholder: string;
  onChange: (val: string) => void;
  className?: string;
  initialValue?: string;
  maxLength?: number | undefined
  minLength?: number | undefined
  label?: string
  required?: boolean
  hasError?: boolean
  errorText?: string
  optional?: boolean
  name?: string
};

const CustomTextArea = (
  { initialValue = '',
    placeholder,
    onChange,
    className = '',
    label = undefined,
    name = undefined,
    required = false,
    hasError = false,
    maxLength = undefined,
    minLength = undefined,
    errorText = 'El campo es obligatorio',
    optional = false
  }: Props) => {
  const [value, setValue] = useState<string>(initialValue);

  return (
    <fieldset>
      {label && (<label htmlFor={label?.replaceAll(' ', '_')}>{label} {optional && (<span className='text-xs opacity-50'>(opcional)</span>)}</label>)}
      <textarea
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        className={`dark:!bg-gray-900 dark:text-slate-400 border !border-gray-300 !shadow dark:!border-slate-700 ${className}`}
        value={value}
        maxLength={maxLength}
        required={required}
        minLength={minLength}
        name={!!name ? name : label?.replaceAll(' ', '_')}
        placeholder={placeholder}
      />
      {hasError && <FormError text={errorText} />}

    </fieldset>
  );
};

export default CustomTextArea;
