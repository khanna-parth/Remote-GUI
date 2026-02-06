export const parseTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));

  return formattedDate;
}
