import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertOrganizationDto } from './dto/upsert-organization.dto';
import { Organization } from './organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
  ) {}

  find(userId: string): Promise<Organization | null> {
    return this.repo.findOne({ where: { user: { id: userId } } });
  }

  async upsert(userId: string, dto: UpsertOrganizationDto): Promise<Organization> {
    const existing = await this.find(userId);

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const organization = this.repo.create({ user: { id: userId }, ...dto });
    return this.repo.save(organization);
  }
}
