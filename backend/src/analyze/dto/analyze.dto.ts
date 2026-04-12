import { IsUrl } from 'class-validator';

export class AnalyzeDto {
  @IsUrl({ require_protocol: true }, { message: 'A URL deve ser valida e incluir protocolo (http/https)' })
  url!: string;
}
