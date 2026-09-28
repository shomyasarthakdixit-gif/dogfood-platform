import Badge from '@/components/ui/Badge';
import type { SubmissionStatus } from '@/lib/types';

export default function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  if (status === 'SUBMITTED') {
    return <Badge variant="success" dot>Submitted</Badge>;
  }
  return <Badge variant="warning" dot>Draft</Badge>;
}
