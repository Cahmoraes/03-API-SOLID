import { ValueObject } from '@/core/entities/value-objects/value-object'
import { LatitudeError } from '../errors/latitude.error'
import { LongitudeError } from '../errors/longitude.error'

interface CoordProps {
  latitude: number
  longitude: number
}

export class Coord implements ValueObject {
  private readonly _latitude: number
  private readonly _longitude: number

  constructor(coordProps: CoordProps) {
    this.validateCoords(coordProps)
    this._latitude = coordProps.latitude
    this._longitude = coordProps.longitude
  }

  private validateCoords(coordProps: CoordProps) {
    this.validateLatitude(coordProps.latitude)
    this.validateLongitude(coordProps.longitude)
  }

  private validateLatitude(latitude: number) {
    if (latitude < -90 || latitude > 90) throw new LatitudeError()
  }

  private validateLongitude(longitude: number) {
    if (longitude < -180 || longitude > 180) throw new LongitudeError()
  }

  public get latitude(): number {
    return this._latitude
  }

  public get longitude(): number {
    return this._longitude
  }

  public equals(other: object): boolean {
    if (!(other instanceof Coord)) return false
    return (
      other.latitude === this.latitude && other.longitude === this.longitude
    )
  }
}
