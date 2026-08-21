import { Injectable, OnModuleInit } from '@nestjs/common';
import { FeatureFlagKey } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  // Guarantees a row for every enum value, including ones added later.
  async onModuleInit() {
    await Promise.all(
      Object.values(FeatureFlagKey).map((key) =>
        this.prisma.featureFlag.upsert({
          where: { key },
          create: { key, enabled: false },
          update: {},
        })
      )
    );
  }

  findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  update(key: FeatureFlagKey, dto: UpdateFeatureFlagDto) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled: dto.enabled },
      update: { enabled: dto.enabled },
    });
  }
}
