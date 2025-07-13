import React from 'react';
import { Badge } from '@/components/ui/badge';

// Flag emoji mapping for all supported languages (extracted from LanguageCard.tsx)
const FLAG_EMOJIS: Record<string, string> = {
  // English variants
  'en': '🇺🇸', 'en-US': '🇺🇸', 'en-GB': '🇬🇧', 'en-AU': '🇦🇺', 'en-CA': '🇨🇦', 'en-NZ': '🇳🇿',

  // Spanish variants
  'es': '🇪🇸', 'es-ES': '🇪🇸', 'es-MX': '🇲🇽', 'es-AR': '🇦🇷', 'es-CO': '🇨🇴', 'es-CL': '🇨🇱',
  'es-PE': '🇵🇪', 'es-VE': '🇻🇪', 'es-EC': '🇪🇨', 'es-GT': '🇬🇹', 'es-CU': '🇨🇺', 'es-BO': '🇧🇴',
  'es-DO': '🇩🇴', 'es-HN': '🇭🇳', 'es-PY': '🇵🇾', 'es-SV': '🇸🇻', 'es-NI': '🇳🇮', 'es-CR': '🇨🇷',
  'es-PA': '🇵🇦', 'es-UY': '🇺🇾', 'es-PR': '🇵🇷',

  // French variants
  'fr': '🇫🇷', 'fr-FR': '🇫🇷', 'fr-CA': '🇨🇦', 'fr-BE': '🇧🇪', 'fr-CH': '🇨🇭', 'fr-LU': '🇱🇺',
  'fr-MC': '🇲🇨', 'fr-SN': '🇸🇳', 'fr-CI': '🇨🇮', 'fr-ML': '🇲🇱', 'fr-BF': '🇧🇫', 'fr-NE': '🇳🇪',
  'fr-TG': '🇹🇬', 'fr-BJ': '🇧🇯', 'fr-MG': '🇲🇬', 'fr-CM': '🇨🇲', 'fr-CF': '🇨🇫', 'fr-TD': '🇹🇩',
  'fr-CG': '🇨🇬', 'fr-GA': '🇬🇦', 'fr-DJ': '🇩🇯', 'fr-KM': '🇰🇲', 'fr-VU': '🇻🇺', 'fr-PF': '🇵🇫',
  'fr-NC': '🇳🇨', 'fr-WF': '🇼🇫', 'fr-RE': '🇷🇪', 'fr-YT': '🇾🇹', 'fr-GP': '🇬🇵', 'fr-MQ': '🇲🇶',
  'fr-GF': '🇬🇫', 'fr-PM': '🇵🇲', 'fr-BL': '🇧🇱', 'fr-MF': '🇲🇫',

  // German variants
  'de': '🇩🇪', 'de-DE': '🇩🇪', 'de-AT': '🇦🇹', 'de-CH': '🇨🇭', 'de-LU': '🇱🇺', 'de-LI': '🇱🇮',

  // Italian variants
  'it': '🇮🇹', 'it-IT': '🇮🇹', 'it-CH': '🇨🇭', 'it-SM': '🇸🇲', 'it-VA': '🇻🇦',

  // Portuguese variants
  'pt': '🇵🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷', 'pt-AO': '🇦🇴', 'pt-MZ': '🇲🇿', 'pt-GW': '🇬🇼',
  'pt-CV': '🇨🇻', 'pt-ST': '🇸🇹', 'pt-TL': '🇹🇱', 'pt-MO': '🇲🇴',

  // Dutch variants
  'nl': '🇳🇱', 'nl-NL': '🇳🇱', 'nl-BE': '🇧🇪', 'nl-SR': '🇸🇷', 'nl-AW': '🇦🇼', 'nl-CW': '🇨🇼',
  'nl-SX': '🇸🇽', 'nl-BQ': '🇧🇶',

  // Chinese variants
  'zh': '🇨🇳', 'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼', 'zh-HK': '🇭🇰', 'zh-MO': '🇲🇴', 'zh-SG': '🇸🇬',

  // Arabic variants
  'ar': '🇸🇦', 'ar-SA': '🇸🇦', 'ar-EG': '🇪🇬', 'ar-AE': '🇦🇪', 'ar-JO': '🇯🇴', 'ar-LB': '🇱🇧',
  'ar-SY': '🇸🇾', 'ar-IQ': '🇮🇶', 'ar-KW': '🇰🇼', 'ar-QA': '🇶🇦', 'ar-BH': '🇧🇭', 'ar-OM': '🇴🇲',
  'ar-YE': '🇾🇪', 'ar-MA': '🇲🇦', 'ar-TN': '🇹🇳', 'ar-DZ': '🇩🇿', 'ar-LY': '🇱🇾', 'ar-SD': '🇸🇩',
  'ar-MR': '🇲🇷', 'ar-SO': '🇸🇴', 'ar-DJ': '🇩🇯', 'ar-KM': '🇰🇲', 'ar-TD': '🇹🇩', 'ar-ER': '🇪🇷',

  // Japanese
  'ja': '🇯🇵', 'ja-JP': '🇯🇵',

  // Korean
  'ko': '🇰🇷', 'ko-KR': '🇰🇷', 'ko-KP': '🇰🇵',

  // Russian variants
  'ru': '🇷🇺', 'ru-RU': '🇷🇺', 'ru-BY': '🇧🇾', 'ru-KZ': '🇰🇿', 'ru-KG': '🇰🇬', 'ru-MD': '🇲🇩',
  'ru-UA': '🇺🇦', 'ru-UZ': '🇺🇿', 'ru-TJ': '🇹🇯', 'ru-TM': '🇹🇲', 'ru-AM': '🇦🇲', 'ru-AZ': '🇦🇿',
  'ru-GE': '🇬🇪', 'ru-LT': '🇱🇹', 'ru-LV': '🇱🇻', 'ru-EE': '🇪🇪',

  // Hindi and Indian languages
  'hi': '🇮🇳', 'hi-IN': '🇮🇳', 'bn': '🇧🇩', 'bn-BD': '🇧🇩', 'bn-IN': '🇮🇳',
  'te': '🇮🇳', 'mr': '🇮🇳', 'ta': '🇮🇳', 'gu': '🇮🇳', 'kn': '🇮🇳', 'ml': '🇮🇳',
  'pa': '🇮🇳', 'or': '🇮🇳', 'as': '🇮🇳', 'ur': '🇵🇰', 'ur-PK': '🇵🇰', 'ur-IN': '🇮🇳',

  // Nordic languages
  'sv': '🇸🇪', 'sv-SE': '🇸🇪', 'sv-FI': '🇫🇮',
  'no': '🇳🇴', 'nb': '🇳🇴', 'nn': '🇳🇴', 'no-NO': '🇳🇴', 'nb-NO': '🇳🇴', 'nn-NO': '🇳🇴',
  'da': '🇩🇰', 'da-DK': '🇩🇰', 'da-GL': '🇬🇱',
  'fi': '🇫🇮', 'fi-FI': '🇫🇮',
  'is': '🇮🇸', 'is-IS': '🇮🇸',

  // Other European languages
  'pl': '🇵🇱', 'pl-PL': '🇵🇱',
  'cs': '🇨🇿', 'cs-CZ': '🇨🇿',
  'sk': '🇸🇰', 'sk-SK': '🇸🇰',
  'hu': '🇭🇺', 'hu-HU': '🇭🇺',
  'ro': '🇷🇴', 'ro-RO': '🇷🇴', 'ro-MD': '🇲🇩',
  'bg': '🇧🇬', 'bg-BG': '🇧🇬',
  'hr': '🇭🇷', 'hr-HR': '🇭🇷',
  'sr': '🇷🇸', 'sr-RS': '🇷🇸', 'sr-BA': '🇧🇦', 'sr-ME': '🇲🇪',
  'bs': '🇧🇦', 'bs-BA': '🇧🇦',
  'sl': '🇸🇮', 'sl-SI': '🇸🇮',
  'mk': '🇲🇰', 'mk-MK': '🇲🇰',
  'sq': '🇦🇱', 'sq-AL': '🇦🇱', 'sq-XK': '🇽🇰', 'sq-MK': '🇲🇰',
  'el': '🇬🇷', 'el-GR': '🇬🇷', 'el-CY': '🇨🇾',
  'tr': '🇹🇷', 'tr-TR': '🇹🇷', 'tr-CY': '🇨🇾',
  'mt': '🇲🇹', 'mt-MT': '🇲🇹',
  'cy': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'cy-GB': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'ga': '🇮🇪', 'ga-IE': '🇮🇪',
  'gd': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'gd-GB': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'eu': '🏴󠁥󠁳󠁰󠁶󠁿', 'eu-ES': '🏴󠁥󠁳󠁰󠁶󠁿',
  'ca': '🏴󠁥󠁳󠁣󠁴󠁿', 'ca-ES': '🏴󠁥󠁳󠁣󠁴󠁿', 'ca-AD': '🇦🇩', 'ca-FR': '🇫🇷', 'ca-IT': '🇮🇹',
  'gl': '🏴󠁥󠁳󠁧󠁡󠁿', 'gl-ES': '🏴󠁥󠁳󠁧󠁡󠁿',
  'br': '🏴󠁦󠁲󠁢󠁲󠁥󠁿', 'br-FR': '🏴󠁦󠁲󠁢󠁲󠁥󠁿',

  // Sign languages
  'asl': '🤟🇺🇸', 'bsl': '🤟🇬🇧', 'fsl': '🤟🇫🇷', 'gsl': '🤟🇩🇪', 'jsl': '🤟🇯🇵',

  // Default fallback
  'unknown': '🏳️'
};

