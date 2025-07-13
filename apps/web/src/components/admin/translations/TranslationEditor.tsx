'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Wand2, 
  X, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { useToast } from '@/hooks/use-toast';

interface TranslationKey {
  key: string;
  entityType: string;
  entityId: string;
  translations: Array<{
    languageCode: string;
    value: string;
    isAutoTranslated: boolean;
    needsReview: boolean;
  }>;
}

interface TranslationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage?: string;
  entityType?: string;
}

// Flag emoji mapping
const FLAG_EMOJIS: Record<string, string> = {
  'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'pt': '🇵🇹',
  'ru': '🇷🇺', 'ja': '🇯🇵', 'ko': '🇰🇷', 'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳',
  'th': '🇹🇭', 'vi': '🇻🇳', 'tr': '🇹🇷', 'pl': '🇵🇱', 'nl': '🇳🇱', 'sv': '🇸🇪',
  'da': '🇩🇰', 'no': '🇳🇴', 'fi': '🇫🇮', 'cs': '🇨🇿', 'hu': '🇭🇺', 'ro': '🇷🇴'
};

export const TranslationEditor = function TranslationEditor({ isOpen, onClose, selectedLanguage, entityType }: TranslationEditorProps) {
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [autoTranslating, setAutoTranslating] = useState<string | null>(null);
  const { toast } = useToast();

  // Load translation keys and languages
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, entityType]);

  const loadData = async () => {
    try {
      setLoading(true);
      browserLogger.info('Loading translation editor data', { selectedLanguage, entityType });

      // Load languages and translation keys in parallel
      const [languagesResponse, keysResponse] = await Promise.all([
        fetch('/api/v1/admin/translations/languages'),
        fetch(`/api/v1/admin/translations/keys${entityType ? `?entityType=${entityType}` : ''}`)
      ]);

      if (!languagesResponse.ok || !keysResponse.ok) {
        throw new Error('Failed to load data');
      }

      const [languagesData, keysData] = await Promise.all([
        languagesResponse.json(),
        keysResponse.json()
      ]);

      // Handle direct array response from languages API and direct array response from keys API
      if (Array.isArray(languagesData) && Array.isArray(keysData)) {
        setLanguages(languagesData);
        setTranslationKeys(keysData);
        setCurrentIndex(0);
        setEditedValues({});

        browserLogger.info('Translation editor data loaded', { 
          languagesCount: languagesData.length,
          keysCount: keysData.length 
        });
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      browserLogger.error('Error loading translation editor data', { error: errorMessage });
      toast({
        title: 'Error',
        description: 'Failed to load translation data',
        variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const currentKey = translationKeys[currentIndex];
  const englishTranslation = currentKey?.translations.find(t => t.languageCode === 'en');

  const handleNext = () => {
    if (currentIndex < translationKeys.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditedValues({});
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setEditedValues({});
    }
  };

  const handleAutoTranslate = async (targetLanguage: string) => {
    if (!englishTranslation?.value || !currentKey) return;

    try {
      setAutoTranslating(targetLanguage);
      browserLogger.info('Auto-translating text', { 
        fromLanguage: 'en', 
        toLanguage: targetLanguage,
        key: currentKey.key 
      });

      const response = await fetch('/api/v1/admin/translations/auto-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: englishTranslation.value,
          fromLanguage: 'en',
          toLanguage: targetLanguage,
          context: `${currentKey.entityType}:${currentKey.key}`
        })
      });

      if (!response.ok) throw new Error('Auto-translation failed');

      const data = await response.json();
      if (data.success) {
        setEditedValues(prev => ({ ...prev, [targetLanguage]: data.data.translatedText }));
        browserLogger.info('Auto-translation completed', { targetLanguage });
      } else {
        throw new Error(data.error || 'Auto-translation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      browserLogger.error('Error auto-translating', { error: errorMessage });
      toast({
        title: 'Error',
        description: 'Auto-translation failed',
        variant: 'destructive' });
    } finally {
      setAutoTranslating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              <CardTitle>Translation Editor</CardTitle>
              {entityType && (
                <Badge variant="outline">{entityType}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          {translationKeys.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {translationKeys.length}
              </span>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                disabled={currentIndex === translationKeys.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading translations...</p>
              </div>
            </div>
          ) : !currentKey ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No translation keys found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Translation Key</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Key:</strong> {currentKey.key}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Entity:</strong> {currentKey.entityType}:{currentKey.entityId}
                </p>
              </div>

              {/* English Reference */}
              {englishTranslation && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🇺🇸</span>
                    <h4 className="font-medium">English (Reference)</h4>
                  </div>
                  <p className="text-sm">{englishTranslation.value}</p>
                </div>
              )}

              {/* Other Languages */}
              <div className="space-y-4">
                {languages
                  .filter(lang => lang.code !== 'en')
                  .map(language => {
                    const translation = currentKey.translations.find(t => t.languageCode === language.code);
                    const editedValue = editedValues[language.code];
                    const flag = FLAG_EMOJIS[language.code] || '🏳️';

                    return (
                      <div key={language.code} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{flag}</span>
                            <h4 className="font-medium">{language.name}</h4>
                            <span className="text-sm text-muted-foreground">({language.nativeName})</span>
                            {translation?.needsReview && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Needs Review
                              </Badge>
                            )}
                            {translation?.isAutoTranslated && (
                              <Badge variant="secondary" className="text-xs">
                                Auto-translated
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoTranslate(language.code)}
                              disabled={!englishTranslation?.value || autoTranslating === language.code}
                            >
                              {autoTranslating === language.code ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                              ) : (
                                <Wand2 className="h-3 w-3 mr-1" />
                              )}
                              Auto-translate
                            </Button>
                          </div>
                        </div>

                        <Textarea
                          value={editedValue || translation?.value || ''}
                          onChange={(e) => setEditedValues(prev => ({ 
                            ...prev, 
                            [language.code]: e.target.value 
                          }))}
                          placeholder={`Enter ${language.name} translation...`}
                          className="min-h-[80px]"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 