
DROP POLICY IF EXISTS "Anyone can submit message" ON public.contact_messages;
CREATE POLICY "Anyone can submit valid message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (
    length(trim(name)) BETWEEN 1 AND 200
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 320
    AND length(trim(subject)) BETWEEN 1 AND 300
    AND length(trim(message)) BETWEEN 1 AND 5000
    AND is_read = false
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND length(email) <= 320
  );
