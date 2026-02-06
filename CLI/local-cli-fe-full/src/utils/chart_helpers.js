export const cleanNullData = (chartObj) => {
  // LLM likes to generate chart option fields that are sometimes null
  // NULL fields are NOT supported from Chart.js
  if (Array.isArray(chartObj)) {
    return chartObj
      .map(cleanNullData)
      .filter(item => item !== null);
  } else if (chartObj && typeof chartObj === "object") {
    return Object.entries(chartObj)
      .reduce((acc, [key, value]) => {
        const cleanedValue = cleanNullData(value);
        if (cleanedValue !== null) {
          acc[key] = cleanedValue;
        }
        return acc;
      }, {});
  } else {
    return chartObj === null ? null : chartObj;
  }
}
