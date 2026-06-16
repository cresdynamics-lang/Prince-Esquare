-- Card payments at POS + shift card total
ALTER TYPE "PosPaymentMethod" ADD VALUE IF NOT EXISTS 'CARD';

ALTER TABLE pos_shifts
  ADD COLUMN IF NOT EXISTS total_card DECIMAL(10, 2) NOT NULL DEFAULT 0;
