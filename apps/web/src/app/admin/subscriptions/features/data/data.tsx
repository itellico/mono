import { CheckCircledIcon, CircleIcon, CrossCircledIcon, QuestionMarkCircledIcon, StopwatchIcon } from '@radix-ui/react-icons';

export const labels = [
  {
    value: 'bug',
    label: 'Bug'
  },
  {
    value: 'feature',
    label: 'Feature'
  },
  {
    value: 'documentation',
    label: 'Documentation'
  }
];

export const statuses = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: QuestionMarkCircledIcon
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: CircleIcon
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: StopwatchIcon
  },
  {
    value: 'done',
    label: 'Done',
    icon: CheckCircledIcon
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: CrossCircledIcon
  }
];

export const priorities = [
  {
    label: 'Low',
    value: 'low',
    icon: QuestionMarkCircledIcon
  },
  {
    label: 'Medium',
    value: 'medium',
    icon: CircleIcon
  },
  {
    label: 'High',
    value: 'high',
    icon: StopwatchIcon
  }
];
