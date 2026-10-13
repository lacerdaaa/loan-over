import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, MoreThan, Repository } from 'typeorm';
import { AccountType, NotificationPreferences, User, UserBilling } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.repo.findOne({ where: { google_id: googleId } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByStripeCustomerId(customerId: string): Promise<User | null> {
    return this.repo.findOne({ where: { stripe_customer_id: customerId } });
  }

  create(data: { google_id: string; email: string; name: string; avatar: string }): Promise<User> {
    return this.repo.save(this.repo.create(data));
  }

  async setAccountType(id: string, accountType: AccountType): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.account_type = accountType;
    return this.repo.save(user);
  }

  async updateNotificationPreferences(
    id: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    Object.assign(user, preferences);
    return this.repo.save(user);
  }

  async updateBilling(id: string, billing: Partial<UserBilling>): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    Object.assign(user, billing);
    return this.repo.save(user);
  }

  disableNotifications(id: string): Promise<User> {
    return this.updateNotificationPreferences(id, {
      email_notifications: false,
      monthly_report: false,
    });
  }

  findNotificationRecipients(afterId: string | undefined, limit: number): Promise<User[]> {
    const cursor: FindOptionsWhere<User> = afterId ? { id: MoreThan(afterId) } : {};
    return this.repo.find({
      where: [
        { ...cursor, email_notifications: true },
        { ...cursor, monthly_report: true },
      ],
      order: { id: 'ASC' },
      take: limit,
    });
  }
}
