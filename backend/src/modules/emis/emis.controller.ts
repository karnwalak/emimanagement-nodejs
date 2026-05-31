import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmisService } from './emis.service';
import { UpdateEmiDto, MarkEmiPaidDto, SkipEmiDto } from './dto/update-emi.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('EMIs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('emis')
export class EmisController {
  constructor(private readonly emisService: EmisService) {}

  @Post('mark-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an EMI as paid or pending (auto-closes loan when all paid)' })
  markStatus(@Body() dto: MarkEmiPaidDto) {
    return this.emisService.markEmiStatus(dto);
  }

  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update EMI amounts and due dates' })
  bulkUpdate(@Body() dto: UpdateEmiDto) {
    return this.emisService.bulkUpdateEmis(dto);
  }

  @Post('skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip an EMI — pushes this and all subsequent EMIs forward by 1 month' })
  skip(@Body() dto: SkipEmiDto) {
    return this.emisService.skipEmi(dto);
  }
}
