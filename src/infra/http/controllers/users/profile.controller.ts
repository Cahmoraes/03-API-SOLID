import { z } from 'zod'
import { Either, EitherType } from '@cahmoraes93/either'
import { SuccessResponse } from '@/infra/http/entities/success-response'
import { FailResponse } from '../../entities/fail-response'
import { AuthenticateUseCase } from '@/application/use-cases/authenticate.usecase'
import { inject } from '@/infra/dependency-inversion/registry'
import { UserDto } from '@/application/dtos/user-dto.factory'
import { FastifyHttpHandlerParams } from '../../servers/fastify/fastify-http-handler-params'

const profileBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type ProfileBodyDto = z.infer<typeof profileBodySchema>
type ProfileControllerOutput = EitherType<
  FailResponse<Error>,
  SuccessResponse<UserDto>
>

export class ProfileController {
  private readonly authenticateUseCase = inject<AuthenticateUseCase>(
    'authenticateUseCase',
  )

  constructor() {
    this.bindMethod()
  }

  private bindMethod() {
    this.handleRequest = this.handleRequest.bind(this)
  }

  public async handleRequest({
    body,
    jwtHandler,
    request,
  }: FastifyHttpHandlerParams): Promise<ProfileControllerOutput> {
    try {
      console.log(request)
      // const user = await jwtHandler.verify()
      // console.log(user.sub)
      const { email, password } = this.parseBodyOrThrow(body)
      return this.authenticateUseCase.execute({ email, password })
    } catch (error: any) {
      return Either.left(FailResponse.internalServerError(error))
    }
  }

  private parseBodyOrThrow(body: unknown): ProfileBodyDto {
    return profileBodySchema.parse(body)
  }
}
