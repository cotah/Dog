// Reviews de providers (directory).
export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null; // primeiro nome
  created_at: string | null;
}

export interface ReviewPayload {
  rating: number; // 1-5
  comment?: string | null;
}
