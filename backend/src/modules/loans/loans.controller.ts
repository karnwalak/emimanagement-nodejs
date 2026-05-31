import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { DataTablesQueryDto } from './dto/datatables-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../database/schemas/user.schema';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) { }

  @Get()
  @ApiOperation({ summary: 'List all loans for the authenticated user (paginated)' })
  findAll(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortField') sortField = 'createdAt',
    @Query('sortDirection') sortDirection = 'desc',
    @Query('status') status?: string,
  ): Promise<Record<string, unknown>> {
    return this.loansService.findAll((user._id as any).toString(), {
      page: Number(page),
      limit: Number(limit),
      sortField,
      sortDirection,
      status,
    });
  }

  @Get('datatable')
  @ApiOperation({ summary: 'DataTables-compatible loan list endpoint' })
  forDatatable(@CurrentUser() user: UserDocument, @Query() query: DataTablesQueryDto) {
    return this.loansService.findForDatatables((user._id as any).toString(), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single loan with EMIs and documents' })
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.loansService.getLoanWithDetails(id, (user._id as any).toString());
  }

  @Post()
  @ApiOperation({ summary: 'Create a new loan and generate EMI schedule' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateLoanDto) {
    return this.loansService.create((user._id as any).toString(), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a loan and regenerate its EMI schedule' })
  update(@CurrentUser() user: UserDocument, @Param('id') id: string, @Body() dto: UpdateLoanDto) {
    return this.loansService.update(id, (user._id as any).toString(), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a loan with all its EMIs and documents' })
  async remove(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    await this.loansService.remove(id, (user._id as any).toString());
    return { message: 'Loan deleted successfully.' };
  }

  @Post(':id/foreclose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Foreclose a loan — marks all pending EMIs as paid' })
  async foreclose(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    await this.loansService.forecloseLoan(id, (user._id as any).toString());
    return { status: true, message: 'Loan is foreclosed!' };
  }
}
