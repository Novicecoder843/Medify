import { IsString, Length, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Length(10, 10, { message: 'Phone number must be 10 digits' })
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only digits' })
  phone: string;
}
