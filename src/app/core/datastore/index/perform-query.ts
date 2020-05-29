import {keys} from 'tsfun';
import {ConstraintIndex} from './constraint-index';
import {FulltextIndex} from './fulltext-index';
import {ResultSets} from './result-sets';
import {Resource} from 'idai-components-2';
import {Query} from '../model/query';
import {Constraint} from '../model/constraint';


/**
 * @author Daniel de Oliveira
 *
 * Runtime info: Skips the fulltime query if query is empty and constraint search delivered results
 */
export function performQuery(query: Query,
                             constraintIndex: ConstraintIndex,
                             fulltextIndex: FulltextIndex)
    : Array<Resource.Id> {

    let resultSets = performConstraints(
        constraintIndex,
        query.constraints ? query.constraints : {});

    resultSets = ResultSets.containsOnlyEmptyAddSets(resultSets)
        || (Query.isEmpty(query) && !ResultSets.isEmpty(resultSets))
            ? resultSets
            : performFulltext(fulltextIndex, query, resultSets);

    return ResultSets.collapse(resultSets);
}


function performFulltext(fulltextIndex: FulltextIndex,
                         query: Query,
                         resultSets: ResultSets)
    : ResultSets {

    const q = !query.q || query.q.trim() === '' ? '*' : query.q;

    const queryResult = FulltextIndex.get(fulltextIndex, q, query.categories);
    ResultSets.combine(resultSets, queryResult);
    return resultSets;
}


function performConstraints(constraintIndex: ConstraintIndex,
                            constraints: { [name: string]: Constraint|string|string[] })
    : ResultSets {

    return keys(constraints)
        .reduce((resultSets, name: string) => {

            const { subtract, value, searchRecursively } = Constraint.convert(constraints[name]);

            const get = !searchRecursively
                ? ConstraintIndex.get
                : ConstraintIndex.getWithDescendants;

            const indexItemIds = get(constraintIndex, name, value); // TODO review if deduplication necessary here
            ResultSets.combine(resultSets, indexItemIds, subtract);
            return resultSets;
        }, ResultSets.make());
}
