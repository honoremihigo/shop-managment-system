import { createBrowserRouter} from "react-router-dom";
import { Login, Dashboard , NotFound, UserManagement } from "../pages/lazyLoading/Lazy";
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
      }
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
