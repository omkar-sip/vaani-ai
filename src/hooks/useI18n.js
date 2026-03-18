import { useUserStore } from '../stores/useUserStore';
import { getLanguageConfig, translate } from '../i18n';

export function useI18n() {
  const language = useUserStore((s) => s.profile?.language || 'en');
  const config = getLanguageConfig(language);

  return {
    language,
    languageConfig: config,
    t: (key) => translate(language, key),
  };
}
