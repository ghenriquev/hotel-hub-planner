import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, MapPin, RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2, ExternalLink, Eye } from "lucide-react";
import { useHotelReviews, ReviewData } from "@/hooks/useHotelReviews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ReviewsViewer } from "./ReviewsViewer";

// Normalized review interface expected by ReviewsViewer
interface NormalizedReview {
  name?: string;
  text?: string;
  stars?: number;
  publishedAtDate?: string;
  reviewerPhotoUrl?: string;
  responseFromOwnerText?: string;
}

// Normalize reviews from different sources to a common format
function normalizeReviews(source: 'google' | 'tripadvisor' | 'booking', rawReviews: any[]): NormalizedReview[] {
  if (!rawReviews || !Array.isArray(rawReviews)) return [];

  return rawReviews.map((review) => {
    switch (source) {
      case 'booking':
        // Booking.com format: userName, rating (1-10), reviewTitle, likedText, dislikedText, reviewDate, userAvatar, propertyResponse
        const textParts: string[] = [];
        if (review.reviewTitle) textParts.push(`**${review.reviewTitle}**`);
        if (review.likedText) textParts.push(`👍 ${review.likedText}`);
        if (review.dislikedText) textParts.push(`👎 ${review.dislikedText}`);
        
        return {
          name: review.userName || review.name,
          text: textParts.length > 0 ? textParts.join('\n\n') : review.text,
          stars: review.rating ? Math.round(review.rating / 2) : review.stars,
          publishedAtDate: review.reviewDate || review.publishedAtDate,
          reviewerPhotoUrl: review.userAvatar || review.reviewerPhotoUrl,
          responseFromOwnerText: review.propertyResponse || review.responseFromOwnerText,
        };

      case 'tripadvisor':
        // TripAdvisor may have different field names - normalize them
        return {
          name: review.user?.username || review.name,
          text: review.text || review.reviewText,
          stars: review.rating || review.stars,
          publishedAtDate: review.publishedDate || review.publishedAtDate,
          reviewerPhotoUrl: review.user?.avatar || review.reviewerPhotoUrl,
          responseFromOwnerText: review.ownerResponse?.text || review.responseFromOwnerText,
        };

      case 'google':
      default:
        // Google format is already compatible with our interface
        return {
          name: review.name,
          text: review.text,
          stars: review.stars,
          publishedAtDate: review.publishedAtDate,
          reviewerPhotoUrl: review.reviewerPhotoUrl,
          responseFromOwnerText: review.responseFromOwnerText,
        };
    }
  });
}

interface ReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  hotelUrls: {
    google_business_url?: string | null;
    tripadvisor_url?: string | null;
    booking_url?: string | null;
  };
}

