/**
 * useForm — lightweight form state + validation hook.
 *
 * Usage:
 *   const { values, errors, onChange, validate, reset } = useForm(
 *     { name: '', email: '' },
 *     {
 *       name:  v => !v.trim() ? 'Name is required' : null,
 *       email: v => !/\S+@\S+\.\S+/.test(v) ? 'Invalid email' : null,
 *     }
 *   );
 *
 * - onChange(field, value) clears that field's error immediately.
 * - validate() runs all rules; returns true if all pass.
 * - reset() restores initialValues and clears all errors.
 */
import { useState, useCallback } from 'react';

export function useForm(initialValues, rules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const onChange = useCallback((field, value) => {
    setValues(v => ({ ...v, [field]: value }));
    if (errors[field]) {
      setErrors(e => ({ ...e, [field]: null }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {};
    for (const [field, rule] of Object.entries(rules)) {
      const msg = rule(values[field], values);
      if (msg) newErrors[field] = msg;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, rules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { values, errors, onChange, validate, reset, setValues };
}
