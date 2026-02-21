import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => (date ? format(new Date(date), 'PP') : '');
export const formatDateTime = (date) => (date ? format(new Date(date), 'PPp') : '');
export const formatRelative = (date) => (date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '');
