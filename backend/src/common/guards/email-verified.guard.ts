import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.emailVerifiedAt) {
      throw new ForbiddenException('Please verify your email address before accessing this resource.');
    }

    return true;
  }
}
