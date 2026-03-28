export interface IGitAdapter {
  stage(paths: string[]): Promise<void>;
  isRepo(): Promise<boolean>;
}
