import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

type NumericBag = Record<string, unknown>;

export function IsAtMostProperty(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isAtMostProperty',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [property],
      options: {
        message: `${String(propertyName)} must not be greater than ${property}`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedName] = args.constraints as [string];
          const related = (args.object as NumericBag)[relatedName];
          if (typeof value !== 'number' || typeof related !== 'number') return true;
          return value <= related;
        },
      },
    });
  };
}
