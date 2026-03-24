import { arTexts } from './ar';

export { arTexts };

export function getLocaleText(key: string, defaultValue?: string): string {
  return arTexts[key] || defaultValue || key;
}

export function getLocaleTextWithVars(
  key: string,
  variables: Record<string, string | number>,
  defaultValue?: string
): string {
  let text = getLocaleText(key, defaultValue);

  Object.entries(variables).forEach(([varKey, value]) => {
    text = text.replace(new RegExp(`\{${varKey}\}`, 'g'), String(value));
  });

  return text;
}
