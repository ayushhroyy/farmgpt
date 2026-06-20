import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { cn } from "@/lib/utils";

export interface ImageAnalysisResult {
  isFarmRelated: boolean;
  isSunRelated: boolean;
  confidence: number;
  description: string;
  category: "farm" | "sun" | "farm_sun" | "other";
  issues?: string[];
  formData?: {
    location?: string;
    currentCrops?: string[];
    soilType?: string;
    waterSource?: string;
    currentIrrigationMethod?: string;
    soilMoisture?: string;
    cropRotationPattern?: string;
    majorChallenges?: string;
    harvestSeason?: string;
    fertilizerType?: string;
  };
}

interface ImageAnalysisProps {
  analyses?: ImageAnalysisResult[];
  isAnalyzing?: boolean;
  errors?: (string | null)[];
  className?: string;
}

const ImageAnalysis = React.forwardRef<HTMLDivElement, ImageAnalysisProps>(
  ({ analyses, isAnalyzing, errors, className, ...props }, ref) => {
    if (isAnalyzing) {
      return (
        <Card ref={ref} className={cn("w-full", className)} {...props}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Analyzing Images...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please wait while we analyze your images with AI...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (errors?.some((error) => error)) {
      return (
        <Card
          ref={ref}
          className={cn("w-full border-destructive/50", className)}
          {...props}
        >
          <CardHeader>
            <CardTitle className="text-lg text-destructive">
              Analysis Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.map((error, index) =>
              error ? (
                <Alert variant="destructive" key={index} className="mb-2">
                  <AlertDescription>
                    Image {index + 1}: {error}
                  </AlertDescription>
                </Alert>
              ) : null,
            )}
          </CardContent>
        </Card>
      );
    }

    if (!analyses || analyses.length === 0) {
      return (
        <Card ref={ref} className={cn("w-full", className)} {...props}>
          <CardHeader>
            <CardTitle className="text-lg">Image Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Upload images to see analysis results here.
            </p>
          </CardContent>
        </Card>
      );
    }

    const getBadgeVariant = (isGood: boolean) =>
      isGood ? "default" : "destructive";
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case "farm":
          return "🌾";
        case "sun":
          return "☀️";
        case "farm_sun":
          return "🌻";
        default:
          return "❓";
      }
    };

    // Calculate aggregated data from all analyses
    const aggregatedData = analyses.reduce(
      (acc, analysis, index) => {
        const farmRelatedCount = analyses.filter((a) => a.isFarmRelated).length;
        const sunRelatedCount = analyses.filter((a) => a.isSunRelated).length;
        const avgConfidence =
          analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

        // Aggregate form data
        if (analysis.formData) {
          if (analysis.formData.location && !acc.location) {
            acc.location = analysis.formData.location;
          }
          if (
            analysis.formData.currentCrops &&
            analysis.formData.currentCrops.length > 0
          ) {
            acc.currentCrops = [
              ...(acc.currentCrops || []),
              ...analysis.formData.currentCrops,
            ];
          }
          if (analysis.formData.soilType && !acc.soilType) {
            acc.soilType = analysis.formData.soilType;
          }
          if (analysis.formData.waterSource && !acc.waterSource) {
            acc.waterSource = analysis.formData.waterSource;
          }
          if (
            analysis.formData.currentIrrigationMethod &&
            !acc.currentIrrigationMethod
          ) {
            acc.currentIrrigationMethod =
              analysis.formData.currentIrrigationMethod;
          }
          if (analysis.formData.soilMoisture && !acc.soilMoisture) {
            acc.soilMoisture = analysis.formData.soilMoisture;
          }
          if (
            analysis.formData.cropRotationPattern &&
            !acc.cropRotationPattern
          ) {
            acc.cropRotationPattern = analysis.formData.cropRotationPattern;
          }
          if (analysis.formData.majorChallenges && !acc.majorChallenges) {
            acc.majorChallenges = analysis.formData.majorChallenges;
          }
          if (analysis.formData.harvestSeason && !acc.harvestSeason) {
            acc.harvestSeason = analysis.formData.harvestSeason;
          }
          if (analysis.formData.fertilizerType && !acc.fertilizerType) {
            acc.fertilizerType = analysis.formData.fertilizerType;
          }
        }

        return {
          farmRelatedCount,
          sunRelatedCount,
          avgConfidence,
          ...acc,
        };
      },
      {
        farmRelatedCount: 0,
        sunRelatedCount: 0,
        avgConfidence: 0,
        location: null as string | null,
        currentCrops: [] as string[],
        soilType: null as string | null,
        waterSource: null as string | null,
        currentIrrigationMethod: null as string | null,
        soilMoisture: null as string | null,
        cropRotationPattern: null as string | null,
        majorChallenges: null as string | null,
        harvestSeason: null as string | null,
        fertilizerType: null as string | null,
      },
    );

    // Remove duplicates from crops array
    if (aggregatedData.currentCrops.length > 0) {
      aggregatedData.currentCrops = [...new Set(aggregatedData.currentCrops)];
    }

    const allIssues = analyses.flatMap((a) => a.issues || []);

    return (
      <Card ref={ref} className={cn("w-full", className)} {...props}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Analysis Results</span>
            <span className="text-2xl">
              {aggregatedData.farmRelatedCount > 0 &&
              aggregatedData.sunRelatedCount > 0
                ? "🌻"
                : aggregatedData.farmRelatedCount > 0
                  ? "🌾"
                  : "☀️"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Section */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                aggregatedData.farmRelatedCount > 0 ? "default" : "destructive"
              }
            >
              {aggregatedData.farmRelatedCount} of {analyses.length} Farm
              Related
            </Badge>
            <Badge
              variant={
                aggregatedData.sunRelatedCount > 0 ? "default" : "destructive"
              }
            >
              {aggregatedData.sunRelatedCount} of {analyses.length} Sun Related
            </Badge>
            <Badge variant="outline">
              {Math.round(aggregatedData.avgConfidence * 100)}% Avg Confidence
            </Badge>
            <Badge variant="secondary">{analyses.length} Images Analyzed</Badge>
          </div>

          {/* Aggregated Form Data */}
          {aggregatedData.location ||
          (aggregatedData.currentCrops &&
            aggregatedData.currentCrops.length > 0) ||
          aggregatedData.soilType ||
          aggregatedData.waterSource ||
          aggregatedData.currentIrrigationMethod ||
          aggregatedData.soilMoisture ||
          aggregatedData.cropRotationPattern ||
          aggregatedData.majorChallenges ||
          aggregatedData.harvestSeason ||
          aggregatedData.fertilizerType ? (
            <div>
              <h4 className="font-medium mb-2">📋 Extracted Information:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {aggregatedData.location && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📍 Location:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.location}
                    </span>
                  </div>
                )}
                {aggregatedData.currentCrops &&
                  aggregatedData.currentCrops.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">🌾 Crops:</span>
                      <span className="text-muted-foreground">
                        {aggregatedData.currentCrops.join(", ")}
                      </span>
                    </div>
                  )}
                {aggregatedData.soilType && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🪴 Soil Type:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.soilType}
                    </span>
                  </div>
                )}
                {aggregatedData.waterSource && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💧 Water Source:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.waterSource}
                    </span>
                  </div>
                )}
                {aggregatedData.currentIrrigationMethod && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">⚗️ Irrigation:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.currentIrrigationMethod}
                    </span>
                  </div>
                )}
                {aggregatedData.soilMoisture && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💦 Soil Moisture:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.soilMoisture}
                    </span>
                  </div>
                )}
                {aggregatedData.cropRotationPattern && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🔄 Crop Rotation:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.cropRotationPattern}
                    </span>
                  </div>
                )}
                {aggregatedData.majorChallenges && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">⚠️ Challenges:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.majorChallenges}
                    </span>
                  </div>
                )}
                {aggregatedData.harvestSeason && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">📅 Harvest Season:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.harvestSeason}
                    </span>
                  </div>
                )}
                {aggregatedData.fertilizerType && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">🧪 Fertilizer:</span>
                    <span className="text-muted-foreground">
                      {aggregatedData.fertilizerType}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Issues */}
          {allIssues.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-destructive">
                Issues Found:
              </h4>
              <ul className="text-sm text-destructive space-y-1">
                {[...new Set(allIssues)].map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Individual Image Results */}
          {analyses.length > 1 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Individual Image Results:</h4>
              <div className="space-y-3">
                {analyses.map((analysis, index) => (
                  <div key={index} className="border rounded p-3 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        Image {index + 1}
                      </span>
                      <span className="text-lg">
                        {getCategoryIcon(analysis.category)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(analysis.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

ImageAnalysis.displayName = "ImageAnalysis";

export { ImageAnalysis, ImageAnalysisResult };
