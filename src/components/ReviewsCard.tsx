import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Star, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useHotelReviews } from "@/hooks/useHotelReviews";
import { ReviewsModal } from "./ReviewsModal";

interface ReviewsCardProps {
  hotelId: string;
  hotelUrls: {
    google_business_url?: string | null;
    tripadvisor_url?: string | null;
    booking_url?: string | null;
  };
}

export function ReviewsCard({ hotelId, hotelUrls }: ReviewsCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { 
    loading, 
    getTotalReviewsCount, 
    hasAnyCompleted, 
    isAnyCrawling 
  } = useHotelReviews(hotelId);

  const totalReviews = getTotalReviewsCount();
  const hasCompleted = hasAnyCompleted();
  const isCrawling = isAnyCrawling();

  // Calculate readiness
  const availableSources = [
    hotelUrls.google_business_url && 'Google Maps',
    hotelUrls.tripadvisor_url && 'TripAdvisor',
    hotelUrls.booking_url && 'Booking.com'
  ].filter(Boolean) as string[];

  const missingSources = [
    !hotelUrls.google_business_url && 'Google Maps',
    !hotelUrls.tripadvisor_url && 'TripAdvisor',
    !hotelUrls.booking_url && 'Booking.com'
  ].filter(Boolean) as string[];

  const isReadyToStart = availableSources.length > 0;

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Carregando...</Badge>;
    }
    if (isCrawling) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Coletando...</Badge>;
    }
    if (hasCompleted) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> {totalReviews} reviews</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
  };

  const getReadinessBadge = () => {
    // Don't show readiness if already completed or crawling
    if (hasCompleted || isCrawling || loading) return null;

    if (isReadyToStart) {
      return (
        <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Pronto para iniciar
        </span>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="ml-auto text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-amber-500/20 transition-colors">
            <AlertCircle className="h-3 w-3" />
            URLs pendentes
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-3" align="end">
          <p className="font-medium text-sm mb-2">URLs não configuradas:</p>
          <ul className="text-sm space-y-1">
            {missingSources.map(source => (
              <li key={source} className="flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {source}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Star className="h-4 w-4 text-yellow-500" />
          Avaliações
          {getReadinessBadge()}
        </label>
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
          </div>
          
          {hasCompleted && (
            <p className="text-xs text-muted-foreground">
              Reviews coletadas de Google, TripAdvisor e Booking
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setModalOpen(true)}
          >
            {hasCompleted ? 'Ver Avaliações' : 'Coletar Reviews'}
          </Button>
        </div>
      </div>

      <ReviewsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        hotelId={hotelId}
        hotelUrls={hotelUrls}
      />
    </>
  );
}
