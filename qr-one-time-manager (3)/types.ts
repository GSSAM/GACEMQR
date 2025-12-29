
export enum CodeStatus {
  UNUSED = 'unused',
  USED = 'used'
}

export interface QRCodeEntry {
  id: string; // The 8-12 character code
  status: CodeStatus;
  createdAt: number;
  usedAt?: number;
  batchId: string;
}

export type ViewMode = 'dashboard' | 'scan' | 'manual' | 'history';

export interface ScanResult {
  code: string;
  status: 'valid' | 'already_used' | 'invalid';
  timestamp?: number;
}
