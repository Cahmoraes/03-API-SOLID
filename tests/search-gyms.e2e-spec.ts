import getPort from 'get-port'
import request from 'supertest'
import { FastifyAdapter } from '@/infra/http/servers/fastify/fastify-adapter'
import { provideDependencies } from './utils/provide-dependencies'
import { createAndAuthenticateAdmin } from './utils/create-and-authenticate-admin'
import { FastifyHttpController } from '@/infra/http/controllers/fastify-http-controller'
import { GymsRoutes } from '@/infra/http/controllers/routes/gyms.enum'
import { inject } from '@/infra/dependency-inversion/registry'
import { CacheRepository } from '@/infra/cache/cache-repository'

describe('Search Gyms (e2e)', () => {
  let fastify: FastifyAdapter
  let cacheRepository: CacheRepository

  beforeAll(async () => {
    provideDependencies()
    const port = await getPort()
    fastify = new FastifyAdapter({ port })
    new FastifyHttpController(fastify)
    await fastify.listen()
    cacheRepository = inject<CacheRepository>('cacheRepository')
    cacheRepository.clear()
  })

  afterAll(async () => {
    await fastify.close()
  })

  it('should be able to search gyms by title', async () => {
    const { token } = await createAndAuthenticateAdmin(fastify)

    await request(fastify.server)
      .post(GymsRoutes.GYMS)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Academia TypeScript Gym',
        latitude: -27.0747279,
        longitude: -49.4889672,
        description: 'Fake TypeScript Gym',
        phone: '00-0000-0000',
      })

    await request(fastify.server)
      .post(GymsRoutes.GYMS)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Academia JavaScript Gym',
        latitude: -27.0747279,
        longitude: -49.4889672,
        description: 'Fake JavaScript Gym',
        phone: '00-0000-0000',
      })

    const response = await request(fastify.server)
      .get(GymsRoutes.GYMS_SEARCH)
      .query({
        q: 'Academia JavaScript Gym',
      })
      .set('Authorization', `Bearer ${token}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toBeInstanceOf(Array)
    expect(response.body).toHaveLength(1)
  })

  it('should be able to return cache gyms details by title on subsequent calls', async () => {
    const { token } = await createAndAuthenticateAdmin(fastify)

    const response = await request(fastify.server)
      .get(GymsRoutes.GYMS_SEARCH)
      .query({
        q: 'Academia JavaScript Gym',
      })
      .set('Authorization', `Bearer ${token}`)
      .send()

    await request(fastify.server)
      .get(GymsRoutes.GYMS_SEARCH)
      .query({
        q: 'Academia JavaScript Gym',
      })
      .set('Authorization', `Bearer ${token}`)
      .send()

    await request(fastify.server)
      .get(GymsRoutes.GYMS_SEARCH)
      .query({
        q: 'Academia JavaScript Gym',
      })
      .set('Authorization', `Bearer ${token}`)
      .send()

    const cached = await cacheRepository.get(
      `gyms:${'Academia JavaScript Gym'}${1}:details`,
    )

    expect(JSON.parse(cached!)).toEqual([
      expect.objectContaining({
        id: response.body[0].id,
        title: response.body[0].title,
        description: response.body[0].description,
        phone: response.body[0].phone,
      }),
    ])
    expect(response.statusCode).toBe(200)
  })
})
