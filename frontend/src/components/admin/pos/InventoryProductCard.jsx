import { useState } from 'react';
import { Store, ShoppingBag, Globe, Pencil, FileText, EyeOff } from 'lucide-react';
import { formatKES } from '../../../lib/format';
import InventoryStockAddPanel from './InventoryStockAddPanel';

const SizeChip = ({ size, stock, outOfStockStyle }) => {
  const out = stock == null ? false : Number(stock) <= 0;
  const qty = stock == null ? null : Number(stock);
  return (
    <span
      title={out ? `${size} — out of stock` : `${size} — ${stock} in stock`}
      className={`inline-flex flex-col items-center justify-center min-w-[2.5rem] px-2 py-1 text-[10px] font-bold border rounded ${
        out && outOfStockStyle
          ? 'border-red-500/40 bg-red-500/10 text-red-400/90 line-through opacity-70'
          : out
            ? 'border-slate-600/40 bg-slate-800/40 text-slate-500'
            : 'border-gold-500/30 bg-gold-500/10 text-gold-200'
      }`}
    >
      <span>{size}</span>
      {qty != null && !out && (
        <span className="text-[9px] font-normal text-gold-400/80 tabular-nums">{qty}</span>
      )}
      {out && outOfStockStyle && (
        <span className="text-[8px] font-normal text-red-400/70 no-underline">OUT</span>
      )}
    </span>
  );
};

const publishStatus = (p) => {
  const live = p.on_website ?? (p.website_product_id && p.website_published);
  if (live) return { label: 'Live on website', cls: 'bg-emerald-500/15 text-emerald-400' };
  if (p.website_product_id) return { label: 'Hidden on website', cls: 'bg-amber-500/15 text-amber-400' };
  if (p.website_details || p.description) return { label: 'Draft — ready to publish', cls: 'bg-sky-500/15 text-sky-300' };
  return { label: 'Inventory only', cls: 'bg-navy-800 text-gold-500/50' };
};

