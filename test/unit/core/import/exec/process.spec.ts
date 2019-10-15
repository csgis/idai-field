import {Document} from 'idai-components-2';
import {ImportErrors as E} from '../../../../../app/core/import/exec/import-errors';
import {build} from '../../../../../app/core/import/exec/process/process';

/**
 * @author Daniel de Oliveira
 */
describe('process()', () => {

    let validator;

    const RECORDED_IN = 'isRecordedIn';
    const LIES_WITHIN = 'liesWithin';
    
    let opTypeNames = ['Trench'];

    const existingTrench = {resource: {type: 'Trench', identifier: 'existingTrench', id: 'et1', relations:{ }}};
    const existingTrench2 = {resource: {type: 'Trench', identifier: 'existingTrench2', id: 'et2', relations:{ }}};
    const existingFeature = {resource: {type: 'Feature', identifier: 'existingFeature', id: 'ef1', relations:{ isRecordedIn: ['et1']}}};
    const existingFeature2 = {resource: {type: 'Feature', identifier: 'existingFeature2', id: 'ef2', relations:{ isRecordedIn: ['et2']}}};


    let generateId = () => { resourceIdCounter++; return '10' + resourceIdCounter.toString() };


    let getInverse = (_: string) => {

        if (_ === 'isAfter') return 'isBefore';
    };


    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'ef1') return existingFeature;
        if (resourceId === 'ef2') return existingFeature2;
        if (resourceId === 'et1') return existingTrench;
        if (resourceId === 'et2') return existingTrench2;
        else throw 'missing';
    };


    let find = async (_: any): Promise<any> => {

        if (_ === 'existingTrench') return existingTrench;
        if (_ === 'existingTrench2') return existingTrench2;
        if (_ === 'existingFeature') return existingFeature;
        if (_ === 'existingFeature2') return existingFeature2;
        return undefined;
    };


    function d(id: string, type: string, identifier: string, rels?: any) {

        const document = { resource: { id: id, identifier: identifier, type: type, relations: {} }};
        if (rels) document.resource['relations'] = rels;
        return document as unknown as Document;
    }


    let resourceIdCounter;
    let process;
    let processWithMainType;
    let processWithPlainIds;
    let processMerge;
    let processMergeOverwriteRelations;


    beforeEach(() => {

        resourceIdCounter = 0;

        validator = jasmine.createSpyObj('validator', [
            'assertIsRecordedInTargetsExist',
            'assertIsWellformed',
            'assertLiesWithinCorrectness',
            'assertRelationsWellformedness',
            'assertIsKnownType',
            'assertHasLiesWithin',
            'assertIsAllowedType',
            'assertIsAllowedRelationDomainType',
            'assertSettingIsRecordedInIsPermissibleForType',
            'assertDropdownRangeComplete',
            'assertIsNotOverviewType',
            'isRecordedInTargetAllowedRelationDomainType',
            'assertNoForbiddenRelations']);

        process = build(validator, opTypeNames, find, get, getInverse,
            false,
            false,
            '');

        processWithMainType = build(validator, opTypeNames, find, get, getInverse,
            false,
            false,
            'et1');

        processWithPlainIds = build(validator, opTypeNames, find, get, getInverse,
            false,
            false,
            '');

        processMerge = build(validator, opTypeNames, find, get, getInverse,
            true,
            false,
            '');

        processMergeOverwriteRelations = build(validator, opTypeNames, find, get, getInverse,
            true,
            true,
            '');
    });


    it('set inverse relation', async done => {

        const result = await process([
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'], isAfter: ['ef1']})
        ]);

        expect(result[1][0].resource.relations['isBefore'][0]).toEqual('nf1');
        done();
    });


    xit('remove self referencing relation target', async done => {

        const result = await process([
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'], isAfter: ['nf1', 'et1']})
        ]);

        expect(result[0][0].resource.relations['isAfter'].length).toEqual(1);
        expect(result[0][0].resource.relations['isAfter'][0]).toEqual('et1');
        done();
    });


    it('child of existing operation', async done => {

        const result = await process([
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'] })
            ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing operation, assign via resource id', async done => {

        const result = await processWithPlainIds([
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['et1'] })
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('child of existing feature', async done => {

        const result = await process([
            d('nf1', 'Feature', 'newFeature', { liesWithin: ['ef1']})
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('ef1');
        done();
    });


    it('import operation', async done => {

        const result = await process([
            d('t', 'Trench', 'zero')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('zero');
        expect(resource.relations[RECORDED_IN]).toBeUndefined();
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature', async done => {

        const result = await process([
            d('tOne', 'Trench', 'one'),
            d('fTwo', 'Feature', 'two', { liesWithin: ['tOne'] })
        ]);

        const resource = result[0][1].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('tOne');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, order reversed', async done => {

        const result = await process([
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nt1', 'Trench', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('two');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import operation including feature, nest deeper', async done => {

        const result = await process([
            d('nt1', 'Trench', 'one'),
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nfi1', 'Find', 'three', { liesWithin: ['nf1'] })
        ]);

        const resource = result[0][2].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('nf1');
        done();
    });


    it('import operation including feature, nest deeper, order reversed', async done => {

        const result = await process([
            d('nfi1', 'Find', 'three', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'two', { liesWithin: ['nt1'] }),
            d('nt1', 'Trench', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.identifier).toBe('three');
        expect(resource.relations[RECORDED_IN][0]).toBe('nt1');
        expect(resource.relations[LIES_WITHIN][0]).toEqual('nf1');
        done();
    });


    it('import feature as child of existing operation', async done => {

        const result = await process([
            d('nf1', 'Feature', 'one', { liesWithin: ['et1'] })
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('import feature as child of existing operation, via operation assignment parameter', async done => {

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one')
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, topmost child of existing operation', async done => {

        const result = await process([
            d('nf1', 'Feature', 'one', { liesWithin: ['et1'] }),
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] })
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        done();
    });


    it('nested resources, topmost child of existing operation, order reversed', async done => {

        const result = await process([
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'one', { liesWithin: ['et1']})
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter', async done => {

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one'),
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] })
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        done();
    });


    it('nested resources, assignment to operation via operation assignment parameter, order reversed', async done => {

        const result = await processWithMainType([
            d('nfi1', 'Find', 'two', { liesWithin: ['nf1'] }),
            d('nf1', 'Feature', 'one')
        ]);

        expect(result[0][0].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][0].resource.relations[LIES_WITHIN][0]).toBe('nf1');
        expect(result[0][1].resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(result[0][1].resource.relations[LIES_WITHIN]).toBeUndefined();
        done();
    });


    it('assignment to existing operation via parameter, also nested in existing', async done => {

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one', { liesWithin: ['ef1']})
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('nf1');
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    // merge mode //////////////////////////////////////////////////////////////////////////////////////////////////////

    it('merge, add field', async done => {

        const result = await processMerge([
            { resource: { type: 'Feature', identifier: 'existingFeature',
                    field: 'new',
                    geometry: { type: 'Point',  coordinates: [ 27.189335972070694, 39.14122423529625]}
            }}
        ]);

        const resource = result[0][0].resource;
        expect(resource.id).toBe('ef1');
        expect(resource.relations[RECORDED_IN][0]).toEqual('et1');
        expect(resource['field']).toEqual('new');
        expect(resource['geometry']).toEqual({ type: 'Point', coordinates: [ 27.189335972070694, 39.14122423529625] });
        done();
    });


    it('merge, overwrite relations', async done => {

        const result = await processMergeOverwriteRelations([
            d('nf1', 'Feature', 'existingFeature', { liesWithin: ['et2'], isAfter: ['ef2']})
        ]);

        expect(result[0][0].resource.relations['isAfter'][0]).toEqual('ef2');
        expect(result[1][0].resource.id).toEqual('ef2');
        expect(result[1][0].resource.relations['isBefore'][0]).toEqual('ef1');
        done();
    });


    it('merge, overwrite relations, reassign parent', async done => {

        const result = await processMergeOverwriteRelations([
            d('nf1', 'Feature', 'existingFeature2', { liesWithin: ['ef1'] })
        ]);

        const resource = result[0][0].resource;
        expect(resource.relations[RECORDED_IN][0]).toBe('et1');
        expect(resource.relations[LIES_WITHIN][0]).toBe('ef1');
        done();
    });


    it('merge, ignore wrong relations when not setting overwrite relations', async done => {

        const result = await processMerge([
            d('nf1', 'Feature', 'existingFeature', { isAfter: 'unknown' })
        ]);

        expect(result[0].length).toBe(1);
        expect(result[2]).toBeUndefined();
        done();
    });


    // err cases ///////////////////////////////////////////////////////////////////////////////////////////////////////

    it('assert lies within correctness', async done => {

        validator.assertLiesWithinCorrectness.and.callFake(() => { throw [E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE]});

        const result = await process([
            d('nfi1', 'Find', 'one', { isChildOf: 'et1'})
        ]);

        expect(result[2][0]).toEqual(E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE);
        done();
    });


    it('assignment to existing feature, via mismatch with operation assignment parameter', async done => {

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one', { liesWithin: ['ef2']})
        ]);

        expect(result[2][0]).toEqual(E.LIES_WITHIN_TARGET_NOT_MATCHES_ON_IS_RECORDED_IN);
        expect(result[2][1]).toEqual('one');
        done();
    });


    it('duplicate identifiers in import file', async done => {

        const result = await process(<any>[
            d('nf1', 'Feature', 'dup', { liesWithin: ['etc1']}),
            d('nf2', 'Feature', 'dup', { liesWithin: ['etc1']}),
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.DUPLICATE_IDENTIFIER);
        expect(error[1]).toEqual('dup');
        done();
    });


    it('duplicate identifiers, resource with such identifier already exists', async done => {

        const result = await process([
            d('nf1', 'Feature', 'existingFeature', { liesWithin: ['et1'] })
        ]);

        const error = result[2];
        expect(error[0]).toEqual(E.RESOURCE_EXISTS);
        expect(error[1]).toEqual('existingFeature');
        done();
    });


    it('clash of assigned main type id with use of parent', async done => {

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one', { liesWithin: ['et1']})
        ]);
        expect(result[2][0]).toEqual(E.PARENT_ASSIGNMENT_TO_OPERATIONS_NOT_ALLOWED);
        done();
    });


    it('missing liesWithin and no operation assigned', async done => {

        validator.assertHasLiesWithin.and.callFake(() => { throw [E.NO_PARENT_ASSIGNED]});

        const result = await process([
            d('nf1', 'Feature', 'one')
        ]);
        expect(result[2][0]).toEqual(E.NO_PARENT_ASSIGNED);
        done();
    });


    it('validation error - not wellformed', async done => {

        validator.assertIsWellformed.and.callFake(() => { throw [E.INVALID_FIELDS, 'invalidField'] });

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one')
        ]);

        expect(result[2][0]).toEqual(E.INVALID_FIELDS);
        expect(result[2][1]).toEqual('invalidField');
        done();
    });


    it('validation error - dropdown not complete', async done => {

        validator.assertDropdownRangeComplete.and.callFake(() => { throw [E.INVALID_DROPDOWN_RANGE_VALUES, 'abc'] });

        const result = await processWithMainType([
            d('nf1', 'Feature', 'one')
        ]);

        expect(result[2][0]).toEqual(E.INVALID_DROPDOWN_RANGE_VALUES);
        expect(result[2][1]).toEqual('abc');
        done();
    })
});