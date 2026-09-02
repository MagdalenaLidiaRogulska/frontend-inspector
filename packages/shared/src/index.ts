export type Framework = 'react' | 'vue' | 'angular' | 'unknown';

export interface SourceLocation {
  file?: string;
  line?: number;
  column?: number;
}