/**
 * Get flag emoji for a language code
 */
export const getLanguageFlag = (languageCode: string): string => {
  // Try exact match first
  if (FLAG_EMOJIS[languageCode]) {
    return FLAG_EMOJIS[languageCode];
  }

  // Try base language code (e.g., 'en' from 'en-US')
  const baseCode = languageCode.split('-')[0];
  if (FLAG_EMOJIS[baseCode]) {
    return FLAG_EMOJIS[baseCode];
  }

  // Default fallback
  return FLAG_EMOJIS.unknown;
};

/**
 * Language display variants
 */
export type LanguageDisplayVariant = 'minimal' | 'compact' | 'full' | 'badge';

interface LanguageDisplayProps {
  languageCode: string;
  languageName?: string;
  variant?: LanguageDisplayVariant;
  className?: string;
  showRTL?: boolean;
}

/**
 * LanguageDisplay component for consistent flag + code + name display
 */
export function LanguageDisplay({ 
  languageCode, 
  languageName, 
  variant = 'compact',
  className = '',
  showRTL = false
}: LanguageDisplayProps) {
  const flag = getLanguageFlag(languageCode);
  const upperCode = languageCode.toUpperCase();

  // RTL languages
  const isRTL = ['ar', 'he', 'fa', 'ur', 'ps', 'ku', 'ckb'].some(code => 
    languageCode.startsWith(code)
  );

  switch (variant) {
    case 'minimal':
      return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span className="text-lg" role="img" aria-label={`${languageName || upperCode} flag`}>
            {flag}
          </span>
        </span>
      );

    case 'compact':
      return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
          <span className="text-lg" role="img" aria-label={`${languageName || upperCode} flag`}>
            {flag}
          </span>
          <span className="font-mono text-sm font-medium">{upperCode}</span>
          {showRTL && isRTL && (
            <span className="text-xs text-muted-foreground" title="Right-to-left language">
              RTL
            </span>
          )}
        </span>
      );

    case 'full':
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          <span className="text-lg" role="img" aria-label={`${languageName || upperCode} flag`}>
            {flag}
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-medium">{upperCode}</span>
            {languageName && (
              <span className="text-xs text-muted-foreground">{languageName}</span>
            )}
          </div>
          {showRTL && isRTL && (
            <Badge variant="outline" className="text-xs">
              RTL
            </Badge>
          )}
        </div>
      );

    case 'badge':
      return (
        <Badge variant="outline" className={`inline-flex items-center gap-1 ${className}`}>
          <span className="text-sm" role="img" aria-label={`${languageName || upperCode} flag`}>
            {flag}
          </span>
          <span className="font-mono text-xs">{upperCode}</span>
          {showRTL && isRTL && (
            <span className="text-xs opacity-70">RTL</span>
          )}
        </Badge>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
          <span className="text-lg" role="img" aria-label={`${languageName || upperCode} flag`}>
            {flag}
          </span>
          <span className="font-mono text-sm">{upperCode}</span>
        </span>
      );
  }
}

/**
 * Language dropdown option component
 */
interface LanguageOptionProps {
  languageCode: string;
  languageName: string;
  nativeName?: string;
  isDefault?: boolean;
  className?: string;
}

export const LanguageOption = function LanguageOption({ 
  languageCode, 
  languageName, 
  nativeName, 
  isDefault = false,
  className = ''
}: LanguageOptionProps) {
  const flag = getLanguageFlag(languageCode);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-lg flex-shrink-0" role="img" aria-label={`${languageName} flag`}>
        {flag}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{languageName}</span>
          {isDefault && (
            <Badge variant="secondary" className="text-xs">
              Default
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{languageCode.toUpperCase()}</span>
          {nativeName && nativeName !== languageName && (
            <>
              <span>•</span>
              <span>{nativeName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 