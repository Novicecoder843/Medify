import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(10, 10)
  @Matches(/^[0-9]+$/)
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
