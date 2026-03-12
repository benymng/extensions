export interface Preference {
  autoOpen: boolean;
  quitWhenNoWindows: boolean;
  showMenubarTitle: boolean;
  showAsMarkdown: boolean;
  showDetailMetadata: boolean;
  primaryAction: string;
}

export const autoOpen = true;
export const quitWhenNoWindows = false;
export const showMenubarTitle = true;
export const showAsMarkdown = false;
export const showDetailMetadata = false;
export const primaryAction = "Paste";
