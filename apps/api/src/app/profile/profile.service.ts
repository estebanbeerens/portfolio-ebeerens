import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService
  ) {}

  async findProfile() {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) {
      throw new NotFoundException('Profile has not been created yet');
    }
    return profile;
  }

  // There is only ever one administrator/profile row, so PUT upserts it.
  async upsertProfile(dto: UpdateProfileDto, actor?: string) {
    const existing = await this.prisma.profile.findFirst();
    const profile = existing
      ? await this.prisma.profile.update({ where: { id: existing.id }, data: dto })
      : await this.prisma.profile.create({ data: dto });

    await this.activity.record({
      entityType: 'PROFILE',
      action: existing ? 'UPDATED' : 'CREATED',
      entityId: profile.id,
      summary: existing ? 'Updated profile details' : 'Created the profile',
      actor,
    });
    return profile;
  }
}
