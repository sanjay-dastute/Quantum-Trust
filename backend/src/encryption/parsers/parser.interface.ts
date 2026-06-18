export interface IFileParser {
  /**
   * Parses a raw file payload (either as string or buffer) and returns its schema and preview data.
   */
  parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }>;
}
