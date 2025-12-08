import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, User, ChevronLeft, ChevronRight, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  name?: string;
  text?: string;
  stars?: number;
  publishedAtDate?: string;
  reviewerPhotoUrl?: string;
  responseFromOwnerText?: string;
}

interface ReviewsViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: 'google' | 'tripadvisor' | 'booking';
  reviews: Review[];
  totalCount: number;
}

const SOURCE_LABELS = {
  google: 'Google',
  tripadvisor: 'TripAdvisor',
  booking: 'Booking.com',
};

const ITEMS_PER_PAGE = 20;

function StarRating({ stars }: { stars?: number }) {
  if (!stars) return null;
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const formattedDate = review.publishedAtDate
    ? format(new Date(review.publishedAtDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        {review.reviewerPhotoUrl ? (
          <img
            src={review.reviewerPhotoUrl}
            alt={review.name || 'Reviewer'}
            className="w-10 h-10 object-cover bg-muted"
          />
        ) : (
          <div className="w-10 h-10 bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{review.name || 'Anônimo'}</span>
            <StarRating stars={review.stars} />
          </div>
          
          {formattedDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          )}
        </div>
      </div>
      
      {review.text && (
        <p className="text-sm text-foreground/80 leading-relaxed">{review.text}</p>
      )}
      
      {review.responseFromOwnerText && (
        <div className="bg-muted/50 p-3 border-l-2 border-primary">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-1">
            <MessageSquare className="h-3 w-3" />
            Resposta do proprietário
          </div>
          <p className="text-sm text-muted-foreground">{review.responseFromOwnerText}</p>
        </div>
      )}
    </div>
  );
}

export function ReviewsViewer({ open, onOpenChange, source, reviews, totalCount }: ReviewsViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStars, setFilterStars] = useState<number | null>(null);

  const filteredReviews = filterStars
    ? reviews.filter(r => r.stars === filterStars)
    : reviews;

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (stars: number | null) => {
    setFilterStars(stars);
    setCurrentPage(1);
  };

  // Calculate star distribution
  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.stars === star).length,
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Reviews do {SOURCE_LABELS[source]}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {totalCount} avaliações coletadas
          </p>
        </SheetHeader>

        {/* Star filter */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filterStars === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleFilterChange(null)}
            >
              Todas ({reviews.length})
            </Badge>
            {starDistribution.map(({ star, count }) => (
              <Badge
                key={star}
                variant={filterStars === star ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleFilterChange(star)}
              >
                {star}★ ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {paginatedReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma review encontrada
              </p>
            ) : (
              paginatedReviews.map((review, index) => (
                <ReviewCard key={`${startIndex + index}`} review={review} />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
