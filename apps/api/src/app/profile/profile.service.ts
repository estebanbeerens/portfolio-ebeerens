import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findProfile() {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) {
      throw new NotFoundException('Profile has not been created yet');
    }
    return profile;
  }

  // There is only ever one administrator/profile row, so PUT upserts it.
  async upsertProfile(dto: UpdateProfileDto) {
    const existing = await this.prisma.profile.findFirst();
    if (existing) {
      return this.prisma.profile.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return this.prisma.profile.create({ data: dto });
  }
}
