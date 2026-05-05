-- Match the admin workflow language: pending -> confirmed -> processing -> dispatched -> delivered.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'dispatched';

-- Enforce Charles's per-attendant order scope in RLS, not only in the client UI.
DROP POLICY IF EXISTS "Attendants select orders" ON public.orders;
CREATE POLICY "Attendants select orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND (
      public.attendant_permission(auth.uid(), 'view_orders')
      OR public.attendant_permission(auth.uid(), 'update_order_status')
    )
    AND EXISTS (
      SELECT 1
      FROM public.attendant_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.is_active
        AND (
          ap.orders_visibility = 'all'
          OR (
            ap.orders_visibility = 'branch'
            AND ap.branch_location IS NOT NULL
            AND public.orders.fulfillment_branch = ap.branch_location
          )
        )
    )
  );

DROP POLICY IF EXISTS "Attendants select order items" ON public.order_items;
CREATE POLICY "Attendants select order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
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
            AND EXISTS (
              SELECT 1
              FROM public.attendant_profiles ap
              WHERE ap.user_id = auth.uid()
                AND ap.is_active
                AND (
                  ap.orders_visibility = 'all'
                  OR (
                    ap.orders_visibility = 'branch'
                    AND ap.branch_location IS NOT NULL
                    AND o.fulfillment_branch = ap.branch_location
                  )
                )
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Attendants update orders" ON public.orders;
CREATE POLICY "Attendants update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_order_status')
    AND EXISTS (
      SELECT 1
      FROM public.attendant_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.is_active
        AND (
          ap.orders_visibility = 'all'
          OR (
            ap.orders_visibility = 'branch'
            AND ap.branch_location IS NOT NULL
            AND public.orders.fulfillment_branch = ap.branch_location
          )
        )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'staff')
    AND public.attendant_is_active(auth.uid())
    AND public.attendant_permission(auth.uid(), 'update_order_status')
    AND EXISTS (
      SELECT 1
      FROM public.attendant_profiles ap
      WHERE ap.user_id = auth.uid()
        AND ap.is_active
        AND (
          ap.orders_visibility = 'all'
          OR (
            ap.orders_visibility = 'branch'
            AND ap.branch_location IS NOT NULL
            AND public.orders.fulfillment_branch = ap.branch_location
          )
        )
    )
  );
