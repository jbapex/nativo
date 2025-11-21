import React, { useState, useEffect } from "react";
import { Reviews as ReviewsAPI, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoginDialog from "@/components/LoginDialog";

export default function ProductReviews({ productId }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ total_reviews: 0, average_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    loadReviews();
    checkUser();
  }, [productId]);

  const checkUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, averageData] = await Promise.all([
        ReviewsAPI.getByProduct(productId),
        ReviewsAPI.getAverage(productId)
      ]);
      setReviews(reviewsData || []);
      setAverageRating(averageData || { total_reviews: 0, average_rating: 0 });
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    if (!reviewForm.rating) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma avaliação",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await ReviewsAPI.create({
        product_id: productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || null
      });

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi publicada com sucesso",
      });

      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      loadReviews();
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a avaliação",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Avaliações</CardTitle>
            {averageRating.total_reviews > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold">{averageRating.average_rating}</span>
                </div>
                <span className="text-gray-500">
                  ({averageRating.total_reviews} {averageRating.total_reviews === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {user && !showReviewForm && (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="mb-6"
            >
              Escrever uma Avaliação
            </Button>
          )}

          {showReviewForm && (
            <Card className="mb-6 border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label>Sua Avaliação</Label>
                    {renderStars(reviewForm.rating, true, (rating) => {
                      setReviewForm(prev => ({ ...prev, rating }));
                    })}
                  </div>
                  <div>
                    <Label htmlFor="comment">Comentário (opcional)</Label>
                    <Textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Compartilhe sua experiência com este produto..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submitting}
                    >
                      {submitting ? "Enviando..." : "Enviar Avaliação"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewForm({ rating: 5, comment: "" });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando avaliações...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>Nenhuma avaliação ainda</p>
              <p className="text-sm mt-2">Seja o primeiro a avaliar este produto!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.user_name || "Usuário"}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
}

