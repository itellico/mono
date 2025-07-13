import { useState, useEffect } from 'react';

export const useLanguageManagement = () => { return { languages: [], isLoading: false }; };

export const useAddSupportedLanguage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error, isSuccess };
};

export const useUpdateSupportedLanguage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutate = async (data: any) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSuccess(true);
    } catch (err: any) {
      setError(err);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error, isSuccess };
};
