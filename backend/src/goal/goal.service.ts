import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertGoalDto } from './dto/upsert-goal.dto';
import { Goal } from './goal.entity';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly repo: Repository<Goal>,
  ) {}

  find(userId: string): Promise<Goal | null> {
    return this.repo.findOne({ where: { user: { id: userId } } });
  }

  async upsert(userId: string, dto: UpsertGoalDto): Promise<Goal> {
    const existing = await this.find(userId);

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const goal = this.repo.create({ user: { id: userId }, ...dto });
    return this.repo.save(goal);
  }

  async remove(userId: string): Promise<void> {
    const goal = await this.find(userId);
    if (!goal) throw new NotFoundException('No goal found');
    await this.repo.delete(goal.id);
  }
}
