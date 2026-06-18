import { IFileParser } from './parser.interface';
import { CsvParser } from './csv.parser';
import { JsonParser } from './json.parser';
import { XmlParser } from './xml.parser';
import { YamlParser } from './yaml.parser';
import { ExcelParser } from './excel.parser';
import { PdfParser } from './pdf.parser';
import { ParquetParser } from './parquet.parser';
import { AvroParser } from './avro.parser';
import { PlaintextParser } from './plaintext.parser';
import { OrcParser } from './orc.parser';

export class ParserFactory {
  static getParser(extension: string): IFileParser {
    switch (extension.toLowerCase()) {
      case 'csv':
        return new CsvParser();
      case 'json':
        return new JsonParser();
      case 'xml':
        return new XmlParser();
      case 'yaml':
      case 'yml':
        return new YamlParser();
      case 'xls':
      case 'xlsx':
        return new ExcelParser();
      case 'pdf':
        return new PdfParser();
      case 'parquet':
        return new ParquetParser();
      case 'avro':
        return new AvroParser();
      case 'orc':
        return new OrcParser();
      case 'txt':
        return new PlaintextParser();
      // SQL, ORC, Binary would fall back to a generic or custom parser in production
      default:
        return new PlaintextParser(); // Fallback
    }
  }
}
