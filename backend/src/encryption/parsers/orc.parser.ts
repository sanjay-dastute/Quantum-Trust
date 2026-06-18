import { IFileParser } from './parser.interface';

export class OrcParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    // orc-js requires native java binaries or complex bindings on windows.
    // We will provide a stub that treats it as a binary blob for now, simulating a fallback for complex structures.
    return {
      isStructured: false,
      schema: ['file_blob_orc'],
      preview: []
    };
  }
}
