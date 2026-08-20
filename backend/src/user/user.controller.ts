import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BusinessFeatureGuard } from '../auth/guards/business-feature.guard';
import { UpdateAccountTypeDto } from './dto/update-account-type.dto';
import { AccountType } from './user.entity';
import { UserService } from './user.service';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  account_type: AccountType | null;
}

@ApiTags('users')
@Controller('users')
@UseGuards(BusinessFeatureGuard)
export class UserController {
  constructor(private readonly service: UserService) {}

  @Patch('me')
  @ApiOperation({ summary: 'Set the current user account type (personal or business)' })
  @ApiOkResponse({ description: 'Updated user profile' })
  async updateAccountType(
    @CurrentUser() userId: string,
    @Body() dto: UpdateAccountTypeDto,
  ): Promise<UserProfile> {
    const user = await this.service.setAccountType(userId, dto.account_type);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      account_type: user.account_type,
    };
  }
}
