import Error from "../Error";
import { ViewAuction } from "../pages/ViewAuction";
import { MainLayout } from "../layout/MainLayout";
import { AuctionList } from "../pages/AuctionList";
import { CreateAuction } from "../pages/CreateAuction";
import { MyAuction } from "../pages/MyAuction";
import Profile from "../pages/Profile";
import SellerProfile from "../pages/SellerProfile";
import Privacy from "../pages/Privacy";
import { AuctionDetail } from "../components/Buyer/AuctionDetail.jsx";
import { LiveAuctions } from "../components/Buyer/LiveAuctions.jsx";
import { SellerNotifications } from "../pages/SellerNotifications.jsx";

export const protectedRoutes = [
  {
    path: "/seller",
    element: <MainLayout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <AuctionList />,
        errorElement: <Error />,
      },
      {
        path: "auction",
        element: <AuctionList />,
        errorElement: <Error />,
      },
      {
        path: "live-auctions",
        element: <LiveAuctions />,
        errorElement: <Error />,
      },
      {
        path: "auction-detail/:id",
        element: <AuctionDetail />,
        errorElement: <Error />,
      },
      {
        path: "myauction",
        element: <MyAuction />,
        errorElement: <Error />,
      },
      {
        path: "notifications",
        element: <SellerNotifications />,
        errorElement: <Error />,
      },
      {
        path: "create",
        element: <CreateAuction />,
        errorElement: <Error />,
      },
      {
        path: "auction/:id",
        element: <ViewAuction />,
        errorElement: <Error />,
      },
      {
        path: "profile",
        element: <SellerProfile />,
        errorElement: <Error />,
      },
      {
        path: "privacy",
        element: <Privacy />,
        errorElement: <Error />,
      },
    ],
  },
];
