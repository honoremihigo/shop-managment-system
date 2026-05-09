import { createBrowserRouter} from "react-router-dom";
import { Login, Dashboard , NotFound, UserManagement, ProductManagment, StockManagment, SalesManagment } from "../pages/lazyLoading/Lazy";
import SuspenceWrapper from "../components/suspenseWrapper/SuspenseWrapper";
import ProtectedRoute from "../components/protector/ProtectUserRoute";
import MainLayout from "../layout/MainLayout";
const routes = createBrowserRouter([
  {
    path: "/login",
    element: (
      <SuspenceWrapper>
        <Login />
      </SuspenceWrapper>
    ),
  },
  {
    path: "/",
    element: <ProtectedRoute> <MainLayout/> </ProtectedRoute>,
    children: [
      {
        path: "/dashboard",
        element: (
          <SuspenceWrapper>
            <Dashboard />
          </SuspenceWrapper>
        ),
      },
      {
        path: "/user-management",
        element: (
          <SuspenceWrapper>
            <UserManagement />
          </SuspenceWrapper>
        ),
      },
      {
        path: "/products",
        element: (
          <SuspenceWrapper>
            <ProductManagment/>
          </SuspenceWrapper>
        ),
      },
      {
        path: "/stocks",
        element: (
          <SuspenceWrapper>
            <StockManagment/>
          </SuspenceWrapper>
        ),
      },
      {
        path: "/sales",
        element: (
          <SuspenceWrapper>
            <SalesManagment/>
          </SuspenceWrapper>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <SuspenceWrapper>
        <NotFound />
      </SuspenceWrapper>
    )
  }
]);

export default routes;
