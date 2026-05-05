function titleCase(value) {
  return String(value || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function inferCategorySlugFromText(text) {
  const value = normalizeText(text);
  if (/(sock)/.test(value)) return "socks";
  if (/(polo)/.test(value)) return "polo-t-shirts";
  if (/(shoe|loafer|oxford|boot|sandal)/.test(value)) return "shoes";
  if (/(three-piece|3 piece|3-piece|two-piece|2 piece|wedding suit|suit)/.test(value) && !/(track)/.test(value)) {
    return "suits";
  }
  if (/(blazer)/.test(value)) return "blazers";
  if (/(track|jogger|athleisure)/.test(value)) return "track-suits";
  if (/(jacket|coat|bomber|gilet|vest)/.test(value)) return "jackets";
  if (/(khaki|chino|jean|gurkha|trouser|pant)/.test(value)) return "trousers";
  if (/(linen)/.test(value)) return "linen";
  if (/(cap|hat)/.test(value)) return "caps-hats";
  if (/(belt|tie)/.test(value)) return "belts-ties";
  if (/(sweater|knitwear|cardigan|pullover)/.test(value)) return "sweaters";
  if (/(t-shirt|tee|sweat-shirt|sweatshirt|round-neck|round neck|v-neck|v neck)/.test(value)) {
    return "t-shirts";
  }
  if (/(shirt|presidential)/.test(value)) return "shirts";
  return "shirts";
}

function baseProfile(categorySlug) {
  const profiles = {
    suits: {
      categoryName: "Suits",
      material: "a premium suiting blend with a refined drape",
      fit: "a structured tailored fit that sharpens the shoulders and line of the leg",
      occasion: "weddings, business functions, church services, and formal evening plans",
      styling: "pairs effortlessly with polished shoes, crisp shirts, and clean accessories",
      care: "dry clean to preserve the structure, finish, and long-term shape",
      description:
        "Tailored two-piece and three-piece suits for weddings, business dressing, and premium formal moments.",
    },
    shirts: {
      categoryName: "Shirts",
      material: "a breathable shirting fabric chosen for comfort and a cleaner finish",
      fit: "a modern fit that stays easy through the body without looking loose",
      occasion: "office dressing, dinners, celebrations, and elevated everyday wear",
      styling: "works well tucked into trousers, layered under blazers, or styled open for relaxed polish",
      care: "machine wash cold and finish with a warm iron for the sharpest result",
      description:
        "Formal, casual, and presidential shirts selected for clean tailoring, easy layering, and all-day comfort.",
    },
    shoes: {
      categoryName: "Shoes",
      material: "a durable upper with a comfort-led interior and dependable sole grip",
      fit: "a supportive shape built for confident all-day wear",
      occasion: "workdays, events, smart travel, and dressed-up weekend outfits",
      styling: "grounds tailoring, denim, and smart-casual looks with a more finished edge",
      care: "wipe clean, air out after wear, and store with support to help maintain shape",
      description:
        "Formal shoes, loafers, boots, sandals, and casual pairs chosen to finish every outfit with confidence.",
    },
    blazers: {
      categoryName: "Blazers",
      material: "a structured tailoring fabric that keeps the silhouette looking clean",
      fit: "a sharp layer-friendly cut with room for shirts and light knitwear underneath",
      occasion: "meetings, dinners, celebrations, and refined smart-casual dressing",
      styling: "easy to pair with trousers, denim, or chinos when a full suit feels unnecessary",
      care: "spot clean where possible and dry clean when needed to protect the structure",
      description:
        "Structured blazers that add instant refinement to trousers, denim, and dressed-up off-duty looks.",
    },
    "track-suits": {
      categoryName: "Track Suits",
      material: "a lightweight performance-inspired fabric designed for comfort and movement",
      fit: "an athletic modern cut that stays neat without feeling restrictive",
      occasion: "travel, active days, casual errands, and clean off-duty styling",
      styling: "wear together for a matched look or break the set up with basics for daily rotation",
      care: "machine wash cold and air dry for longer-lasting colour and fabric recovery",
      description:
        "Matching track suits and athleisure sets that combine comfort, movement, and a clean modern profile.",
    },
    jackets: {
      categoryName: "Jackets",
      material: "a dependable outerwear fabric chosen for texture, structure, and repeat wear",
      fit: "a versatile layer-ready shape that sits clean over tees, shirts, and knitwear",
      occasion: "cool mornings, evening outings, travel days, and transitional-weather dressing",
      styling: "adds depth quickly to simple outfits without overcomplicating the look",
      care: "follow the garment label and avoid excessive heat to protect the outer finish",
      description:
        "Outerwear edits spanning everyday jackets, denim layers, and half jackets for cooler days and smarter layering.",
    },
    trousers: {
      categoryName: "Trousers",
      material: "a woven fabric selected for comfort, shape retention, and daily reliability",
      fit: "a clean leg line that balances polish with easy movement",
      occasion: "office wear, city errands, dinners, travel, and repeat smart-casual use",
      styling: "pairs cleanly with shirts, polos, knitwear, and both formal and relaxed footwear",
      care: "gentle wash or dry clean depending on fabric weight, then press on low heat",
      description:
        "Khaki, formal, chino, denim, and gurkha trousers tailored for daily wear, office polish, and sharper casual outfits.",
    },
    linen: {
      categoryName: "Linen",
      material: "a breathable linen-led fabric that keeps the look light and comfortable",
      fit: "an easy refined fit designed for movement in warmer weather",
      occasion: "sunny workdays, holidays, garden events, brunches, and warm-weather occasions",
      styling: "works best with loafers, sandals, open-collar shirts, and clean minimal layers",
      care: "gentle wash or dry clean to preserve the natural texture and relaxed drape",
      description:
        "Breathable linen sets, trousers, shirts, and shorts made for warm weather and effortless refinement.",
    },
    "caps-hats": {
      categoryName: "Caps & Hats",
      material: "a durable headwear build designed for comfort, structure, and repeat styling",
      fit: "an easy everyday profile with a balanced crown and wearable shape",
      occasion: "travel, weekend looks, casual dressing, and adding personality to simple outfits",
      styling: "an easy finishing touch when the outfit needs texture, shade, or attitude",
      care: "spot clean and store out of direct heat to help maintain the shape",
      description:
        "Caps and hats that add texture, shade, and personality to casual and elevated everyday outfits.",
    },
    "belts-ties": {
      categoryName: "Belts & Ties",
      material: "quality accessory construction designed to keep its finish and presentation",
      fit: "a smart, practical profile made to complete a polished outfit",
      occasion: "formalwear, office dressing, events, and sharper smart-casual styling",
      styling: "the fastest way to make suiting and dress separates look more intentional",
      care: "store neatly after wear and avoid excessive moisture or direct heat exposure",
      description:
        "Belts and ties selected to sharpen suiting, smart-casual looks, and everyday finishing details.",
    },
    socks: {
      categoryName: "Socks",
      material: "a comfort-focused knit built for softness, breathability, and daily wear",
      fit: "an easy flexible fit that stays comfortable through longer days",
      occasion: "office dressing, daily routines, events, and dependable everyday rotation",
      styling: "keeps formal shoes, loafers, and casual pairs feeling more complete and comfortable",
      care: "machine wash cold and air dry when possible to protect the stretch and feel",
      description:
        "Comfort-led socks for daily wear, office dressing, and the finishing detail that keeps smarter looks complete.",
    },
    sweaters: {
      categoryName: "Sweaters",
      material: "a soft knit fabric chosen for warmth, texture, and easy layering",
      fit: "a comfortable modern shape that layers neatly without bulk",
      occasion: "cool-weather commutes, office layering, relaxed evenings, and travel dressing",
      styling: "works over shirts, under jackets, or with trousers and denim for effortless balance",
      care: "hand wash or use a gentle cycle to help preserve the knit finish",
      description:
        "Sweaters and knitwear built for warmth, texture, and dependable layering through cooler mornings and evenings.",
    },
    "polo-t-shirts": {
      categoryName: "Polo T-shirts",
      material: "a soft polo fabric with breathable comfort and an elevated casual hand feel",
      fit: "a clean modern cut that stays flattering without feeling overfitted",
      occasion: "weekend plans, travel, office-casual days, and easy smart dressing",
      styling: "wear it with chinos, denim, shorts, or layered under light outerwear",
      care: "machine wash cold and reshape lightly after washing for the best finish",
      description:
        "Smart polos in clean everyday fits, from textured knitted options to classic pique essentials.",
    },
    "t-shirts": {
      categoryName: "T-shirts",
      material: "a comfortable jersey or knit fabric made for easy repeat wear",
      fit: "a relaxed but clean shape suited to layering or wearing solo",
      occasion: "everyday rotation, casual plans, travel, and off-duty wardrobes",
      styling: "an easy base layer for jackets, overshirts, knitwear, and relaxed trousers",
      care: "machine wash cold and avoid over-drying to keep the handle looking fresh",
      description:
        "Round-neck, V-neck, and sweat-shirt styles for easy everyday dressing with a cleaner menswear edge.",
    },
  };

  return (
    profiles[categorySlug] || {
      categoryName: titleCase(String(categorySlug || "menswear").replace(/-/g, " ")),
      material: "quality menswear fabric with a dependable feel",
      fit: "a balanced fit designed to stay clean and wearable",
      occasion: "day-to-evening dressing, repeat wear, and versatile styling",
      styling: "pairs easily with the rest of a modern menswear wardrobe",
      care: "follow the garment label for the best long-term wear",
      description: "Curated menswear styled for confident everyday dressing.",
    }
  );
}

function overrideProfile(title, subcategoryName, profile) {
  const text = `${normalizeText(title)} ${normalizeText(subcategoryName)}`;
  const next = { ...profile };

  if (/(linen)/.test(text)) {
    next.material = "a breathable linen-rich fabric that stays cool and light in warm weather";
  }
  if (/(formal)/.test(text)) {
    next.fit = "a sharper formal profile with clean, composed lines";
  }
  if (/(casual)/.test(text)) {
    next.fit = "a relaxed modern fit built for comfort and repeat wear";
  }
  if (/(denim)/.test(text)) {
    next.material = "a structured denim fabric with everyday durability and texture";
  }
  if (/(loafer|oxford|boot|sandal)/.test(text)) {
    next.material = "a well-finished upper with dependable sole grip and all-day wearability";
  }
  if (/(knitted|knit)/.test(text)) {
    next.material = "a textured knit fabric that adds softness and a richer surface finish";
  }
  if (/(three piece|3 piece|3-piece)/.test(text)) {
    next.styling = "ideal when you want a fuller formal look with stronger presence and layered elegance";
  }

  return next;
}

function buildProductDescription({ title, categorySlug, categoryName, subcategoryName }) {
  const slug =
    categorySlug || inferCategorySlugFromText(`${title || ""} ${categoryName || ""} ${subcategoryName || ""}`);
  const profile = baseProfile(slug);
  const finalCategoryName = String(categoryName || profile.categoryName || "Menswear").trim();
  const tuned = overrideProfile(title, subcategoryName, profile);
  const subcategoryLead = subcategoryName ? ` within our ${String(subcategoryName).trim()} edit` : "";

  return `${title} is a standout ${finalCategoryName.toLowerCase()} piece${subcategoryLead}, created for men who want a confident look without giving up comfort. Built from ${tuned.material}, it offers ${tuned.fit}. Ideal for ${tuned.occasion}, it ${tuned.styling}. ${profile.description} Care: ${tuned.care}. Fast Nairobi fulfilment and nationwide delivery available.`;
}

module.exports = {
  buildProductDescription,
  inferCategorySlugFromText,
  titleCase,
};
