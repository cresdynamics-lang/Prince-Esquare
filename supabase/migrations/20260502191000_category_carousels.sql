-- Per-category carousel content editable from Admin.
CREATE TABLE IF NOT EXISTS public.category_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT category_carousels_category_unique UNIQUE (category_id)
);

CREATE INDEX IF NOT EXISTS idx_category_carousels_category_id
  ON public.category_carousels (category_id);

CREATE OR REPLACE FUNCTION public.set_category_carousels_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_category_carousels_updated_at ON public.category_carousels;
CREATE TRIGGER trg_category_carousels_updated_at
BEFORE UPDATE ON public.category_carousels
FOR EACH ROW
EXECUTE FUNCTION public.set_category_carousels_updated_at();

INSERT INTO public.category_carousels (category_id, title, description, image_url, is_active)
SELECT
  c.id,
  c.name,
  c.description,
  c.image_url,
  TRUE
FROM public.categories c
ON CONFLICT (category_id) DO NOTHING;

ALTER TABLE public.category_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read category carousels" ON public.category_carousels
FOR SELECT
USING (true);

CREATE POLICY "Admins manage category carousels" ON public.category_carousels
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
