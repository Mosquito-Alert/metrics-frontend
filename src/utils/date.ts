export const subtractDays = (date: string, days: number): string => {
  const resultDate = new Date(date);
  resultDate.setDate(resultDate.getDate() - days);
  return resultDate.toISOString().split('T')[0] as string; // Return date in YYYY-MM-DD format
};

export const getDatesBetween = (start: string, end: string) => {
  const startDate = new Date(start + 'T00:00:00Z'); // force UTC midnight
  const endDate = new Date(end + 'T00:00:00Z'); // force UTC midnight

  const result = {} as Record<number, string>;
  let currentDate = startDate;
  let index = 0;

  while (currentDate.getTime() <= endDate.getTime()) {
    result[index] = currentDate.toISOString().split('T')[0] as string;
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

/**
 * Given a date, returns the index of the day in the year.
 * For example, January 1st is 0, January 2nd is 1, and so on.
 * @param date
 * @returns
 */
export const getDayIndexInYear = (date: any): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1) as any;
  const diffInMs = date - startOfYear;
  const dayIndex = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return dayIndex;
};
