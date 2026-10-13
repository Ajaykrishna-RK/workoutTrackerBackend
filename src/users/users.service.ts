import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {


  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });


      if (existingUser) {
        throw new ConflictException(
          'User with this email already exists',
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

      const user = this.userRepository.create({ ...createUserDto, password: hashedPassword })
      const savedUser = await this.userRepository.save(user)
      const { password: _, ...result } = savedUser

      return {
        message: "user created successfully",
        user: result
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

    }

  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
