'use client';
/**
 * AI Smart Dashboard Component
 * Comprehensive dashboard showcasing AI-powered features and insights
 */
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Camera, 
  TrendingUp, 
  Target, 
  Sparkles, 
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Trophy,
  Zap,
  Eye,
  Heart,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { browserLogger } from '@/lib/browser-logger';
interface AIAnalysis {
  detectedObjects: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  colorPalette: Array<{
    color: string;
    percentage: number;
    hex: string;
  }>;
  composition: {
    orientation: 'portrait' | 'landscape' | 'square';
    subjectCount: number;
    focusArea: string;
  };
  lighting: {
    type: string;
    quality: string;
    direction: string;
  };
  mood: {
    primary: string;
    secondary?: string;
    confidence: number;
  };
  quality: {
    sharpness: number;
    exposure: number;
    composition: number;
    overall: number;
  };
}
interface OptimizationData {
  overallScore: number;
  scoreBreakdown: {
    diversity: number;
    quality: number;
    completeness: number;
    marketAppeal: number;
  };
  suggestions: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionable: boolean;
  }>;
  strengthAreas: string[];
  improvementAreas: string[];
}
interface PortfolioInsights {
  totalImages: number;
  categories: Record<string, number>;
  topTags: Array<{ name: string; count: number }>;
  bestPerformingImages: Array<{
    id: string;
    url: string;
    title: string;
    views: number;
    likes: number;
    engagementRate: number;
  }>;
  recommendedTags: string[];
}
export default function AISmartDashboard() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [portfolioInsights, setPortfolioInsights] = useState<PortfolioInsights | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Array<{ imageId: string; analysis: AIAnalysis }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    loadDashboardData();
  }, []);
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Load portfolio optimization data
      const optimizationResponse = await fetch('/api/v1/ai/portfolio-optimization?includeComparison=true&includeActionPlan=true');
      if (optimizationResponse.ok) {
        const optimizationResult = await optimizationResponse.json();
        setOptimizationData(optimizationResult.data.optimization);
        setPortfolioInsights(optimizationResult.data.portfolio);
      }
      // Load recent AI analyses
      const analysisResponse = await fetch('/api/v1/ai/analyze-image');
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        setRecentAnalyses(analysisResult.data?.recentAnalyses || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error Loading AI Dashboard',
        description: 'Failed to load AI insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const triggerBatchAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      // Get user's portfolio images
      const portfolioResponse = await fetch('/api/portfolio/images');
      if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio');
      const portfolioData = await portfolioResponse.json();
      const imageIds = portfolioData.images?.slice(0, 10);
      if (imageIds.length === 0) {
        toast({
          title: 'No Images Found',
          description: 'Add some portfolio images first to enable AI analysis.',
          variant: 'destructive',
        });
        return;
      }
      // Trigger batch analysis
      const analysisResponse = await fetch('/api/v1/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIds,
          options: {
            autoApply: true,
            maxConcurrent: 3,
          },
        }),
      });
      if (!analysisResponse.ok) throw new Error('Analysis failed');
      const result = await analysisResponse.json();
      toast({
        title: 'AI Analysis Complete! 🎉',
        description: `Analyzed ${result.data.statistics.analyzedImages} images and applied ${result.data.statistics.totalAppliedTags} smart tags.`,
      });
      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error in batch analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze portfolio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  if (isLoading) {
    return <AISmartDashboardSkeleton />;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Smart Dashboard</h1>
            <p className="text-muted-foreground">Intelligent insights and optimization for your portfolio</p>
          </div>
        </div>
        <Button 
          onClick={triggerBatchAnalysis}
          disabled={isAnalyzing}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isAnalyzing ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Portfolio
            </>
          )}
        </Button>
      </div>
      {/* Quick Stats */}
      {optimizationData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <p className="text-2xl font-bold">{optimizationData.overallScore}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Quality</p>
                  <p className="text-2xl font-bold">{Math.round(optimizationData.scoreBreakdown.quality)}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Market Appeal</p>
                  <p className="text-2xl font-bold">{Math.round(optimizationData.scoreBreakdown.marketAppeal)}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Camera className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Size</p>
                  <p className="text-2xl font-bold">{portfolioInsights?.totalImages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab optimizationData={optimizationData} portfolioInsights={portfolioInsights} />
        </TabsContent>
        <TabsContent value="optimization" className="space-y-4">
          <OptimizationTab optimizationData={optimizationData} />
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <InsightsTab portfolioInsights={portfolioInsights} />
        </TabsContent>
        <TabsContent value="analysis" className="space-y-4">
          <AnalysisTab recentAnalyses={recentAnalyses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
function OverviewTab({ 
  optimizationData, 
  portfolioInsights 
}: { 
  optimizationData: OptimizationData | null;
  portfolioInsights: PortfolioInsights | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Portfolio Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Portfolio Score Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {optimizationData && (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Diversity</span>
                  <span>{Math.round(optimizationData.scoreBreakdown.diversity)}%</span>
                </div>
                <Progress value={optimizationData.scoreBreakdown.diversity} className="h-2" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Quality</span>
                  <span>{Math.round(optimizationData.scoreBreakdown.quality)}%</span>
                </div>
                <Progress value={optimizationData.scoreBreakdown.quality} className="h-2" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Completeness</span>
                  <span>{Math.round(optimizationData.scoreBreakdown.completeness)}%</span>
                </div>
                <Progress value={optimizationData.scoreBreakdown.completeness} className="h-2" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Market Appeal</span>
                  <span>{Math.round(optimizationData.scoreBreakdown.marketAppeal)}%</span>
                </div>
                <Progress value={optimizationData.scoreBreakdown.marketAppeal} className="h-2" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Top Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Top Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizationData?.suggestions.slice(0, 4).map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`p-1 rounded-full ${
                  suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                  suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {suggestion.priority === 'high' ? <AlertCircle className="h-4 w-4" /> :
                   suggestion.priority === 'medium' ? <Eye className="h-4 w-4" /> :
                   <CheckCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-sm">{suggestion.title}</p>
                    <Badge variant={
                      suggestion.priority === 'high' ? 'destructive' :
                      suggestion.priority === 'medium' ? 'default' : 'secondary'
                    } className="text-xs">
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Strengths & Improvements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Strengths & Areas for Improvement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2 text-green-600">✅ Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {optimizationData?.strengthAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 text-orange-600">🎯 Improvements</h4>
              <div className="flex flex-wrap gap-2">
                {optimizationData?.improvementAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Portfolio Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Portfolio Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {portfolioInsights && Object.entries(portfolioInsights.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{count}</span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${(count / (portfolioInsights.totalImages || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function OptimizationTab({ optimizationData }: { optimizationData: OptimizationData | null }) {
  if (!optimizationData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Optimization Data</h3>
          <p className="text-sm text-muted-foreground">Upload some portfolio images to get AI-powered optimization suggestions.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Priority Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Optimization Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationData.suggestions.map((suggestion, index) => (
              <Alert key={index} className={
                suggestion.priority === 'high' ? 'border-red-200 bg-red-50' :
                suggestion.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-green-200 bg-green-50'
              }>
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                    suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {suggestion.priority === 'high' ? <AlertCircle className="h-4 w-4" /> :
                     suggestion.priority === 'medium' ? <Eye className="h-4 w-4" /> :
                     <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant={
                        suggestion.priority === 'high' ? 'destructive' :
                        suggestion.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {suggestion.priority} priority
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">
                      {suggestion.description}
                    </AlertDescription>
                    {suggestion.actionable && (
                      <Button size="sm" className="mt-2">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function InsightsTab({ portfolioInsights }: { portfolioInsights: PortfolioInsights | null }) {
  if (!portfolioInsights) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Insights Available</h3>
          <p className="text-sm text-muted-foreground">Upload and analyze portfolio images to see detailed insights.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Best Performing Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Best Performing Images</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioInsights.bestPerformingImages.map((image, index) => (
              <div key={image.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{image.title || `Image ${index + 1}`}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{image.views}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{image.likes}</span>
                    </span>
                    <span>{(image.engagementRate * 100).toFixed(1)}% engagement</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Recommended Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Recommended Tags</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add these trending tags to improve discoverability:
            </p>
            <div className="flex flex-wrap gap-2">
              {portfolioInsights.recommendedTags.map((tag, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Top Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Your Top Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {portfolioInsights.topTags.slice(0, 8).map((tag, index) => (
              <div key={tag.name} className="flex justify-between items-center">
                <span className="text-sm">{tag.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{tag.count}</span>
                  <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${(tag.count / portfolioInsights.topTags[0].count) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function AnalysisTab({ recentAnalyses }: { recentAnalyses: Array<{ imageId: string; analysis: AIAnalysis }> }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">No Recent Analyses</h3>
              <p className="text-sm text-muted-foreground">Analyze some portfolio images to see detailed AI insights here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((item, index) => (
                <div key={item.imageId} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Analysis #{index + 1}</h4>
                  {/* Quality Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{Math.round(item.analysis.quality.overall * 100)}</p>
                      <p className="text-xs text-muted-foreground">Overall</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{Math.round(item.analysis.quality.sharpness * 100)}</p>
                      <p className="text-xs text-muted-foreground">Sharpness</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{Math.round(item.analysis.quality.composition * 100)}</p>
                      <p className="text-xs text-muted-foreground">Composition</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{Math.round(item.analysis.quality.exposure * 100)}</p>
                      <p className="text-xs text-muted-foreground">Exposure</p>
                    </div>
                  </div>
                  {/* Analysis Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Composition</p>
                      <p className="text-muted-foreground">{item.analysis.composition.orientation}, {item.analysis.composition.subjectCount} subject(s)</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Lighting</p>
                      <p className="text-muted-foreground">{item.analysis.lighting.type}, {item.analysis.lighting.quality}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Mood</p>
                      <p className="text-muted-foreground capitalize">{item.analysis.mood.primary}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
function AISmartDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 