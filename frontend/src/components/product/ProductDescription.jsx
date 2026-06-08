import { parseDescriptionSections } from '../../utils/productDescription';

const Section = ({ title, icon, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-500 flex items-center gap-2">
      {icon && <span aria-hidden className="text-gold-600/80">{icon}</span>}
      {title}
    </h3>
    {children}
  </div>
);

const Callout = ({ children }) => (
  <div className="border border-gold-600/15 bg-navy-900/60 px-5 py-4 rounded-sm">
    {children}
  </div>
);

const ProductDescription = ({
  productName,
  brandName,
  description,
  parsedColors = [],
  parsedSizes = [],
  isShoe = false,
}) => {
  const sections = parseDescriptionSections(description);
  const colorLines = sections.colors.length ? sections.colors : parsedColors;
  const sizeLines = sections.sizes.length ? sections.sizes : parsedSizes;
  const deliveryLines = sections.delivery.length
    ? sections.delivery
    : sections.footer.filter((l) => /delivery|dispatch|courier|fulfil|confirm/i.test(l));
  const whyLines = sections.why.length
    ? sections.why
    : sections.footer.filter((l) => /prince esquire|curated|support|pricing/i.test(l));
  const otherFooter = sections.footer.filter(
    (l) => !deliveryLines.includes(l) && !whyLines.includes(l)
  );

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-600/60">Product Details</p>
        {brandName && (
          <p className="text-[10px] uppercase tracking-widest text-gold-500/80">{brandName}</p>
        )}
        <h2 className="text-xl md:text-2xl font-serif text-white leading-snug">{productName}</h2>
      </div>

      <div className="space-y-6 text-slate-300/90 text-[15px] leading-[1.75] font-light">
        {sections.intro.map((para) => (
          <p key={para.slice(0, 48)} className="text-slate-200/90">{para}</p>
        ))}
      </div>

      {sections.features.length > 0 && (
        <Section title="Key Features" icon="✦">
          <ul className="space-y-3 pl-1 text-[15px] leading-relaxed text-slate-300/90 font-light">
            {sections.features.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gold-500 shrink-0 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {colorLines.length > 0 && (
        <Section title="Available Color Variants" icon="◆">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1 text-[14px] text-slate-300/90 font-light">
            {colorLines.map((c) => (
              <li key={c} className="flex gap-2 items-center py-1.5 px-3 border border-gold-600/10 bg-navy-900/40">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500/70 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {sizeLines.length > 0 && (
        <Section title={isShoe ? 'Available Sizes (EU)' : 'Available Sizes'} icon="◇">
          <Callout>
            <p className="text-[14px] text-slate-300/90 font-light leading-relaxed">
              {Array.isArray(sizeLines) ? sizeLines.join(' · ') : sizeLines}
            </p>
            {isShoe && (
              <p className="text-[12px] text-slate-500 mt-2">
                Unisex fit — suitable for men and women. Select your size above before adding to cart.
              </p>
            )}
          </Callout>
        </Section>
      )}

      <Section title="Delivery & Service" icon="◎">
        <Callout>
          <ul className="space-y-2 text-[14px] text-slate-300/90 font-light leading-relaxed">
            {(deliveryLines.length ? deliveryLines : [
              'All orders are confirmed by our team before dispatch.',
              'Nairobi CBD and surrounding areas may qualify for in-house rider delivery.',
              'Prepaid orders are shipped via your preferred courier nationwide.',
              'Fulfilment is subject to availability of your selected size and colour.',
            ]).map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-gold-500/70 shrink-0">—</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </Callout>
      </Section>

      <Section title="Why Prince Esquire" icon="★">
          <ul className="space-y-2 text-[14px] text-slate-300/90 font-light">
            {(whyLines.length ? whyLines : [
              'Curated luxury fashion with transparent pricing',
              'Fast, reliable delivery across Kenya',
              'In-store availability at our Nairobi location',
              'Dedicated customer support before and after your purchase',
            ]).map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-gold-500 shrink-0">•</span>
                <span>{line.replace(/^•\s*/, '')}</span>
              </li>
            ))}
          </ul>
      </Section>

      {otherFooter.map((para) => (
        <p key={para.slice(0, 48)} className="text-slate-400/80 text-[14px] leading-relaxed font-light">{para}</p>
      ))}
    </div>
  );
};

export default ProductDescription;
