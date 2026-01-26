import { invoke } from '@tauri-apps/api/core';
import type { ParseResult } from '@/types';

/**
 * Tauri native API wrapper
 * This file encapsulates all Tauri-specific calls for easy platform switching
 */

export const native = {
  /**
   * Parse a Debian package file
   */
  parseDebPackage: (filePath: string): Promise<ParseResult> => {
    return invoke('parse_deb_package', { filePath });
  },

  /**
   * Open file picker dialog (future implementation)
   */
  openFilePicker: (): Promise<string | null> => {
    return invoke('open_file_picker');
  },
};
