import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import Redis from 'ioredis';
import { PrismaModule } from '../../prisma/prisma.module'; 
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRY },
    }),
  ],
  controllers: [AuthController],
  providers: 
  [
    AuthService, 
    JwtStrategy, 
    OtpService, 
    { provide: 'REDIS', useValue: new Redis(process.env.REDIS_URL) }
  ],
})
export class AuthModule {}
