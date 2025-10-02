import Error from "../Error";
import { ModernLanding } from "../components/Buyer/ModernLanding";
import { LiveAuctions } from "../components/Buyer/LiveAuctions";
import { AuctionDetail } from "../components/Buyer/AuctionDetail";
import { BuyerLogin } from "../components/Buyer/BuyerLogin";
import { BuyerSignup } from "../components/Buyer/BuyerSignup";
import { SavedItems } from "../components/Buyer/SavedItems";

export const buyerRoutes = [
  {
    path: "/",
    element: <ModernLanding />,
    errorElement: <Error />,
  },
  {
    path: "/live-auctions",
    element: <LiveAuctions />,
    errorElement: <Error />,
  },
  {
    path: "/saved",
    element: <SavedItems />,
    errorElement: <Error />,
  },
  // Primary auction detail route for buyers
  {
    path: "/auction/:id",
    element: <AuctionDetail />,
    errorElement: <Error />,
  },
  // Additional buyer-accessible auction routes
  {
    path: "/auctions/:id", // Alternative plural form
    element: <AuctionDetail />,
    errorElement: <Error />,
  },
  {
    path: "/view-auction/:id", // Alternative view form
    element: <AuctionDetail />,
    errorElement: <Error />,
  },
  // Buyer auction browsing routes
  {
    path: "/browse-auctions",
    element: <LiveAuctions />,
    errorElement: <Error />,
  },
  {
    path: "/buyer/login",
    element: <BuyerLogin />,
    errorElement: <Error />,
  },
  {
    path: "/buyer/signup",
    element: <BuyerSignup />,
    errorElement: <Error />,
  },
];