import { Test, TestingModule } from '@nestjs/testing';
import { ClientUserController } from './client-user.controller';
import { ClientUserService } from './client-user.service';

describe('ClientUserController', () => {
  let controller: ClientUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientUserController],
      providers: [
        { provide: ClientUserService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ClientUserController>(ClientUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
