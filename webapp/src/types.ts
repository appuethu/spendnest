export type SourceType = 'call' | 'meeting';
export type ReviewState = 'reviewed' | 'needs_review' | 'stale_pending_review';

export interface CallPayload {
  id: string;
  source_id?: string;
  rep_name?: string;
  rep_email?: string;
  contact_name?: string;
  company_name?: string;
  direction?: 'inbound' | 'outbound';
  duration_seconds?: number;
  is_connected?: boolean | null;
  started_at?: string;
  disposition?: string;
  transcript?: string | null;
  summary?: string | null;
  [key: string]: any;
}

export interface MeetingTurn {
  speaker: string;
  timecode: string;
  starts_at_seconds: number;
  text: string;
}

export interface MeetingPayload {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  duration_seconds: number;
  provider: string;
  join_url: string;
  organizer_email: string;
  attendee_count: number;
  recording_status: string;
  has_transcript: boolean;
  has_video: boolean;
  summary?: string | null;
  summary_status?: string;
  [key: string]: any;
}

export interface TranscriptPayload {
  meeting_id: string;
  turns: MeetingTurn[];
}

export interface SourceRecord {
  record_ref: string;
  source_type: SourceType;
  source_id: string;
  payload: CallPayload | MeetingPayload;
  transcript_payload?: TranscriptPayload | null;
}

export interface RecordAnalysis {
  routes: string[];
  route_reasons: string[];
  summary: string;
  next_steps: string[];
  evidence_quotes: string[];
  review_state: ReviewState;
  analysis_freshness: 'current' | 'stale';
}

export interface ManualOverride {
  routes: string[];
  override_note: string;
  overridden_at: string;
  route_reasons: string[];
}

export interface BatchImportResult {
  new_count: number;
  updated_count: number;
  skipped_count: number;
  batch_id: string;
  batch_revision: number;
  errors: string[];
}
