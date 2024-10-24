import 'reflect-metadata';

// Define a generic type for the controller class
type MethodArgs = Record<string, any>;

interface ParameterSchema {
    type: string;
    description: string;
}

interface FunctionDefinition {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, ParameterSchema>;
        required: string[];
    };
}

interface Tool {
    _function: (args: MethodArgs) => any;
    type: string;
    function: FunctionDefinition;
}

export function generateAllTools<T extends Record<string, any>>(controller: T): Tool[] {
    // Get all method names from the controller
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
        .filter(method => {
            // Check if the method has the necessary metadata (e.g., @Describe)
            return typeof controller[method] === 'function' &&
                method !== 'constructor' &&
                Reflect.hasMetadata('function:description', controller, method);
        });

    // Generate tools for each decorated method in the controller
    const tools = methodNames.flatMap(methodName => generateToolsArray(controller, methodName));

    return tools;
}

export function generateToolsArray<T extends Record<string, any>>(controller: T, methodName: keyof T): Tool[] {
    const functionName = Reflect.getMetadata("function:name", controller, methodName as string) as string;
    const functionDescription = Reflect.getMetadata("function:description", controller, methodName as string) as string;
    const parametersMetadata = Reflect.getMetadata("function:parameters", controller, methodName as string) as Record<number, { description: string }>;

    // Get the required parameters from metadata
    const requiredParams = Reflect.getMetadata('function:required', controller, methodName as string) || [];

    // console.log(requiredParams);

    // Parse the parameter names from the function signature
    const paramNames = getParamNames(controller[methodName]);

    // Infer the parameter types from TypeScript's metadata
    const paramTypes = inferParamTypes(controller, methodName as string);

    const parameterSchema = {
        type: "object",
        properties: {} as Record<string, { type: string, description: string }>,
        required: [] as string[]
    };

    // Populate the schema properties with inferred names and types, and manually set descriptions
    if (parametersMetadata && paramNames) {
        paramNames.forEach((paramName, index) => {
            parameterSchema.properties[paramName] = {
                type: paramTypes[index], // Inferred type (e.g., 'string', 'number')
                description: parametersMetadata[index]?.description || 'No description provided' // Manually set description
            };
        });
    }

    // Check if the parameter is marked as required
    requiredParams.forEach((requiredParam: number) => {
        if (paramNames[requiredParam]) {
            parameterSchema.required.push(paramNames[requiredParam]);
        }
    });

    const functionDefinition: FunctionDefinition = {
        name: functionName,
        description: functionDescription,
        parameters: parameterSchema
    };

    return [
        {
            _function: (args: MethodArgs) => {
                return controller[methodName](...Object.values(args));
            },
            type: "function",
            function: functionDefinition
        }
    ];
}


// Helper to extract parameter names from function signature
function getParamNames(fn: Function): string[] {
    const fnStr = fn.toString().replace(/[/][/].*$/mg, '').replace(/\s+/g, ''); // strip comments and whitespaces
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    return result || [];
}

// Function to infer the parameter type from TypeScript design metadata
function inferParamTypes(target: Object, propertyKey: string | symbol): string[] {
    const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    return types.map((type: any) => type.name.toLowerCase()); // Infer types as strings (e.g., 'string', 'number')
}
