import { lazy } from "react";

export const Login = lazy(() => import("../auth/Login"))
export const  Dashboard = lazy(() => import("../dashboard/Dashboard"))
export const NotFound = lazy(() => import("../NotFound/NotFound"))
export const ProductManagment = lazy(() => import("../dashboard/ProductManagment"))
export const StockManagment = lazy(() => import("../dashboard/StockManagment"))
export const SalesManagment = lazy(() => import("../dashboard/SalesManagement"))
export const TodaySales = lazy(() => import("../dashboard/TodaySales"))
export const PurchaseManagment = lazy(() => import("../dashboard/PurchasesManagement"))
//admin
export const UserManagement = lazy(() => import("../dashboard/UserManagment"))