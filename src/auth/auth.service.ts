import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // Static credentials (you can later move these to .env)
  private readonly validUsername = 'admin';
  private readonly validPassword = 'password123';

  async login(body: { username: string; password: string }) {
    const { username, password } = body;

    // Validate credentials
    if (username !== this.validUsername || password !== this.validPassword) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = { username };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      message:
        'copy this access token and paste in above Authorize section to access other APIs',
    };
  }
}
