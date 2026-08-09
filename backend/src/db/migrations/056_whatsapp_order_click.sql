-- Allow tracking Sale page WhatsApp Order button clicks
ALTER TABLE site_visitor_events
  DROP CONSTRAINT IF EXISTS site_visitor_events_event_type_check;

ALTER TABLE site_visitor_events
  ADD CONSTRAINT site_visitor_events_event_type_check
  CHECK (event_type IN (
    'page_view',
    'product_click',
    'product_add_cart',
    'whatsapp_order_click'
  ));
