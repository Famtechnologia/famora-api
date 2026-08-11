import { PartialType } from '@nestjs/swagger';
import { CreateListingDto } from './create-listing.dto';

/**
 * All fields optional — a seller may edit any subset of a produce listing
 * (price, quantity, description, image, etc.) without resending the whole record.
 * Inherits every validation + Swagger decorator from CreateListingDto.
 */
export class UpdateListingDto extends PartialType(CreateListingDto) {}
