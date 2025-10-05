/**
 * Date formatting utilities for consistent YYYY-MM-DD format across the application
 */

/**
 * Formats a date string or Date object to YYYY-MM-DD format
 * @param dateInput - Date string or Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateToYYYYMMDD = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Formats a date string or Date object to YYYY-MM-DD HH:MM format
 * @param dateInput - Date string or Date object
 * @returns Formatted date string in YYYY-MM-DD HH:MM format
 */
export const formatDateTimeToYYYYMMDD = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const datePart = date.toISOString().split('T')[0];
  const timePart = date.toTimeString().slice(0, 5); // HH:MM format
  
  return `${datePart} ${timePart}`;
};

/**
 * Formats a date string or Date object to YYYY-MM-DD HH:MM:SS format
 * @param dateInput - Date string or Date object
 * @returns Formatted date string in YYYY-MM-DD HH:MM:SS format
 */
export const formatFullDateTimeToYYYYMMDD = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const datePart = date.toISOString().split('T')[0];
  const timePart = date.toTimeString().slice(0, 8); // HH:MM:SS format
  
  return `${datePart} ${timePart}`;
};

/**
 * Formats a date string or Date object to HH:MM format (time only)
 * @param dateInput - Date string or Date object
 * @returns Formatted time string in HH:MM format
 */
export const formatTimeToHHMM = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toTimeString().slice(0, 5); // HH:MM format
};