const InventoryProductCard = ({
  product,
  onEdit,
  onPublish,
  onUnpublish,
  onTransferIn,
  onTransferOut,
  onThresholdChange,
  onStockAdded,
  readOnly = false,
  selected = false,
  onSelectToggle,
}) => {
  const [thresholdDraft, setThresholdDraft] = useState(String(product.low_stock_threshold ?? ''));
  const [addOpen, setAddOpen] = useState(false);
  const inShop = (product.currentQty ?? 0) > 0;
  const liveOnWeb = product.on_website ?? (product.website_product_id && product.website_published);
  const showImage = liveOnWeb && product.website_thumbnail;
  const colorGroups = product.color_groups || [];
  const hasVariants = colorGroups.length > 0;
  const status = publishStatus(product);
  const isLow = product.low_stock_threshold != null && (product.currentQty ?? 0) <= product.low_stock_threshold;

  return (
    <article className={`bg-navy-950/60 border rounded-xl overflow-hidden ${selected ? 'border-gold-500/50 ring-1 ring-gold-500/20' : 'border-gold-500/15'}`}>
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {onSelectToggle && (
          <label className="flex items-start pt-1 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectToggle}
              className="mt-1 rounded border-gold-500/30 bg-navy-950 text-gold-500 focus:ring-gold-500/40"
            />
          </label>
        )}
        {showImage ? (
          <div className="shrink-0 w-full sm:w-28 h-28 bg-white rounded-lg overflow-hidden border border-gold-500/10">
            <img src={product.website_thumbnail} alt="" className="w-full h-full object-contain p-1" />
          </div>
        ) : (
          <div className="shrink-0 w-full sm:w-44 min-h-[7rem] bg-navy-900/80 rounded-lg border border-gold-500/10 p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-gold-500/50">
              <FileText size={12} />
              <span className="text-[10px]   font-bold">Inventory record</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed flex-1">
              {product.description ||
                `${product.name} — ${product.category || 'Uncategorized'}. Not published to the website yet. Edit to add details and publish when ready.`}
            </p>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-white font-medium leading-snug">{product.name}</h4>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setAddOpen((o) => !o)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      addOpen
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-emerald-600/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/25'
                    }`}
                  >
                    Add
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gold-500/50 font-mono mt-0.5">{product.sku}</p>
              <p className="text-[10px] text-gold-500/40 mt-0.5">
                {product.website_category_name || product.category}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-gold-400 text-sm">{formatKES(product.website_price ?? product.shop_price)}</p>
              {product.website_discount_price && (
                <p className="text-[10px] text-slate-500 line-through">{formatKES(product.website_price)}</p>
              )}
              <p className="text-[10px] text-gold-500/40 mt-0.5">Shop {formatKES(product.shop_price)}</p>
              {product.store_price != null && product.store_price !== product.shop_price && (
                <p className="text-[10px] text-violet-400/80 mt-0.5">Store {formatKES(product.store_price)}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.cls}`}>{status.label}</span>
            {inShop ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                Available in shop
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25">
                Not in shop
              </span>
            )}
            {isLow && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300">Low stock alert</span>
            )}
            <span className="text-[10px] text-sky-300/90 flex items-center gap-1">
              <Store size={11} /> Store {product.storeQty ?? 0}
            </span>
            <span className="text-[10px] text-gold-400/90 flex items-center gap-1">
              <ShoppingBag size={11} /> Shop {product.currentQty ?? 0}
            </span>
          </div>

          {onThresholdChange && !readOnly && (
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gold-500/50  ">Low at</span>
              <input
                type="number"
                min={0}
                value={thresholdDraft}
                onChange={(e) => setThresholdDraft(e.target.value)}
                className="w-14 bg-navy-950 border border-gold-500/20 rounded px-2 py-1 text-white"
              />
              <button
                type="button"
                onClick={() => onThresholdChange(product, Number(thresholdDraft) || 0)}
                className="text-gold-400 hover:text-gold-300 underline"
              >
                Save
              </button>
            </div>
          )}

          {showImage && product.description && (
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{product.description}</p>
          )}
        </div>
      </div>

      {hasVariants && (
        <div className="px-4 pb-4 space-y-3 border-t border-gold-500/10 pt-3 mx-4">
          <p className="text-[10px]   text-gold-500/50">
            {liveOnWeb ? 'Colors & sizes (shop floor count)' : 'Colors & sizes (draft — publish to go live)'}
          </p>
          {colorGroups.map((group) => {
            const sizes = group.sizes || [];
            const allOut = liveOnWeb && sizes.length > 0 && sizes.every((s) => (s.stock ?? 0) <= 0);
            return (
              <div
                key={group.color || 'default'}
                className={`rounded-lg p-3 border ${
                  allOut ? 'border-red-500/25 bg-red-500/5' : 'border-gold-500/10 bg-navy-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {liveOnWeb && group.image_url && (
                    <img src={group.image_url} alt="" className="w-8 h-8 rounded object-cover border border-gold-500/10" />
                  )}
                  <p className={`text-xs font-medium ${allOut ? 'text-red-400/90 line-through' : 'text-gold-300/90'}`}>
                    {group.color || 'Original'}
                    {allOut && <span className="ml-2 text-[10px] no-underline text-red-400/70">(color out of stock)</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s) => (
                    <SizeChip
                      key={`${group.color}-${s.size}`}
                      size={s.size}
                      stock={s.stock}
                      outOfStockStyle={liveOnWeb}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hasVariants && product.variant_count > 0 && !addOpen && (
        <p className="px-4 pb-3 text-[10px] text-gold-500/40">Click Add to update stock by size.</p>
      )}

      {addOpen && !readOnly && (
        <InventoryStockAddPanel
          product={product}
          onCancel={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            onStockAdded?.();
          }}
        />
      )}

      <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1 border-t border-gold-500/5 mx-0">
        {!readOnly && (
          <>
        <button type="button" onClick={() => onEdit(product)} className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white rounded text-[10px] font-medium">
          <Pencil size={12} /> Edit details
        </button>
        <button type="button" onClick={() => onTransferIn(product)} className="px-3 py-1.5 bg-gold-600/20 text-gold-300 border border-gold-500/30 rounded text-[10px]">
          Store → Shop
        </button>
        <button type="button" onClick={() => onTransferOut(product)} className="px-3 py-1.5 border border-gold-500/20 text-gold-400 rounded text-[10px]">
          Shop → Store
        </button>
        <button type="button" onClick={() => onPublish(product)} className="flex items-center gap-1 px-3 py-1.5 border border-gold-500/25 text-gold-400 rounded text-[10px] ml-auto">
          <Globe size={12} />
          {product.website_product_id ? 'Update web' : 'Publish to website'}
        </button>
        {product.website_product_id && onUnpublish && (
          <button type="button" onClick={() => onUnpublish(product)} className="flex items-center gap-1 px-3 py-1.5 border border-red-500/25 text-red-400 rounded text-[10px]">
            <EyeOff size={12} /> Unpublish
          </button>
        )}
          </>
        )}
      </div>
    </article>
  );
};

export default InventoryProductCard;
