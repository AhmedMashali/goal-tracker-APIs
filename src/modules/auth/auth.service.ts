import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserDocument } from '../users/schemas/user.schema';

type ValidatedAuthUser = Omit<
  UserDocument,
  'passwordHash' | 'toObject' | 'toJSON'
> & { _id: any };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const { email, password } = registerUserDto;

    try {
      await this.usersService.create({ email, password });
      return { message: 'User successfully registered. Please login.' };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Email already exists.');
      }
      console.error('Registration error:', error);
      throw new InternalServerErrorException(
        'An error occurred during registration.',
      );
    }
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidatedAuthUser | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user.toObject
        ? user.toObject()
        : { ...user };
      return result as ValidatedAuthUser;
    }
    return null;
  }

  async login(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { email, password } = authCredentialsDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload: JwtPayload = { email: user.email, sub: user._id.toString() };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
