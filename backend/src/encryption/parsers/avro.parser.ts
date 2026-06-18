import { IFileParser } from './parser.interface';

export class AvroParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    return {
      isStructured: false,
      schema: ['file_blob_avro'],
      preview: []
    };
  }
}
