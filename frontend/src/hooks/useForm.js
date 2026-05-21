import { useState } from 'react';

export const useForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (name, value) => {
    setValues({ ...values, [name]: value });
    // Effacer l'erreur du champ lorsqu'il est modifié
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const resetForm = () => setValues(initialValues);

  const setFieldError = (name, message) => {
    setErrors({ ...errors, [name]: message });
  };

  return { values, errors, handleChange, resetForm, setFieldError, setErrors };
};