-- RBAC: shop attendants (staff + attendant_profiles), stock audit, activity log, order branch.

-- ---------------------------------------------------------------------------
-- Attendant profiles (permissions JSON; staff role required on user_roles)
-- ---------------------------------------------------------------------------
CREATE TABLE public.attendant_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  branch_location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  orders_visibility TEXT NOT NULL DEFAULT 'all' CHECK (orders_visibility IN ('all', 'branch')),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_attendant_profiles_updated
  BEFORE UPDATE ON public.attendant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.attendant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendants read own profile" ON public.attendant_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read all attendant profiles" ON public.attendant_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage attendant profiles" ON public.attendant_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- Stock adjustments audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add', 'remove')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_adjustments_variant ON public.stock_adjustments (variant_id);
CREATE INDEX idx_stock_adjustments_created ON public.stock_adjustments (created_at DESC);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read stock adjustments" ON public.stock_adjustments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff with product access read stock adjustments" ON public.stock_adjustments
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND EXISTS (
      SELECT 1 FROM public.attendant_profiles ap
      WHERE ap.user_id = auth.uid() AND ap.is_active
        AND (
          COALESCE((ap.permissions ->> 'view_products')::boolean, false)
          OR COALESCE((ap.permissions ->> 'update_products')::boolean, false)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Admin / attendant activity log
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_activity_log_created ON public.admin_activity_log (created_at DESC);
CREATE INDEX idx_admin_activity_log_user ON public.admin_activity_log (user_id);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all activity" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants read own activity" ON public.admin_activity_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Product low-stock threshold (per product; variants compared to this)
-- ---------------------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5
  CHECK (low_stock_threshold >= 0);

-- ---------------------------------------------------------------------------
-- Orders: optional fulfillment branch for location-scoped attendants
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_branch TEXT;

-- ---------------------------------------------------------------------------
-- Contact messages: staff reply
-- ---------------------------------------------------------------------------
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS staff_reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Permission helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attendant_is_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendant_profiles ap
    WHERE ap.user_id = _user_id AND ap.is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.attendant_permission(_user_id UUID, _key TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT (ap.permissions ->> _key)::boolean
      FROM public.attendant_profiles ap
      WHERE ap.user_id = _user_id AND ap.is_active
      LIMIT 1
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.attendant_may_access_admin_panel(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
  OR (
    public.has_role(_user_id, 'staff')
    AND EXISTS (
      SELECT 1 FROM public.attendant_profiles ap
      WHERE ap.user_id = _user_id AND ap.is_active
        AND ap.permissions IS NOT NULL
        AND ap.permissions != '{}'::jsonb
        AND EXISTS (
          SELECT 1
          FROM jsonb_each_text(ap.permissions) AS kv(key, val)
          WHERE lower(trim(val)) IN ('true', '1', 'yes')
        )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_may_access_admin_panel()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.attendant_may_access_admin_panel(auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.current_user_may_access_admin_panel() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Log activity (client-safe: only inserts for auth.uid())
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_new_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF trim(coalesce(p_action, '')) = '' THEN
    RAISE EXCEPTION 'Action required';
  END IF;
  IF NOT (
    public.has_role(v_uid, 'admin')
    OR (
      public.has_role(v_uid, 'staff')
      AND public.attendant_is_active(v_uid)
    )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.admin_activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (v_uid, trim(p_action), NULLIF(trim(p_entity_type), ''), NULLIF(trim(p_entity_id), ''), p_metadata)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_activity(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ---------------------------------------------------------------------------
-- Stock adjustment RPC (required reason; admin or update_products)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_stock_adjustment(
  p_variant_id UUID,
  p_adjustment_type TEXT,
  p_quantity INTEGER,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_old INTEGER;
  v_product UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF trim(coalesce(p_reason, '')) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive number';
  END IF;
  IF p_adjustment_type NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'Invalid adjustment type';
  END IF;

  IF NOT (
    public.has_role(v_user, 'admin')
    OR (
      public.has_role(v_user, 'staff')
      AND public.attendant_is_active(v_user)
      AND public.attendant_permission(v_user, 'update_products')
    )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT pv.stock_quantity, pv.product_id
  INTO v_old, v_product
  FROM public.product_variants pv
  WHERE pv.id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;

  IF p_adjustment_type = 'add' THEN
    UPDATE public.product_variants
    SET stock_quantity = v_old + p_quantity
    WHERE id = p_variant_id;
  ELSE
    IF v_old < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock';
    END IF;
    UPDATE public.product_variants
    SET stock_quantity = v_old - p_quantity
    WHERE id = p_variant_id;
  END IF;

  INSERT INTO public.stock_adjustments (
    product_id, variant_id, user_id, adjustment_type, quantity, reason
  ) VALUES (
    v_product, p_variant_id, v_user, p_adjustment_type, p_quantity, trim(p_reason)
  );

  INSERT INTO public.admin_activity_log (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_user,
    'stock_adjustment',
    'product_variant',
    p_variant_id::text,
    jsonb_build_object(
      'adjustment_type', p_adjustment_type,
      'quantity', p_quantity,
      'reason', trim(p_reason),
      'previous_stock', v_old,
      'product_id', v_product
    )
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_stock_adjustment(UUID, TEXT, INTEGER, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Orders: tighten SELECT — admin all rows; attendants only with view_orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff view all orders" ON public.orders;

CREATE POLICY "Admins select all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Attendants select orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND (
      public.attendant_permission(auth.uid(), 'view_orders')
      OR public.attendant_permission(auth.uid(), 'update_order_status')
    )
  );

-- Order items: re-scope staff read to attendants with view_orders (admin already sees via orders access in subquery)
DROP POLICY IF EXISTS "Staff view all order items" ON public.order_items;

CREATE POLICY "Attendants select order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (
          public.has_role(auth.uid(), 'admin')
          OR (
            public.has_role(auth.uid(), 'staff')
            AND public.attendant_is_active(auth.uid())
            AND (
              public.attendant_permission(auth.uid(), 'view_orders')
              OR public.attendant_permission(auth.uid(), 'update_order_status')
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Orders: attendants with update_order_status may update (RLS)
-- ---------------------------------------------------------------------------
CREATE POLICY "Attendants update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_order_status')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_order_status')
  );

-- ---------------------------------------------------------------------------
-- Product variants: attendants with update_products may update stock rows
-- ---------------------------------------------------------------------------
CREATE POLICY "Attendants update variants" ON public.product_variants
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_products')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_products')
  );

-- ---------------------------------------------------------------------------
-- Products: attendants with update_products may update (not delete — no DELETE policy)
-- ---------------------------------------------------------------------------
CREATE POLICY "Attendants update products" ON public.products
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_products')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_products')
  );

-- ---------------------------------------------------------------------------
-- Contact messages: attendants with respond_messages
-- ---------------------------------------------------------------------------
CREATE POLICY "Attendants update messages reply" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'respond_messages')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'respond_messages')
  );

-- Replace legacy staff-wide message read with permission-based access
DROP POLICY IF EXISTS "Staff view messages" ON public.contact_messages;

CREATE POLICY "Admins and attendants read messages" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'staff')
      AND public.attendant_is_active(auth.uid())
      AND (
        public.attendant_permission(auth.uid(), 'view_messages')
        OR public.attendant_permission(auth.uid(), 'respond_messages')
      )
    )
  );
