import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpsertOrganizationDto } from './dto/upsert-organization.dto';
import { Organization } from './organization.entity';
import { OrganizationService } from './organization.service';

@ApiTags('organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user organization' })
  @ApiOkResponse({ type: Organization })
  find(@CurrentUser() userId: string): Promise<Organization | null> {
    return this.service.find(userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create or update the organization',
    description: 'Single-record upsert — there is only one organization per user.',
  })
  @ApiOkResponse({ type: Organization })
  upsert(@CurrentUser() userId: string, @Body() dto: UpsertOrganizationDto): Promise<Organization> {
    return this.service.upsert(userId, dto);
  }
}
