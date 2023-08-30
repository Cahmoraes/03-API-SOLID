import { provide } from '../registry'
import { InMemoryUsersRepository } from 'tests/repositories/in-memory-users-repository'
import { SuccessResponse } from '@/infra/http/entities/success-response'
import { User } from '../entities/user'
import { PasswordHash } from '@/core/entities/password-hash'
import { GetUserProfileUseCase } from './get-user-profile'

describe('GetUserProfile use case', () => {
  let usersRepository: InMemoryUsersRepository
  let sut: GetUserProfileUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    provide('usersRepository', usersRepository)
    sut = new GetUserProfileUseCase()
  })

  it('should be able to get user by id', async () => {
    const passwordHash = new PasswordHash()
    const name = 'John Doe'
    const email = 'johm@doe.com'
    const password = '123456'

    const { id } = await usersRepository.create({
      name,
      email,
      password_hash: await passwordHash.createHash(password),
    })

    const result = await sut.execute({
      userId: id.toString(),
    })

    expect(result.isRight()).toBe(true)
    const value = result.value as SuccessResponse<User>
    expect(value.data?.email).toBe(email)
    expect(value.data?.name).toBe(name)
  })

  it('should not be able to get user by wrong id', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value.data).toBe('Resource not found')
    expect(result.value.status).toBe(404)
  })
})
