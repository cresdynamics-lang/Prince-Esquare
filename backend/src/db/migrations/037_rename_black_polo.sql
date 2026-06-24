-- Rename the stale polo records to their actual catalog names.

UPDATE products
SET name = 'Classic Pique Polo in Black',
    slug = 'classic-pique-polo-black',
    sku = 'CLASSIC-PIQUE-POLO-BLACK',
    description = 'Classic black pique polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-black';

UPDATE products
SET name = 'Classic Pique Polo in Brown',
    sku = 'CLASSIC-PIQUE-POLO-BROWN',
    description = 'Classic brown polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-brown';

UPDATE products
SET name = 'Classic Pique Polo in Dark Black',
    sku = 'CLASSIC-PIQUE-POLO-DARK-BLACK',
    description = 'Classic dark black polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-dark-black';

UPDATE products
SET name = 'Classic Pique Polo in Light Blue',
    sku = 'CLASSIC-PIQUE-POLO-LIGHT-BLUE',
    description = 'Classic light blue polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-light-blue';

UPDATE products
SET name = 'Classic Pique Polo in Red',
    sku = 'CLASSIC-PIQUE-POLO-RED',
    description = 'Classic red polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-red';

UPDATE products
SET name = 'Classic Pique Polo in White',
    sku = 'CLASSIC-PIQUE-POLO-WHITE',
    description = 'Classic white polo with a clean collar and smart-casual finish.',
    updated_at = NOW()
WHERE slug = 'prince-esquire-polo-white';
