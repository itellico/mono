'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronLeft, ChevronRight, Wand2, CheckCircle, X, Plus, Languages } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
interface Translation {
  id: string;
  languageCode: string;
  key: string;
  value: string;
  needsReview: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}
interface TranslationKey {
  key: string;
  entityType: string;
  entityId: string;
  translations?: Array<{
    id: string;
    languageCode: string;
    value: string;
    isAutoTranslated: boolean;
    needsReview: boolean;
    isApproved: boolean;
  }>;
  description?: string;
}
interface Language {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
}
const getFlagEmoji = (countryCode: string): string => {
  const flagMap: Record<string, string> = {
    'en': '🇺🇸', 'en-US': '🇺🇸', 'en-GB': '🇬🇧',
    'es': '🇪🇸', 'es-ES': '🇪🇸', 'es-MX': '🇲🇽',
    'fr': '🇫🇷', 'fr-FR': '🇫🇷', 'fr-CA': '🇨🇦',
    'de': '🇩🇪', 'de-DE': '🇩🇪', 'de-AT': '🇦🇹',
    'it': '🇮🇹', 'it-IT': '🇮🇹',
    'pt': '🇵🇹', 'pt-PT': '🇵🇹', 'pt-BR': '🇧🇷',
    'ru': '🇷🇺', 'ru-RU': '🇷🇺',
    'ja': '🇯🇵', 'ja-JP': '🇯🇵',
    'ko': '🇰🇷', 'ko-KR': '🇰🇷',
    'zh': '🇨🇳', 'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼',
    'ar': '🇸🇦', 'ar-SA': '🇸🇦',
    'hi': '🇮🇳', 'hi-IN': '🇮🇳',
    'th': '🇹🇭', 'th-TH': '🇹🇭',
    'vi': '🇻🇳', 'vi-VN': '🇻🇳',
    'tr': '🇹🇷', 'tr-TR': '🇹🇷',
    'pl': '🇵🇱', 'pl-PL': '🇵🇱',
    'nl': '🇳🇱', 'nl-NL': '🇳🇱',
    'sv': '🇸🇪', 'sv-SE': '🇸🇪',
    'da': '🇩🇰', 'da-DK': '🇩🇰',
    'no': '🇳🇴', 'no-NO': '🇳🇴',
    'fi': '🇫🇮', 'fi-FI': '🇫🇮',
    'cs': '🇨🇿', 'cs-CZ': '🇨🇿',
    'sk': '🇸🇰', 'sk-SK': '🇸🇰',
    'hu': '🇭🇺', 'hu-HU': '🇭🇺',
    'ro': '🇷🇴', 'ro-RO': '🇷🇴',
    'bg': '🇧🇬', 'bg-BG': '🇧🇬',
    'hr': '🇭🇷', 'hr-HR': '🇭🇷',
    'sl': '🇸🇮', 'sl-SI': '🇸🇮',
    'et': '🇪🇪', 'et-EE': '🇪🇪',
    'lv': '🇱🇻', 'lv-LV': '🇱🇻',
    'lt': '🇱🇹', 'lt-LT': '🇱🇹',
    'el': '🇬🇷', 'el-GR': '🇬🇷',
    'he': '🇮🇱', 'he-IL': '🇮🇱',
    'fa': '🇮🇷', 'fa-IR': '🇮🇷',
    'ur': '🇵🇰', 'ur-PK': '🇵🇰',
    'bn': '🇧🇩', 'bn-BD': '🇧🇩',
    'ta': '🇮🇳', 'ta-IN': '🇮🇳',
    'te': '🇮🇳', 'te-IN': '🇮🇳',
    'ml': '🇮🇳', 'ml-IN': '🇮🇳',
    'kn': '🇮🇳', 'kn-IN': '🇮🇳',
    'gu': '🇮🇳', 'gu-IN': '🇮🇳',
    'pa': '🇮🇳', 'pa-IN': '🇮🇳',
    'or': '🇮🇳', 'or-IN': '🇮🇳',
    'as': '🇮🇳', 'as-IN': '🇮🇳',
    'ne': '🇳🇵', 'ne-NP': '🇳🇵',
    'si': '🇱🇰', 'si-LK': '🇱🇰',
    'my': '🇲🇲', 'my-MM': '🇲🇲',
    'km': '🇰🇭', 'km-KH': '🇰🇭',
    'lo': '🇱🇦', 'lo-LA': '🇱🇦',
    'ka': '🇬🇪', 'ka-GE': '🇬🇪',
    'am': '🇪🇹', 'am-ET': '🇪🇹',
    'sw': '🇰🇪', 'sw-KE': '🇰🇪',
    'zu': '🇿🇦', 'zu-ZA': '🇿🇦',
    'af': '🇿🇦', 'af-ZA': '🇿🇦',
    'is': '🇮🇸', 'is-IS': '🇮🇸',
    'mt': '🇲🇹', 'mt-MT': '🇲🇹',
    'ga': '🇮🇪', 'ga-IE': '🇮🇪',
    'cy': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'cy-GB': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'eu': '🏴󠁥󠁳󠁰󠁶󠁿', 'eu-ES': '🏴󠁥󠁳󠁰󠁶󠁿',
    'ca': '🏴󠁥󠁳󠁣󠁴󠁿', 'ca-ES': '🏴󠁥󠁳󠁣󠁴󠁿',
    'gl': '🏴󠁥󠁳󠁧󠁡󠁿', 'gl-ES': '🏴󠁥󠁳󠁧󠁡󠁿',
    'br': '🏴󠁦󠁲󠁢󠁲󠁥󠁿', 'br-FR': '🏴󠁦󠁲󠁢󠁲󠁥󠁿',
    'oc': '🏴󠁦󠁲󠁯󠁣󠁿', 'oc-FR': '🏴󠁦󠁲󠁯󠁣󠁿',
    'co': '🏴󠁦󠁲󠁣󠁯󠁿', 'co-FR': '🏴󠁦󠁲󠁣󠁯󠁿',
    'sc': '🏴󠁩󠁴󠁳󠁣󠁿', 'sc-IT': '🏴󠁩󠁴󠁳󠁣󠁿',
    'rm': '🇨🇭', 'rm-CH': '🇨🇭',
    'lb': '🇱🇺', 'lb-LU': '🇱🇺',
    'fo': '🇫🇴', 'fo-FO': '🇫🇴',
    'kl': '🇬🇱', 'kl-GL': '🇬🇱',
    'se': '🏴󠁮󠁯󠁳󠁥󠁿', 'se-NO': '🏴󠁮󠁯󠁳󠁥󠁿',
    'smj': '🏴󠁮󠁯󠁳󠁭󠁪󠁿', 'smj-NO': '🏴󠁮󠁯󠁳󠁭󠁪󠁿',
    'sma': '🏴󠁮󠁯󠁳󠁭󠁡󠁿', 'sma-NO': '🏴󠁮󠁯󠁳󠁭󠁡󠁿',
    'smn': '🏴󠁦󠁩󠁳󠁭󠁮󠁿', 'smn-FI': '🏴󠁦󠁩󠁳󠁭󠁮󠁿',
    'sms': '🏴󠁦󠁩󠁳󠁭󠁳󠁿', 'sms-FI': '🏴󠁦󠁩󠁳󠁭󠁳󠁿'
  };
  return flagMap[countryCode] || '🌐';
};
export default function TranslationEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get('language') || 'en-US';
  const index = parseInt(searchParams.get('index') || '0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<TranslationKey[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const currentKey = keys[index];
  const englishTranslation = translations.find(t => 
    t.key === currentKey?.key && (t.languageCode === 'en' || t.languageCode === 'en-US')
  );
  // Auto-populate selectedLanguages with languages that have translations for the current key
  useEffect(() => {
    if (currentKey && translations.length > 0) {
      const languagesWithTranslations = translations
        .filter(t => t.key === currentKey.key && t.languageCode !== 'en' && t.languageCode !== 'en-US')
        .map(t => t.languageCode);
      // Always include the target language from URL if it's not English
      const targetLang = language && language !== 'en' && language !== 'en-US' ? [language] : [];
      const allLanguages = [...new Set([...languagesWithTranslations, ...targetLang])];
      // Only update if the array has actually changed
      setSelectedLanguages(prev => {
          const newSorted = [...allLanguages].sort();
        if (JSON.stringify(prevSorted) !== JSON.stringify(newSorted)) {
          return allLanguages;
        }
        return prev;
      });
    }
  }, [currentKey, translations, language]);
  // Auto-include target language in selected languages
  useEffect(() => {
    if (language && !selectedLanguages.includes(language) && language !== 'en' && language !== 'en-US') {
      setSelectedLanguages(prev => {
        const uniqueLanguages = [...new Set([language, ...prev])];
        return uniqueLanguages;
      });
    }
  }, [language]);
  // Safeguard to remove duplicates from selectedLanguages
  useEffect(() => {
    setSelectedLanguages(prev => [...new Set(prev)]);
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [keysResponse, translationsResponse, languagesResponse] = await Promise.all([
          fetch('/api/v1/admin/translations/keys'),
          fetch('/api/v1/admin/translations'),
          fetch('/api/v1/admin/translations/languages')
        ]);
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setKeys(keysData.data || []);
        }
        if (translationsResponse.ok) {
          const translationsData = await translationsResponse.json();
          setTranslations(translationsData.data || []);
        }
        if (languagesResponse.ok) {
          const languagesData = await languagesResponse.json();
          setLanguages(languagesData.data?.languages || []);
        }
      } catch (error) {
        browserLogger.error('Error fetching translation data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const availableLanguages = Array.isArray(languages)
    ? languages.filter(
        (lang) => !selectedLanguages.includes(lang.code) && lang.code !== 'en' && lang.code !== 'en-US'
      )
    : [];
  const getTranslationForLanguage = (languageCode: string): Translation | null => {
    return translations.find(t => 
      t.key === currentKey?.key && t.languageCode === languageCode
    ) || null;
  };
  const getTranslationStatus = (translation: Translation | null) => {
    if (!translation || !translation.value) return 'not_translated';
    if (translation.needsReview) return 'needs_review';
    if (translation.isApproved) return 'approved';
    return 'translated';
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'needs_review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Needs Review</Badge>;
      case 'translated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Translated</Badge>;
      case 'not_translated':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Not Translated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  const handleSave = async (translationId: string, value: string, languageCode: string) => {
    try {
      setSaving(prev => ({ ...prev, [translationId]: true }));
      const response = await fetch(`/api/v1/admin/translations/${translationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (response.ok) {
        const updatedTranslation = await response.json();
        setTranslations(prev => 
          prev.map(t => t.id === translationId ? updatedTranslation.data : t)
        );
        browserLogger.info('Translation saved successfully', { translationId, languageCode });
      }
    } catch (error) {
      browserLogger.error('Error saving translation:', error);
    } finally {
      setSaving(prev => ({ ...prev, [translationId]: false }));
    }
  };
  const handleApprove = async (translationId: string, languageCode: string) => {
    try {
      setSaving(prev => ({ ...prev, [translationId]: true }));
      const response = await fetch(`/api/v1/admin/translations/${translationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true, needsReview: false })
      });
      if (response.ok) {
        const updatedTranslation = await response.json();
        setTranslations(prev => 
          prev.map(t => t.id === translationId ? updatedTranslation.data : t)
        );
        browserLogger.info('Translation approved successfully', { translationId, languageCode });
      }
    } catch (error) {
      browserLogger.error('Error approving translation:', error);
    } finally {
      setSaving(prev => ({ ...prev, [translationId]: false }));
    }
  };
  const handleNeedsReview = async (translationId: string, languageCode: string) => {
    try {
      setSaving(prev => ({ ...prev, [translationId]: true }));
      const response = await fetch(`/api/v1/admin/translations/${translationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsReview: true, isApproved: false })
      });
      if (response.ok) {
        const updatedTranslation = await response.json();
        setTranslations(prev => 
          prev.map(t => t.id === translationId ? updatedTranslation.data : t)
        );
        browserLogger.info('Translation marked as needs review', { translationId, languageCode });
      }
    } catch (error) {
      browserLogger.error('Error marking translation as needs review:', error);
    } finally {
      setSaving(prev => ({ ...prev, [translationId]: false }));
    }
  };
  const handleAutoTranslate = async (translationId: string, languageCode: string) => {
    if (!englishTranslation?.value) {
      browserLogger.warn('No English translation available for auto-translate');
      return;
    }
    try {
      setTranslating(prev => ({ ...prev, [translationId]: true }));
      const response = await fetch('/api/v1/admin/translations/auto-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: englishTranslation.value,
          targetLanguage: languageCode,
          sourceLanguage: 'en'
        })
      });
      if (response.ok) {
        const result = await response.json();
        const translatedText = result.data?.translatedText || result.translatedText || englishTranslation.value;
        // Update the translation with auto-translated text
        await handleSave(translationId, translatedText, languageCode);
        browserLogger.info('Auto-translation completed', { translationId, languageCode });
      }
    } catch (error) {
      browserLogger.error('Error auto-translating:', error);
    } finally {
      setTranslating(prev => ({ ...prev, [translationId]: false }));
    }
  };
  const createTranslation = async (languageCode: string): Promise<Translation | null> => {
    try {
      setCreating(prev => ({ ...prev, [languageCode]: true }));
      browserLogger.info(`Creating translation for ${languageCode}...`);
      const response = await fetch('/api/v1/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: currentKey.key,
          languageCode,
          value: '',
          needsReview: true,
          isApproved: false,
          entityType: currentKey.entityType,
          entityId: currentKey.entityId
        })
      });
      if (response.ok) {
        const newTranslation = await response.json();
        const translation = newTranslation.data;
        setTranslations(prev => [...prev, translation]);
        browserLogger.info('Translation created successfully', { languageCode, translationId: translation.id });
        return translation;
      } else {
        const errorData = await response.json();
        browserLogger.error('Failed to create translation', { 
          languageCode, 
          status: response.status, 
          error: errorData.error || 'Unknown error' 
        });
      }
    } catch (error) {
      browserLogger.error('Error creating translation:', { 
        languageCode, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setCreating(prev => ({ ...prev, [languageCode]: false }));
    }
    return null;
  };
  const addLanguageToSelected = (langCode: string) => {
    if (!selectedLanguages.includes(langCode)) {
      setSelectedLanguages(prev => [...prev, langCode]);
      browserLogger.info('Language added to selected', { languageCode: langCode });
    }
  };
  const removeLanguageFromSelected = (langCode: string) => {
    setSelectedLanguages(prev => prev.filter(code => code !== langCode));
    browserLogger.info('Language removed from selected', { languageCode: langCode });
  };
  const navigateToKey = (newIndex: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('index', newIndex.toString());
    router.push(`/admin/translations/editor?${params.toString()}`);
  };
  const getLanguageDisplayName = (languageCode: string) => {
    const language = Array.isArray(languages) ? languages.find(l => l.code === languageCode) : null;
    return language ? `${language.name} (${languageCode})` : languageCode;
  };
  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!currentKey) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            No translation keys found
          </h2>
          <Button onClick={() => router.push('/admin/translations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Translations
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/translations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Translations
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToKey(index - 1)}
              disabled={index === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {index + 1} of {keys.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToKey(index + 1)}
              disabled={index === keys.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          onClick={() => {
            selectedLanguages.forEach(async (langCode) => {
              const translation = getTranslationForLanguage(langCode);
              if (translation) {
                await handleAutoTranslate(translation.id, langCode);
              }
            });
          }}
          disabled={selectedLanguages.length === 0 || !englishTranslation?.value}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Translate {selectedLanguages.length} Languages
        </Button>
      </div>
      {/* English Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🇺🇸 English Reference
            <Badge variant="outline">{currentKey.entityType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Key: {currentKey.key}
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              {englishTranslation?.value || 'No English translation available'}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Selected Languages Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Selected Languages
            </CardTitle>
            {/* Multi-select Languages Dropdown */}
            <Select
              value=""
              onValueChange={(langCode) => {
                if (langCode) addLanguageToSelected(langCode);
              }}
              disabled={loading || availableLanguages.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add a language to edit..." />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(languages) ? languages.filter(
                  (lang) => !selectedLanguages.includes(lang.code) && lang.code !== 'en' && lang.code !== 'en-US'
                ) : []).map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="mr-2">{getFlagEmoji(lang.code)}</span>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedLanguages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No languages selected for translation</p>
              <p className="text-sm">Use the dropdown above to select languages</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedLanguages.map((langCode, langIndex) => {
                const lang = Array.isArray(languages) ? languages.find(l => l.code === langCode) : null;
                const translation = getTranslationForLanguage(langCode);
                const translationKey = `${langCode}-${currentKey.key}`;
                const status = translation ? getTranslationStatus(translation) : null;
                return (
                  <Card key={`${langCode}-${currentKey.key}-${langIndex}`} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getFlagEmoji(langCode)}</span>
                          <div>
                            <h3 className="font-medium">{getLanguageDisplayName(langCode)}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {status && getStatusBadge(status)}
                              {creating[langCode] && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  Creating...
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {translation && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoTranslate(translation.id, langCode)}
                              disabled={translating[translation.id] || !englishTranslation?.value}
                            >
                              <Wand2 className="h-4 w-4 mr-1" />
                              {translating[translation.id] ? 'Translating...' : 'Auto-translate'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLanguageFromSelected(langCode)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!translation ? (
                        <div className="space-y-3">
                          <div className="p-3 border-2 border-dashed border-gray-300 rounded-md text-center text-muted-foreground">
                            No translation exists for this language
                          </div>
                          <Button
                            onClick={async () => {
                              const newTranslation = await createTranslation(langCode);
                              if (newTranslation && englishTranslation?.value) {
                                await handleAutoTranslate(newTranslation.id, langCode);
                              }
                            }}
                            disabled={creating[langCode]}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {creating[langCode] ? 'Creating translation...' : 'Create & Auto-translate'}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Textarea
                            value={translation.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setTranslations(prev => 
                                prev.map(t => t.id === translation.id ? { ...t, value: newValue } : t)
                              );
                            }}
                            placeholder={`Enter ${lang?.name || langCode} translation...`}
                            className="min-h-[100px]"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleSave(translation.id, translation.value, langCode)}
                              disabled={saving[translation.id]}
                              size="sm"
                            >
                              {saving[translation.id] ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleApprove(translation.id, langCode)}
                              disabled={saving[translation.id]}
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleNeedsReview(translation.id, langCode)}
                              disabled={saving[translation.id]}
                              size="sm"
                            >
                              Needs Review
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 