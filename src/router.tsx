import { createHashRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ConfigMaps } from '@/pages/ConfigMaps'
import { CronJobs } from '@/pages/CronJobs'
import { DaemonSets } from '@/pages/DaemonSets'
import { Dashboard } from '@/pages/Dashboard'
import { Deployments } from '@/pages/Deployments'
import { Events } from '@/pages/Events'
import { HorizontalPodAutoscalers } from '@/pages/Hpa'
import { Ingresses } from '@/pages/Ingresses'
import { Jobs } from '@/pages/Jobs'
import { Logs } from '@/pages/Logs'
import { NamespacesPage } from '@/pages/Namespaces'
import { Nodes } from '@/pages/Nodes'
import { PersistentVolumeClaims } from '@/pages/PersistentVolumeClaims'
import { PersistentVolumes } from '@/pages/PersistentVolumes'
import { Pods } from '@/pages/Pods'
import { ReplicaSets } from '@/pages/ReplicaSets'
import { Secrets } from '@/pages/Secrets'
import { Services } from '@/pages/Services'
import { StatefulSets } from '@/pages/StatefulSets'
import { StorageClasses } from '@/pages/StorageClasses'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'nodes', element: <Nodes /> },
      { path: 'namespaces', element: <NamespacesPage /> },
      { path: 'pods', element: <Pods /> },
      { path: 'deployments', element: <Deployments /> },
      { path: 'statefulsets', element: <StatefulSets /> },
      { path: 'daemonsets', element: <DaemonSets /> },
      { path: 'replicasets', element: <ReplicaSets /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'cronjobs', element: <CronJobs /> },
      { path: 'services', element: <Services /> },
      { path: 'ingresses', element: <Ingresses /> },
      { path: 'hpa', element: <HorizontalPodAutoscalers /> },
      { path: 'pvcs', element: <PersistentVolumeClaims /> },
      { path: 'pvs', element: <PersistentVolumes /> },
      { path: 'storageclasses', element: <StorageClasses /> },
      { path: 'configmaps', element: <ConfigMaps /> },
      { path: 'secrets', element: <Secrets /> },
      { path: 'events', element: <Events /> },
      { path: 'logs', element: <Logs /> },
    ],
  },
])

