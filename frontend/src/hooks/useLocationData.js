// src/hooks/useLocationData.js
import { useState, useEffect } from 'react';
import { statesAndCities } from '../data/locations';

export default function useLocationData() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Load states from static data
    setStates(Object.keys(statesAndCities));
  }, []);

  const fetchCitiesByState = (state) => {
    setCities(statesAndCities[state] || []);
  };

  return { states, cities, fetchCitiesByState };
}
