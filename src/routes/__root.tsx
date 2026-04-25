import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFab } from "@/components/site/WhatsAppFab";
import brandLogo from "@/assets/Prince logo.webp";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground transition-colors hover:brightness-110"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prince Esquare — Premium Menswear in Nairobi" },
      {
        name: "description",
        content:
          "Prince Esquare crafts premium menswear for the modern Nairobi gentleman — suits, shirts, shoes and more. Free Nairobi delivery.",
      },
      { name: "author", content: "Prince Esquare" },
      { property: "og:title", content: "Prince Esquare — Premium Menswear" },
      { property: "og:description", content: "Suits, shirts, shoes & more. Crafted for the modern gentleman." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: brandLogo },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: brandLogo },
    ],
    links: [
      { rel: "icon", href: brandLogo },
      { rel: "apple-touch-icon", href: brandLogo },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
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
