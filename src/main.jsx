import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { DataProvider } from "./context/DataContext.jsx";
import CartProvider from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/wishlistContext";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import "leaflet/dist/leaflet.css";

// ========================================
// TANSTACK QUERY CLIENT
// ========================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 5 minutes.
      // During this time, React Query won't
      // unnecessarily call the API again.
      staleTime: 5 * 60 * 1000,

      // Keep unused cached data for 30 minutes.
      gcTime: 30 * 60 * 1000,

      // Don't automatically refetch whenever
      // the user switches browser tabs.
      refetchOnWindowFocus: false,

      // Retry failed requests only once.
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </CartProvider>
      </DataProvider>
    </QueryClientProvider>
  </StrictMode>
);