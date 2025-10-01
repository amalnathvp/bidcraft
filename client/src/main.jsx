import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { store } from "./store/store.js";
import { Provider } from "react-redux";
import { protectedRoutes } from "./routers/protectedRoutes.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { openRoutes } from "./routers/openRoutes.jsx";
import InitAuth from "./init/InitAuth.jsx";
import { adminRouter } from "./routers/adminRouter.jsx";
import { buyerRoutes } from "./routers/buyerRoutes.jsx";
import { BuyerAuthProvider } from "./contexts/BuyerAuthContext.jsx";
import { SellerAuthProvider } from "./contexts/SellerAuthContext.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes for better persistence
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  },
});
const router = createBrowserRouter([...adminRouter,...protectedRoutes, ...buyerRoutes, ...openRoutes]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SellerAuthProvider>
          <BuyerAuthProvider>
            <InitAuth>
              <RouterProvider router={router} />
            </InitAuth>
          </BuyerAuthProvider>
        </SellerAuthProvider>
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
