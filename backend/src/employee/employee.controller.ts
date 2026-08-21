import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BusinessFeatureGuard } from '../auth/guards/business-feature.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './employee.entity';
import { EmployeeService } from './employee.service';

@ApiTags('employees')
@Controller('employees')
@UseGuards(BusinessFeatureGuard)
export class EmployeeController {
  constructor(private readonly service: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees for the current user' })
  @ApiOkResponse({ type: Employee, isArray: true })
  findAll(@CurrentUser() userId: string): Promise<Employee[]> {
    return this.service.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiOkResponse({ type: Employee })
  create(@CurrentUser() userId: string, @Body() dto: CreateEmployeeDto): Promise<Employee> {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiOkResponse({ type: Employee })
  update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiNoContentResponse()
  remove(@CurrentUser() userId: string, @Param('id') id: string): Promise<void> {
    return this.service.remove(userId, id);
  }
}
