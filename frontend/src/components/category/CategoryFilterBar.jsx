import { SORT_OPTIONS, FABRIC_OPTIONS } from '../../data/categoryPages';

/**
 * Sticky filter & sort.
 * Default: Price + Sort (+ Fabric on Shirts).
 * Opt-in (Accessories): Subcategory · Color · Size only when Belts is active.
 */
export default function CategoryFilterBar({
  sort,
  onSortChange,
  minPrice,
  maxPrice,
  onMinPrice,
  onMaxPrice,
  showFabricFilter = false,
  selectedFabrics,
  onToggleFabric,
  sortOptions = SORT_OPTIONS,
  subcategories = [],
  selectedSubs,
  onToggleSub,
  showSubcategoryFilter = false,
  colors = [],
  selectedColors,
  onToggleColor,
  showColorFilter = false,
  sizes = [],
  selectedSizes,
  onToggleSize,
  showSizeFilter = false,
}) {
  const showSubs = showSubcategoryFilter && subcategories.length > 0;
  const showColors = showColorFilter && colors.length > 0;
  const showSizes = showSizeFilter && sizes.length > 0;

  return (
    <div className="sticky top-20 z-20 -mx-5 mb-10 border-y border-gold-600/15 bg-navy-950/95 px-5 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-24">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          {showSubs ? (
            <fieldset>
              <legend className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
                Subcategory
              </legend>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  const on = selectedSubs?.has(sub.slug);
                  return (
                    <label
                      key={sub.slug}
                      className={`cursor-pointer border px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
                        on
                          ? 'border-gold-500 bg-gold-600/15 text-gold-300'
                          : 'border-gold-500/15 text-navy-300 hover:border-gold-500/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={Boolean(on)}
                        onChange={() => onToggleSub?.(sub.slug)}
                      />
                      {sub.name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="flex flex-wrap gap-6">
            {showFabricFilter ? (
              <fieldset>
                <legend className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
                  Fabric
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {FABRIC_OPTIONS.map((fab) => {
                    const on = selectedFabrics?.has(fab.id);
                    return (
                      <label
                        key={fab.id}
                        className={`cursor-pointer border px-2.5 py-1 font-sans text-[10px] transition-colors ${
                          on
                            ? 'border-gold-500 bg-gold-600/15 text-gold-300'
                            : 'border-gold-500/15 text-navy-300 hover:border-gold-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={Boolean(on)}
                          onChange={() => onToggleFabric?.(fab.id)}
                        />
                        {fab.label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {showSizes ? (
              <fieldset>
                <legend className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
                  Size
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((size) => {
                    const on = selectedSizes?.has(size);
                    return (
                      <label
                        key={size}
                        className={`cursor-pointer border px-2.5 py-1 font-sans text-[10px] transition-colors ${
                          on
                            ? 'border-gold-500 bg-gold-600/15 text-gold-300'
                            : 'border-gold-500/15 text-navy-300 hover:border-gold-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={Boolean(on)}
                          onChange={() => onToggleSize?.(size)}
                        />
                        {size}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {showColors ? (
              <fieldset>
                <legend className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
                  Color
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {colors.slice(0, 12).map((color) => {
                    const on = selectedColors?.has(color);
                    return (
                      <label
                        key={color}
                        className={`cursor-pointer border px-2.5 py-1 font-sans text-[10px] capitalize transition-colors ${
                          on
                            ? 'border-gold-500 bg-gold-600/15 text-gold-300'
                            : 'border-gold-500/15 text-navy-300 hover:border-gold-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={Boolean(on)}
                          onChange={() => onToggleColor?.(color)}
                        />
                        {color}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <fieldset>
              <legend className="mb-2 font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
                Price range (KSh)
              </legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => onMinPrice(e.target.value)}
                  className="w-24 border border-gold-500/20 bg-navy-900/60 px-2 py-1.5 font-sans text-[11px] text-white outline-none focus:border-gold-500/50"
                />
                <span className="text-navy-500">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => onMaxPrice(e.target.value)}
                  className="w-24 border border-gold-500/20 bg-navy-900/60 px-2 py-1.5 font-sans text-[11px] text-white outline-none focus:border-gold-500/50"
                />
              </div>
            </fieldset>
          </div>
        </div>

        <div className="shrink-0">
          <label className="mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-gold-500/60">
            Sort by
          </label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="min-w-[11rem] border border-gold-500/20 bg-navy-900/80 px-3 py-2 font-sans text-[11px] text-gold-200 outline-none focus:border-gold-500/50"
          >
            {sortOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
