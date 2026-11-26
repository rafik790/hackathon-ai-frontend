export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly description: string;
}

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

/** The investigation workflow first, in its order: overview, runs, failed task, analysis. */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Investigate',
    items: [
      { label: 'Overview', icon: 'space_dashboard', route: '/overview', description: 'Pipeline health at a glance' },
      { label: 'Pipeline Runs', icon: 'account_tree', route: '/pipeline-runs', description: 'Tekton PipelineRuns' },
      { label: 'Task Runs', icon: 'checklist', route: '/task-runs', description: 'Tekton TaskRuns' },
      { label: 'Failure Analysis', icon: 'troubleshoot', route: '/failure-analysis', description: 'Failures and their AI analyses' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Monitoring', icon: 'monitor_heart', route: '/monitoring', description: 'Collector and application health' },
      { label: 'Settings', icon: 'settings', route: '/settings', description: 'Configuration and preferences' },
    ],
  },
];
