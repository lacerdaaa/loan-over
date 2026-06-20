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

  async find(): Promise<Goal | null> {
    const goals = await this.repo.find({ take: 1 });
    return goals[0] ?? null;
  }

  async upsert(dto: UpsertGoalDto): Promise<Goal> {
    const existing = await this.find();

    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }

    const goal = this.repo.create(dto);
    return this.repo.save(goal);
  }

  async remove(): Promise<void> {
    const goal = await this.find();
    if (!goal) throw new NotFoundException('No goal found');
    await this.repo.delete(goal.id);
  }
}
