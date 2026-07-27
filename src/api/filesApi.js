import { api, fileUrl } from './apiClient';

export const filesApi = {
  // Uploads a File object; returns { id, file_url, file_name }.
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/files', form);
  },
  // Resolve a stored file_url for use in href/src attributes.
  url: fileUrl,
};
