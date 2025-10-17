import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddToLibraryDto, RemoveFromLibraryDto } from './dto/update-library.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/library')
  getUserLibrary(@Param('id') id: string) {
    return this.usersService.getUserLibrary(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/library/add')
  addToLibrary(@Param('id') id: string, @Body() addToLibraryDto: AddToLibraryDto) {
    return this.usersService.addToLibrary(id, addToLibraryDto);
  }

  @Put(':id/library/remove')
  removeFromLibrary(@Param('id') id: string, @Body() removeFromLibraryDto: RemoveFromLibraryDto) {
    return this.usersService.removeFromLibrary(id, removeFromLibraryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
