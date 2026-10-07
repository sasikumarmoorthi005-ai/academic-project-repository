import api from './api';
import { fileCategories } from '../components/FileCategoryInputs';

export async function uploadCategorizedFiles(projectId, filesByCategory, versionId) {
  for (const { value } of fileCategories) {
    const files = filesByCategory[value] || [];
    if (!files.length) continue;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('category', value);
    if (versionId != null) formData.append('versionId', versionId);
    await api.post(`/projects/${projectId}/files`, formData);
  }
}
