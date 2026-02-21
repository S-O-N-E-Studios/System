// Form validation helpers
export const required = (value) => (value ? undefined : 'Required');
export const email = (value) =>
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ? undefined : 'Invalid email';
