import { SelfDescribingHandleCommand } from "./HandleCommand";
import {
    HandleCommand,
    HandlerContext,
    HandlerResult,
} from "./index";
import { metadataFromInstance } from "./internal/metadata/metadataReading";
import { toStringArray } from "./internal/util/string";
import {
    CommandHandlerMetadata,
    MappedParameterDeclaration,
    Parameter,
    SecretDeclaration,
    Tag,
} from "./metadata/automationMetadata";
import { registerCommand } from "./scan";

export interface ParametersConstructor<P> {

    new(): P;

}

/**
 * Handle the given command. Parameters will have been set on a fresh
 * parameters instance before invocation
 * @param {HandlerContext} ctx context from which GraphQL client can be obtained,
 * messages can be sent etc.
 * @return a Promise of a HandlerResult, containing a status code, or anything else representing
 * success.
 */
export type OnCommand<P = undefined> =
    (ctx: HandlerContext, parameters: P) => Promise<HandlerResult> | Promise<any>;

/**
 * Create a HandleCommand instance with the appropriate metadata wrapping
 * the given function
 * @param h handle function
 * @param {ParametersConstructor<P>} factory to create new parameters instances
 * @param {string} name can be omitted if the function isn't exported
 * @param {string} description
 * @param {string[]} intent
 * @param {Tag[]} tags
 * @return {HandleCommand<P>}
 */
export function commandHandlerFrom<P>(h: OnCommand<P>,
                                      factory: ParametersConstructor<P>,
                                      name: string = h.name,
                                      description: string = name,
                                      intent: string | string[] = [],
                                      tags: string | string[] = []): HandleCommand<P> & CommandHandlerMetadata {
    if (!name) {
        throw new Error(`Cannot derive name from function '${h}': Provide name explicitly`);
    }
    const handler = new FunctionWrappingCommandHandler(name, description, h, factory, tags, intent);
    registerCommand(handler);
    return handler;
}

class FunctionWrappingCommandHandler<P> implements SelfDescribingHandleCommand<P> {

    public parameters: Parameter[];

    // tslint:disable-next-line:variable-name
    public mapped_parameters: MappedParameterDeclaration[];

    public secrets?: SecretDeclaration[];
    public intent?: string[];
    public tags?: Tag[];

    constructor(public name: string,
                public description: string,
                private h: OnCommand<P>,
                private parametersFactory: ParametersConstructor<P>,
                // tslint:disable-next-line:variable-name
                private _tags: string | string[] = [],
                // tslint:disable-next-line:variable-name
                private _intent: string | string[] = []) {
        const newParamInstance = this.freshParametersInstance();
        const md = metadataFromInstance(newParamInstance) as CommandHandlerMetadata;
        this.parameters = md.parameters;
        this.mapped_parameters = md.mapped_parameters;
        this.secrets = md.secrets;
        this.intent = toStringArray(_intent);
        this.tags = toStringArray(_tags).map(t => ({ name: t, description: t}) );
    }

    public freshParametersInstance(): P {
        return new this.parametersFactory();
    }

    public handle(ctx: HandlerContext, params: P) {
       return this.h(ctx, params);
    }
}
