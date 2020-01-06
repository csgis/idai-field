import {ObjectCollection, reduce, dissoc, getOn, isObject, isArray} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export const makeLookup = (path: string) => {

    return <A>(as: Array<A>): ObjectCollection<A> => {

        return reduce((amap: {[_:string]: A}, a: A) => {

            amap[getOn(path)(a)] = a;
            return amap;

        }, {})(as);
    }
};


export function withDissoc(struct: any, path: string) {

   return dissoc(path)(struct);
}


export function startsWith(with_: string) { return (what: string) => what.startsWith(with_)}

export function longerThan(than: string) { return (what: string) => what.length > than.length }

export function includes(it: string) { return (what: string) => what.includes(it) }

export function isEmptyString(a: any) { return typeof a === 'string' && a === '' }

export function isAssociative(a: any) { return isObject(a) || isArray(a) }