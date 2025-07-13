'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flag, Star, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Props for the LanguageCard component
 * @interface LanguageCardProps
 */
interface LanguageCardProps {
  /** Language data with statistics */
  language: {
    /** Language code (e.g., 'en-US', 'de-DE') */
    code: string;
    /** Human-readable language name */
    name: string;
    /** Native language name */
    nativeName: string;
    /** Whether this is the default language */
    isDefault: boolean;
    /** Total number of translations */
    totalTranslations: number;
    /** Number of completed translations */
    completedTranslations: number;
    /** Number of translations pending review */
    pendingReview: number;
    /** Number of auto-translated strings */
    autoTranslated: number;
    /** Completion percentage (0-100) */
    completionPercentage: number;
  };
  /** Callback function when opening the translation editor */
  onOpenEditor: (languageCode: string) => void;
}

// Flag emoji mapping for all supported languages
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
  'co': '🇫🇷', 'co-FR': '🇫🇷',
  'oc': '🇫🇷', 'oc-FR': '🇫🇷',
  'rm': '🇨🇭', 'rm-CH': '🇨🇭',
  'fur': '🇮🇹', 'fur-IT': '🇮🇹',
  'sc': '🇮🇹', 'sc-IT': '🇮🇹',
  'lld': '🇮🇹', 'lld-IT': '🇮🇹',

  // Baltic languages
  'lt': '🇱🇹', 'lt-LT': '🇱🇹',
  'lv': '🇱🇻', 'lv-LV': '🇱🇻',
  'et': '🇪🇪', 'et-EE': '🇪🇪',

  // Other languages
  'he': '🇮🇱', 'he-IL': '🇮🇱',
  'fa': '🇮🇷', 'fa-IR': '🇮🇷', 'fa-AF': '🇦🇫',
  'th': '🇹🇭', 'th-TH': '🇹🇭',
  'vi': '🇻🇳', 'vi-VN': '🇻🇳',
  'id': '🇮🇩', 'id-ID': '🇮🇩',
  'ms': '🇲🇾', 'ms-MY': '🇲🇾', 'ms-BN': '🇧🇳', 'ms-SG': '🇸🇬',
  'tl': '🇵🇭', 'tl-PH': '🇵🇭', 'fil': '🇵🇭', 'fil-PH': '🇵🇭',
  'sw': '🇹🇿', 'sw-TZ': '🇹🇿', 'sw-KE': '🇰🇪', 'sw-UG': '🇺🇬', 'sw-RW': '🇷🇼',
  'am': '🇪🇹', 'am-ET': '🇪🇹',
  'ha': '🇳🇬', 'ha-NG': '🇳🇬', 'ha-NE': '🇳🇪', 'ha-GH': '🇬🇭',
  'yo': '🇳🇬', 'yo-NG': '🇳🇬', 'yo-BJ': '🇧🇯',
  'ig': '🇳🇬', 'ig-NG': '🇳🇬',
  'zu': '🇿🇦', 'zu-ZA': '🇿🇦',
  'xh': '🇿🇦', 'xh-ZA': '🇿🇦',
  'af': '🇿🇦', 'af-ZA': '🇿🇦', 'af-NA': '🇳🇦',
  'st': '🇿🇦', 'st-ZA': '🇿🇦', 'st-LS': '🇱🇸',
  'tn': '🇿🇦', 'tn-ZA': '🇿🇦', 'tn-BW': '🇧🇼',
  'ss': '🇿🇦', 'ss-ZA': '🇿🇦', 'ss-SZ': '🇸🇿',
  've': '🇿🇦', 've-ZA': '🇿🇦',
  'nr': '🇿🇦', 'nr-ZA': '🇿🇦',
  'ts': '🇿🇦', 'ts-ZA': '🇿🇦', 'ts-MZ': '🇲🇿',

  // Additional Asian languages
  'my': '🇲🇲', 'my-MM': '🇲🇲',
  'km': '🇰🇭', 'km-KH': '🇰🇭',
  'lo': '🇱🇦', 'lo-LA': '🇱🇦',
  'si': '🇱🇰', 'si-LK': '🇱🇰',
  'ne': '🇳🇵', 'ne-NP': '🇳🇵', 'ne-IN': '🇮🇳',
  'dz': '🇧🇹', 'dz-BT': '🇧🇹',
  'bo': '🇨🇳', 'bo-CN': '🇨🇳', 'bo-IN': '🇮🇳',
  'ug': '🇨🇳', 'ug-CN': '🇨🇳',
  'mn': '🇲🇳', 'mn-MN': '🇲🇳', 'mn-CN': '🇨🇳',
  'kk': '🇰🇿', 'kk-KZ': '🇰🇿',
  'ky': '🇰🇬', 'ky-KG': '🇰🇬',
  'uz': '🇺🇿', 'uz-UZ': '🇺🇿',
  'tk': '🇹🇲', 'tk-TM': '🇹🇲',
  'tg': '🇹🇯', 'tg-TJ': '🇹🇯',
  'ps': '🇦🇫', 'ps-AF': '🇦🇫', 'ps-PK': '🇵🇰',
  'ku': '🇮🇶', 'ku-IQ': '🇮🇶', 'ku-IR': '🇮🇷', 'ku-TR': '🇹🇷', 'ku-SY': '🇸🇾',
  'ckb': '🇮🇶', 'ckb-IQ': '🇮🇶', 'ckb-IR': '🇮🇷',
  'az': '🇦🇿', 'az-AZ': '🇦🇿', 'az-IR': '🇮🇷',
  'hy': '🇦🇲', 'hy-AM': '🇦🇲',
  'ka': '🇬🇪', 'ka-GE': '🇬🇪',

  // Pacific languages
  'mi': '🇳🇿', 'mi-NZ': '🇳🇿',
  'sm': '🇼🇸', 'sm-WS': '🇼🇸', 'sm-AS': '🇦🇸',
  'to': '🇹🇴', 'to-TO': '🇹🇴',
  'fj': '🇫🇯', 'fj-FJ': '🇫🇯',
  'ty': '🇵🇫', 'ty-PF': '🇵🇫',
  'na': '🇳🇷', 'na-NR': '🇳🇷',
  'gil': '🇰🇮', 'gil-KI': '🇰🇮',
  'mh': '🇲🇭', 'mh-MH': '🇲🇭',
  'pau': '🇵🇼', 'pau-PW': '🇵🇼',
  'chk': '🇫🇲', 'chk-FM': '🇫🇲',
  'pon': '🇫🇲', 'pon-FM': '🇫🇲',
  'kos': '🇫🇲', 'kos-FM': '🇫🇲',
  'yap': '🇫🇲', 'yap-FM': '🇫🇲',

  // Sign languages (using deaf symbol + country flag)
  'asl': '🤟🇺🇸', 'bsl': '🤟🇬🇧', 'fsl': '🤟🇫🇷', 'gsl': '🤟🇩🇪', 'jsl': '🤟🇯🇵',

  // Constructed languages
  'eo': '🌍', 'ia': '🌍', 'ie': '🌍', 'vo': '🌍', 'jbo': '🌍',

  // Default fallback
  'unknown': '🏳️'
};

