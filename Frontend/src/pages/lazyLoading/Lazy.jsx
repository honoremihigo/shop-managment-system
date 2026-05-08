import { lazy } from "react";

export const Login = lazy(() => import("../auth/Login"))
export const  Dashboard = lazy(() => import("../dashboard/Dashboard"))
export const NotFound = lazy(() => import("../NotFound/NotFound"))

//admin
export const UserManagement = lazy(() => import("../dashboard/UserManagment"))