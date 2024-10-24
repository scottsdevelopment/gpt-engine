
export function Parameter(description: string) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams = Reflect.getMetadata("function:parameters", target, propertyKey) || {};
        
        // Temporarily store the description with the parameter index (name will be inferred later)
        existingParams[parameterIndex] = { description };
        
        Reflect.defineMetadata("function:parameters", existingParams, target, propertyKey);
    };
  }