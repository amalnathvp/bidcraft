import Error from "../Error";
import { ModernLanding } from "../components/Buyer/ModernLanding";
import { LiveAuctions } from "../components/Buyer/LiveAuctions";
import { AuctionDetail } from "../components/Buyer/AuctionDetail";

export const buyerRoutes = [
  {
    path: "/buyer",
    element: <ModernLanding />,
    errorElement: <Error />,
  },
  {
    path: "/buyer/live-auctions",
    element: <LiveAuctions />,
    errorElement: <Error />,
  },
  {
    path: "/buyer/auction/:id",
    element: <AuctionDetail />,
    errorElement: <Error />,
  },
];