const getLanguageFlag = (languageCode: string): string => {
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
 * Language Card Component
 * 
 * Displays a language with its translation statistics, progress indicator,
 * and action button to open the translation editor.
 * 
 * @component
 * @param {LanguageCardProps} props - The component props
 * @param {Object} props.language - Language data with statistics
 * @param {Function} props.onOpenEditor - Callback when opening editor
 * @example
 * <LanguageCard
 *   language={{
 *     code: 'en-US',
 *     name: 'English (US)',
 *     nativeName: 'English',
 *     isDefault: true,
 *     totalTranslations: 100,
 *     completedTranslations: 85,
 *     pendingReview: 5,
 *     autoTranslated: 20,
 *     completionPercentage: 85
 *   }}
 *   onOpenEditor={(code) => router.push(`/admin/translations/editor?language=${code}`)}
 * />
 */
export function LanguageCard({ language, onOpenEditor }: LanguageCardProps) {
  const flag = getLanguageFlag(language.code);

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (percentage >= 50) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  // Function to get progress bar color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) {
      // Perfect completion: Green
      return 'bg-green-500';
    } else if (percentage >= 50) {
      // Good progress (50-99%): Orange
      return 'bg-orange-500';
    } else {
      // Low progress (0-49%): Red
      return 'bg-red-500';
    }
  };

  const getProgressBackgroundColor = (percentage: number) => {
    if (percentage >= 80) {
      return 'bg-green-100';
    } else if (percentage >= 40) {
      return 'bg-orange-100';
    } else {
      return 'bg-gray-100';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={`${language.name} flag`}>
              {flag}
            </span>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {language.name}
                {language.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{language.nativeName}</p>
            </div>
          </div>
          {getStatusIcon(language.completionPercentage)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Custom Color-Coded Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Translation Progress</span>
            <span className="font-medium">{language.completionPercentage}%</span>
          </div>
          <div className={`w-full h-2 rounded-full ${getProgressBackgroundColor(language.completionPercentage)}`}>
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(language.completionPercentage)}`}
              style={{ width: `${Math.min(100, Math.max(0, language.completionPercentage))}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium">{language.completedTranslations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Review:</span>
              <span className="font-medium text-yellow-600">{language.pendingReview}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-translated:</span>
              <span className="font-medium text-blue-600">{language.autoTranslated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{language.totalTranslations}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => onOpenEditor(language.code)}
          className="w-full"
          variant="outline"
        >
          <Flag className="h-4 w-4 mr-2" />
          Edit Translations
        </Button>
      </CardContent>
    </Card>
  );
} 