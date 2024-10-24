// Keep the Describe decorator in PascalCase
export function Describe(description: string) {
    return (target: Object, propertyKey: string | symbol) => {
        // Set the description metadata
        Reflect.defineMetadata("function:description", description, target, propertyKey);

        // Infer and set the function name
        Reflect.defineMetadata("function:name", propertyKey.toString(), target, propertyKey);
    };
}
