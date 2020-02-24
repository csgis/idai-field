import {objectReduce} from '../../../../app/core/util/utils';

describe('objectReduce', () => {

    it('objectReduce', () => {

        expect(
            objectReduce((acc, a: any) => acc[a] = a, {})([13, 14])
        ).toEqual({'13': 13, '14': 14});
    });
});