import { Injectable, UnauthorizedException ,BadRequestException} from '@nestjs/common';
import prisma from '../../../prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private otpStore = new Map<string, string>(); // Temporary store for dev; use Redis in prod
  constructor(private readonly prisma: PrismaService, private jwt: JwtService) {}

  async register(data: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (userExists) throw new UnauthorizedException('Email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: { ...data, passwordHash },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email, user.role);
  }
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phone } = sendOtpDto;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(phone, otp);

    // For demo purpose, we log it
    console.log(`OTP for ${phone}: ${otp}`);

    // In production, send SMS using Twilio or AWS SNS
    return { success: true, message: 'OTP sent successfully', otp };
  }
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    try{

    
    const { phone, otp } = verifyOtpDto;
    console.log(this.otpStore,'otpStoreotpStore')
    const storedOtp = this.otpStore.get(phone);
console.log(storedOtp)
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // OTP is valid, remove it
    this.otpStore.delete(phone);

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone } });
    }

    // Generate JWT token
    const accessToken = this.jwt.sign({ sub: user.id });
    const refreshToken = this.jwt.sign({ sub: user.id }, { expiresIn: '7d' });

    return {
      success: true,
      message: 'OTP verified successfully',
      data: { user, accessToken, refreshToken },
    };
  }catch(error:any){
    console.error('Error in verifyOtp:', error);
    // If NestJS HttpException, rethrow
    if (error.status && error.response) {
      throw error;
    }
    // Otherwise send generic BadRequest with actual error message
    throw new BadRequestException({
      message: 'Failed to verify OTP',
      error: error.message || error,
    });
  }
  }
  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_EXPIRY,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRY,
    });

    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken } });

    return { accessToken, refreshToken };
  }
}