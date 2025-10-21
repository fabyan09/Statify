import { useEffect, useState } from 'react';

/**
 * Hook pour debouncer une valeur
 * Attend `delay` ms après le dernier changement avant de mettre à jour
 *
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (défaut: 500ms)
 * @returns La valeur debouncée
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * // debouncedSearchTerm sera mis à jour 500ms après que l'utilisateur
 * // ait arrêté de taper dans l'input
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set un timeout pour mettre à jour la valeur debouncée
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: annule le timeout si value change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
