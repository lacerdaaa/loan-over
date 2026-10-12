import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

interface OffsetCarrier {
  start_offset?: unknown;
}

interface HorizonCarrier {
  horizon?: unknown;
}

const isOffsetBeyond = (item: OffsetCarrier, horizon: number): boolean =>
  typeof item.start_offset === 'number' && item.start_offset >= horizon;

export function StartOffsetsWithinHorizon(
  defaultHorizon: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'startOffsetsWithinHorizon',
      target: target.constructor,
      propertyName: propertyName as string,
      options: {
        message: 'each start_offset must be lower than the horizon',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (!Array.isArray(value)) return true;
          const { horizon } = args.object as HorizonCarrier;
          const limit = typeof horizon === 'number' ? horizon : defaultHorizon;
          return !(value as OffsetCarrier[]).some((item) => isOffsetBeyond(item, limit));
        },
      },
    });
  };
}
