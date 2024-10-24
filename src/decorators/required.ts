export function Required(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const existingRequired = Reflect.getMetadata("function:required", target, propertyKey) || [];
    existingRequired.push(parameterIndex);
    Reflect.defineMetadata("function:required", existingRequired, target, propertyKey);
}
