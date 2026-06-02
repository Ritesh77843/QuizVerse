import { ImportJobStatus, DraftStatus, AiQuestion } from './index';

export interface ImportJobResponse {
  jobId: string;
  draftId?: string;
  jobStatus: ImportJobStatus;
  draftStatus?: DraftStatus;
  title?: string;
  parsedQuestions?: AiQuestion[];
  createdAt: string;
  completedAt?: string;
}

export interface AiDraftResponse {
  id: string;
  title: string;
  status: DraftStatus;
  questions: AiQuestion[];
  createdAt: string;
}
