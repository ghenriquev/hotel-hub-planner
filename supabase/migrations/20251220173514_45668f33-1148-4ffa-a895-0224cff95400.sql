-- Create table for manual data edit history
CREATE TABLE public.hotel_manual_data_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_manual_data_id UUID NOT NULL REFERENCES public.hotel_manual_data(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    changes JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_values JSONB DEFAULT '{}'::jsonb,
    edit_type TEXT NOT NULL DEFAULT 'update'
);

-- Enable RLS
ALTER TABLE public.hotel_manual_data_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view history of own hotels"
ON public.hotel_manual_data_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM hotels
        WHERE hotels.id = hotel_manual_data_history.hotel_id
        AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

CREATE POLICY "Users can insert history to own hotels"
ON public.hotel_manual_data_history
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM hotels
        WHERE hotels.id = hotel_manual_data_history.hotel_id
        AND (hotels.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
);

CREATE POLICY "Anyone can insert history for public forms"
ON public.hotel_manual_data_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view history for public forms"
ON public.hotel_manual_data_history
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_hotel_manual_data_history_hotel_id ON public.hotel_manual_data_history(hotel_id);
CREATE INDEX idx_hotel_manual_data_history_edited_at ON public.hotel_manual_data_history(edited_at DESC);