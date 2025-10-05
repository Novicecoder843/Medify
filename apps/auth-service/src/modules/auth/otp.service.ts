import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  async sendOtp(phone: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString();
    await this.redis.set(`otp:${phone}`, otp, 'EX', 300); // 5 min expiry
    // Here you can integrate Twilio to send OTP
    console.log(`OTP for ${phone}: ${otp}`);
    return otp;
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const saved = await this.redis.get(`otp:${phone}`);
    if (saved !== otp) return false;
    await this.redis.del(`otp:${phone}`);
    return true;
  }
}
