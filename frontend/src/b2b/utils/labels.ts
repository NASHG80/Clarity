export const getLocalizedLabel = (label: string, t: any): string => {
  // Check if we have a translation key for this canonical label
  const translationKey = `labels.${label}`;
  
  // If translation exists (checked by falling back to empty string and verifying)
  const translation = t(translationKey, { defaultValue: '' });
  if (translation) {
    return translation;
  }

  // Fallback to formatting the raw label in English if no explicit translation exists
  return label
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Step Free', 'Step-free')
    .replace('Roll In', 'Roll-in');
};
