import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { CaseService } from './case.service';
import { CurrentUser, JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

class CreateCaseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: string;
}

class AddEventDto {
  @IsString()
  eventId: string;
}

class AddNoteDto {
  @IsString()
  content: string;
}

@ApiTags('workspace')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workspace/cases')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Get()
  @Roles('analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'List investigation cases for current tenant' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.caseService.findAll(user.tenantId);
  }

  @Post()
  @Roles('analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Create a new investigation case' })
  create(@Body() dto: CreateCaseDto, @CurrentUser() user: JwtUser) {
    return this.caseService.create(dto, user.tenantId, user.id);
  }

  @Get(':id')
  @Roles('analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Get case details' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.caseService.findOne(id, user.tenantId);
  }

  @Post(':id/events')
  @Roles('analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Link an event to a case' })
  addEvent(
    @Param('id') id: string,
    @Body() dto: AddEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.caseService.addEvent(id, dto.eventId, user.tenantId, user.id);
  }

  @Post(':id/notes')
  @Roles('analyst', 'senior_analyst', 'director', 'admin')
  @ApiOperation({ summary: 'Add a note to a case' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.caseService.addNote(id, dto.content, user.tenantId, user.id);
  }

  @Patch(':id/close')
  @Roles('senior_analyst', 'director', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close a case' })
  close(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.caseService.close(id, user.tenantId, user.id);
  }
}
