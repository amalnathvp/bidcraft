import Error from "../Error";
import { ModernLanding } from "../components/Buyer/ModernLanding";
import { LiveAuctions } from "../components/Buyer/LiveAuctions";
import { AuctionDetail } from "../components/Buyer/AuctionDetail";
import { BuyerLogin } from "../components/Buyer/BuyerLogin";
import { BuyerSignup } from "../components/Buyer/BuyerSignup";

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
    path: "/auction/:id",
    element: <AuctionDetail />,
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