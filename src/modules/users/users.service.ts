import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.getProfile(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        farmLocation: dto.farmLocation,
        region: dto.region,
        categorySubscriptions: dto.categorySubscriptions,
        smsAlertActive: dto.smsAlertActive,
      },
    });
  }
}
