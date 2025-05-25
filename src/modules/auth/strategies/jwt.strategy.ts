import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

export interface JwtPayload {
  email: string;
  sub: string;
}

export type ValidatedUser = Omit<
  UserDocument,
  'passwordHash' | 'toObject' | 'toJSON'
> & { _id: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const userDoc = await this.usersService.findOneById(payload.sub);
    if (!userDoc) {
      throw new UnauthorizedException('User not found or token invalid.');
    }
    const userObject = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = userObject;

    return result as ValidatedUser;
  }
}
