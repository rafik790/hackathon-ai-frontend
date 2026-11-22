export interface NavItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly description: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', icon: 'space_dashboard', route: '/overview', description: 'Reliability and execution health' },
  { label: 'Pipeline Runs', icon: 'account_tree', route: '/pipeline-runs', description: 'Tekton PipelineRuns' },
  { label: 'Task Runs', icon: 'checklist', route: '/task-runs', description: 'Tekton TaskRuns' },
  { label: 'Monitoring', icon: 'monitor_heart', route: '/monitoring', description: 'Collector and application health' },
  { label: 'Failure Analysis', icon: 'troubleshoot', route: '/failure-analysis', description: 'Failed executions and reasons' },
  { label: 'Settings', icon: 'settings', route: '/settings', description: 'Configuration and preferences' },
];
