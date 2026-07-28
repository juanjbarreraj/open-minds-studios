import { api } from './apiClient';

// Super admin maintenance. Kept separate from the manager panels because
// these actions bypass or clean up behind the normal workflow.
export const maintenanceApi = {
  previewOrphanFiles: (olderThanHours) =>
    api.get(olderThanHours === undefined
      ? '/maintenance/orphan-files'
      : `/maintenance/orphan-files?older_than_hours=${olderThanHours}`),
  cleanupOrphanFiles: (olderThanHours) =>
    api.post('/maintenance/orphan-files', olderThanHours === undefined ? {} : { older_than_hours: olderThanHours }),
};
