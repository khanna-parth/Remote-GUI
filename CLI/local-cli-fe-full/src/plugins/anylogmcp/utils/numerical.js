export const parseTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));

  return formattedDate;
}

export const  generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}