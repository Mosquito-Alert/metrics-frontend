export const subtractDays = (date: string, days: number): string => {
  const resultDate = new Date(date);
  resultDate.setDate(resultDate.getDate() - days);
  return resultDate.toISOString().split('T')[0] as string; // Return date in YYYY-MM-DD format
};

export const getDatesBetween = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const result = {} as Record<number, string>;
  let currentDate = startDate;
  let index = 0;

  while (currentDate <= endDate) {
    result[index] = currentDate.toISOString().split('T')[0] as string;
    currentDate.setDate(currentDate.getDate() + 1);
    index++;
  }

  return result;
};

export const formattedDate = (date: string) => {
  const newDate = new Date(date);
  return newDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
