import type { ReactNode } from 'react';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './components/workspace/WorkspacePage';
import DashboardPage from './pages/DashboardPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <LandingPage />,
    public: true,
  },
  {
    name: 'Workspace',
    path: '/workspace',
    element: <WorkspacePage />,
    public: true,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
    public: true,
  },
];
