import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LoansModule } from './modules/loans/loans.module';
import { EmisModule } from './modules/emis/emis.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ContactModule } from './modules/contact/contact.module';
import { ProfileModule } from './modules/profile/profile.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    // Config (global — available everywhere without importing)
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        family: 4,
      }),
      inject: [ConfigService],
    }),

    // Global rate limiter: 100 requests per 15 minutes
    ThrottlerModule.forRoot([{ ttl: 900000, limit: 100 }]),

    // Cron scheduler for EMI reminders
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    DashboardModule,
    LoansModule,
    EmisModule,
    DocumentsModule,
    ContactModule,
    ProfileModule,
    NotificationsModule,
    SchedulerModule,
  ],
})
export class AppModule { }
