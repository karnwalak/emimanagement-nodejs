import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../database/schemas/user.schema';

const ALLOWED_MIME = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':loanId/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload documents for a loan (PDF, DOC, DOCX — max 2MB each)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: path.join(process.cwd(), '..', 'uploads', 'loan_documents'),
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Only PDF, DOC, and DOCX files are allowed.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadDocuments(
    @CurrentUser() user: UserDocument,
    @Param('loanId') loanId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('names') names: string | string[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required.');
    }
    const nameArray = Array.isArray(names) ? names : names ? [names] : [];
    const docs = await this.documentsService.uploadDocuments(loanId, (user._id as any).toString(), files as any, nameArray);
    return { message: 'Documents uploaded successfully.', data: docs };
  }

  @Delete('documents/:docId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a loan document' })
  async deleteDocument(@CurrentUser() user: UserDocument, @Param('docId') docId: string) {
    await this.documentsService.deleteDocument(docId, (user._id as any).toString());
    return { message: 'Document deleted successfully.' };
  }
}
