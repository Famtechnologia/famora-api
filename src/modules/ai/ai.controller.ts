import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('AI Computer Vision')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('detect-disease')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Diagnose crop disease from leaf image upload',
    description: 'Uploads a photo of crop foliage to Cloudinary, processes it through our diagnostic engine, and returns severity analysis alongside treatment guidelines.',
  })
  @ApiBody({
    description: 'Crop leaf photograph',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG/PNG) of the crop leaf',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image successfully processed and diagnosed.' })
  @ApiResponse({ status: 400, description: 'Missing image file or invalid format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('image'))
  async detectDisease(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No image file uploaded');
    }
    return this.aiService.detectCropDisease(file.buffer, file.originalname);
  }
}
