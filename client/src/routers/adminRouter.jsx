import { AdminLayout } from "../layout/AdminLayout";
import { AdminDashboard } from "../pages/Admin/AdminDashboard";
import { UsersList } from "../pages/Admin/UsersList";
import { SellersList } from "../pages/Admin/SellersList";
import { BuyersList } from "../pages/Admin/BuyersList";
import AuctionApprovals from "../pages/Admin/AuctionApprovals";

export const adminRouter = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "users",
        element: <UsersList />,
      },
      {
        path: "sellers",
        element: <SellersList />,
      },
      {
        path: "buyers",
        element: <BuyersList />,
      },
      {
        path: "auctions",
        element: <AuctionApprovals />,
      },
    ],
  },
];