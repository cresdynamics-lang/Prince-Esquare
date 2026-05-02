import { Outlet, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import { NotFoundPage } from "@/components/site/NotFoundPage";
import brandLogo from "@/assets/Prince logo.webp";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prince Esquire — Premium Menswear in Nairobi" },
      {
        name: "description",
        content:
          "Prince Esquire is a leading Nairobi menswear store for premium suits, shirts, shoes, trousers, track suits, belts and socks. Shop quality mens fashion in Kenya with reliable Nairobi delivery.",
      },
      {
        name: "keywords",
        content:
          "menswear kenya, nairobi suits, men shirts kenya, men shoes nairobi, prince esquire, tailored suits kenya, kenya fashion store for men, buy mens clothing kenya",
      },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { name: "geo.region", content: "KE-30" },
      { name: "geo.placename", content: "Nairobi" },
      { name: "language", content: "en-KE" },
      { name: "author", content: "Prince Esquire" },
      { property: "og:title", content: "Prince Esquire — Premium Menswear" },
      {
        property: "og:description",
        content:
          "Shop premium menswear in Nairobi, Kenya: suits, shirts, shoes, trousers, track suits, belts and socks.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_KE" },
      { property: "og:site_name", content: "Prince Esquire" },
      { property: "og:url", content: "https://princeesquare.vercel.app/" },
      { property: "og:image", content: brandLogo },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Prince Esquire — Premium Menswear in Nairobi" },
      {
        name: "twitter:description",
        content: "Premium men's suits, shirts, shoes and more — built for Nairobi gentlemen.",
      },
      { name: "twitter:image", content: brandLogo },
    ],
    links: [
      { rel: "icon", href: brandLogo },
      { rel: "apple-touch-icon", href: brandLogo },
      { rel: "canonical", href: "https://princeesquare.vercel.app/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFoundPage />,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // SPA: never nest <html>/<body> inside #root — that breaks focus, typing, and clicks in browsers.
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAuthOrAdminRoute = pathname === "/admin-login" || pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="flex min-h-screen flex-col">
            {!isAuthOrAdminRoute && <Header />}
            <main className="flex-1">
              <Outlet />
            </main>
            {!isAuthOrAdminRoute && <Footer />}
            {!isAuthOrAdminRoute && <WhatsAppFab />}
          </div>
          <Toaster richColors position="top-center" />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