const SOURCE_CONFIG = {
  google: {
    label: 'Google',
    icon: MapPin,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  tripadvisor: {
    label: 'TripAdvisor',
    icon: Star,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  booking: {
    label: 'Booking.com',
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
};

function SourceCard({ 
  source, 
  data, 
  url, 
  onCrawl, 
  onViewReviews,
  isCrawling 
}: { 
  source: 'google' | 'tripadvisor' | 'booking';
  data?: ReviewData;
  url?: string | null;
  onCrawl: () => void;
  onViewReviews: () => void;
  isCrawling: boolean;
}) {
  const config = SOURCE_CONFIG[source];
  const Icon = config.icon;
  const status = data?.status || 'pending';
  const hasUrl = !!url;
  const hasReviews = status === 'completed' && (data?.reviews_count || 0) > 0;

  const getStatusBadge = () => {
    if (!hasUrl) {
      return <Badge variant="outline" className="text-muted-foreground">URL não cadastrada</Badge>;
    }
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Coletado</Badge>;
      case 'crawling':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Coletando...</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erro</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
    }
  };

  return (
    <div className="border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 flex items-center justify-center ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <span className="font-medium">{config.label}</span>
        </div>
        {getStatusBadge()}
      </div>

      {data?.reviews_count !== undefined && data.reviews_count > 0 && (
        <div className="text-2xl font-bold">{data.reviews_count} reviews</div>
      )}

      {data?.crawled_at && (
        <p className="text-xs text-muted-foreground">
          Coletado em {format(new Date(data.crawled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      )}

      {/* Progress indicator during crawling */}
      {status === 'crawling' && (
        <div className="space-y-2 py-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data?.items_collected || 0} reviews coletados</span>
            <span>{data?.crawl_progress || 0}%</span>
          </div>
          <Progress value={data?.crawl_progress || 0} className="h-2" />
          {data?.progress_message && (
            <p className="text-xs text-muted-foreground animate-pulse">{data.progress_message}</p>
          )}
        </div>
      )}

      {data?.error_message && (
        <p className="text-xs text-destructive">{data.error_message}</p>
      )}

      {url && (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Ver perfil <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <div className="flex gap-2">
        {hasReviews && (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onViewReviews}
          >
            <Eye className="h-4 w-4 mr-2" /> Ver Reviews
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className={hasReviews ? "" : "w-full"}
          onClick={onCrawl}
          disabled={!hasUrl || isCrawling || status === 'crawling'}
        >
          {status === 'crawling' ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Coletando...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" /> {status === 'completed' ? 'Atualizar' : 'Coletar'}</>
          )}
        </Button>
      </div>
    </div>
  );
}

export function ReviewsModal({ open, onOpenChange, hotelId, hotelUrls }: ReviewsModalProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSource, setViewerSource] = useState<'google' | 'tripadvisor' | 'booking'>('google');
  
  const { 
    loading, 
    crawling, 
    crawlReviews, 
    getSourceData, 
    getTotalReviewsCount,
    getLastCrawledAt,
    isAnyCrawling,
  } = useHotelReviews(hotelId);

  const handleCrawlAll = async () => {
    try {
      await crawlReviews('all');
      toast.success('Coleta de avaliações iniciada');
    } catch (err) {
      toast.error('Erro ao coletar avaliações');
    }
  };

  const handleCrawlSource = async (source: 'google' | 'tripadvisor' | 'booking') => {
    try {
      await crawlReviews(source);
      toast.success(`Coleta de ${SOURCE_CONFIG[source].label} iniciada`);
    } catch (err) {
      toast.error(`Erro ao coletar ${SOURCE_CONFIG[source].label}`);
    }
  };

  const handleViewReviews = (source: 'google' | 'tripadvisor' | 'booking') => {
    setViewerSource(source);
    setViewerOpen(true);
  };

  const totalReviews = getTotalReviewsCount();
  const lastCrawled = getLastCrawledAt();
  const anyMissingUrl = !hotelUrls.google_business_url || !hotelUrls.tripadvisor_url || !hotelUrls.booking_url;
  const isBusy = crawling || isAnyCrawling();

  const currentSourceData = getSourceData(viewerSource);
  const rawReviews = (currentSourceData?.reviews_data as any[]) || [];
  const currentReviews = normalizeReviews(viewerSource, rawReviews);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Avaliações do Hotel
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Source Cards */}
              <div className="grid grid-cols-1 gap-3">
                <SourceCard
                  source="google"
                  data={getSourceData('google')}
                  url={hotelUrls.google_business_url}
                  onCrawl={() => handleCrawlSource('google')}
                  onViewReviews={() => handleViewReviews('google')}
                  isCrawling={isBusy}
                />
                <SourceCard
                  source="tripadvisor"
                  data={getSourceData('tripadvisor')}
                  url={hotelUrls.tripadvisor_url}
                  onCrawl={() => handleCrawlSource('tripadvisor')}
                  onViewReviews={() => handleViewReviews('tripadvisor')}
                  isCrawling={isBusy}
                />
                <SourceCard
                  source="booking"
                  data={getSourceData('booking')}
                  url={hotelUrls.booking_url}
                  onCrawl={() => handleCrawlSource('booking')}
                  onViewReviews={() => handleViewReviews('booking')}
                  isCrawling={isBusy}
                />
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total coletado</p>
                    <p className="text-2xl font-bold">{totalReviews} avaliações</p>
                    {lastCrawled && (
                      <p className="text-xs text-muted-foreground">
                        Última coleta: {format(new Date(lastCrawled), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleCrawlAll}
                    disabled={isBusy || anyMissingUrl}
                  >
                    {isBusy ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Coletando...</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Atualizar Todas</>
                    )}
                  </Button>
                </div>

                {anyMissingUrl && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Algumas URLs de plataformas não estão cadastradas. Edite o hotel para adicionar.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewsViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        source={viewerSource}
        reviews={currentReviews}
        totalCount={currentSourceData?.reviews_count || 0}
      />
    </>
  );
}
