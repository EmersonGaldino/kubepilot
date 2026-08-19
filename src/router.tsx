import { createHashRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ConfigMaps } from '@/pages/ConfigMaps'
import { CronJobs } from '@/pages/CronJobs'
import { DaemonSets } from '@/pages/DaemonSets'
import { Dashboard } from '@/pages/Dashboard'
import { Deployments } from '@/pages/Deployments'
import { Events } from '@/pages/Events'
import { Jobs } from '@/pages/Jobs'
import { Logs } from '@/pages/Logs'
import { Pods } from '@/pages/Pods'
import { ReplicaSets } from '@/pages/ReplicaSets'
import { Secrets } from '@/pages/Secrets'
import { Services } from '@/pages/Services'
import { StatefulSets } from '@/pages/StatefulSets'

// Hash-based routing: the production build is loaded from `file://`, where
// browser-history routing can't resolve deep links on reload.
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'pods', element: <Pods /> },
      { path: 'deployments', element: <Deployments /> },
      { path: 'statefulsets', element: <StatefulSets /> },
      { path: 'daemonsets', element: <DaemonSets /> },
      { path: 'replicasets', element: <ReplicaSets /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'cronjobs', element: <CronJobs /> },
      { path: 'services', element: <Services /> },
      { path: 'configmaps', element: <ConfigMaps /> },
      { path: 'secrets', element: <Secrets /> },
      { path: 'events', element: <Events /> },
      { path: 'logs', element: <Logs /> },
    ],
  },
])
