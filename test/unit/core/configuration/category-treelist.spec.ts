import {
    categoryTreelistToArray,
    categoryTreelistToMap,
    linkParentAndChildInstances
} from '../../../../src/app/core/configuration/category-treelist';
import {accessTreelist, Treelist} from '../../../../src/app/core/util/treelist';


describe('CategoryTreelist', () => {

    type T = { name: string, children: Array<T>, parentCategory?: T};

    it('categoryTreelistToArray', () => {

        const parent = { name: 'P1', children: [] }
        const child = { name: 'C1', parentCategory: parent, children: [] };
        parent.children = [child];

        const t: Treelist<{ name: string, children: Array<T>}> = [
            {
                t: parent,
                trees: [
                        {
                            t: child,
                            trees: []
                        }
                    ]
            }
        ]

        const result = categoryTreelistToArray(t as any);

        expect(result[0].name).toBe('P1');
        expect(result[0].children.length).toBe(1);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[0].children.length).toBe(0);
        expect(result[0].children[0].children).toEqual([]);

        expect(result[1].name).toBe('C1');
        expect(result[1].children.length).toBe(0);
        expect(result[1].children).toEqual([]);

        // retain configured instance relationships
        expect(result[0].children[0] === accessTreelist(t, 0, 0)).toBeTruthy();
        expect(result[1].parentCategory === accessTreelist(t, 0)).toBeTruthy();
        expect(result[1].parentCategory === result[0]).toBeTruthy();
        expect(result[0].children[0].name === 'C1').toBeTruthy();
        expect(result[1].parentCategory.name === 'P1').toBeTruthy();
    });


    it('categoryTreelistToMap', () => {

        const parent = { name: 'P1', children: [] }
        const child = { name: 'C1', parentCategory: parent, children: [] };
        parent.children = [child];

        const t: Treelist<T> = [
            {
                t: parent,
                trees: [
                    {
                        t: child,
                        trees: []
                    }
                ]
            }
        ]

        const result = categoryTreelistToMap(t as any);

        expect(result['P1'].name).toBe('P1');
        expect(result['P1'].children.length).toBe(1);
        expect(result['P1'].children[0].name).toBe('C1');
        expect(result['P1'].children[0].children.length).toBe(0);
        expect(result['P1'].children[0].children).toEqual([]);

        expect(result['C1'].name).toBe('C1');
        expect(result['C1'].children.length).toBe(0);
        expect(result['C1'].children).toEqual([]);

        // retain configured instance relationships
        expect(result['P1'].children[0] === accessTreelist(t, 0, 0)).toBeTruthy();
        expect(result['C1'].parentCategory === accessTreelist(t, 0)).toBeTruthy();
        expect(result['C1'].parentCategory === result['P1']).toBeTruthy();
        expect(result['P1'].children[0].name === 'C1').toBeTruthy();
        expect(result['C1'].parentCategory.name === 'P1').toBeTruthy();
    });


    it('multiple parent items', () => {

        const parent1 = { name: 'P1', children: [] }
        const child1 = { name: 'C1', parentCategory: parent1, children: [] };
        const child2 = { name: 'C2', parentCategory: parent1, children: [] };
        parent1.children = [child1,child2];

        const parent2 = { name: 'P2', children: [] }
        const child3 = { name: 'C3', parentCategory: parent2, children: [] };
        const child4 = { name: 'C4', parentCategory: parent2, children: [] };
        parent2.children = [child3,child4];

        const t = [
            {
                t: parent1,
                trees: [
                    {
                        t: child1,
                        trees: []
                    },
                    {
                        t: child2,
                        trees: []
                    }
                ]
            },
            {
                t: parent2,
                trees: [
                    {
                        t: child3,
                        trees: []
                    },
                    {
                        t: child4,
                        trees: []
                    }
                ]
            }
        ]

        const result = categoryTreelistToArray(t as any);

        expect(result.length).toBe(6);

        expect(result[0].name).toBe('P1');
        expect(result[0].children.length).toBe(2);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[1].name).toBe('C2');
        expect(result[0].children[0].children.length).toBe(0);
        expect(result[0].children[1].children.length).toBe(0);

        expect(result[3].name).toBe('P2');
        expect(result[3].children.length).toBe(2);
        expect(result[3].children[0].name).toBe('C3');
        expect(result[3].children[1].name).toBe('C4');
        expect(result[3].children[0].children.length).toBe(0);
        expect(result[3].children[1].children.length).toBe(0);

        expect(result[1].name).toBe('C1');
        expect(result[1].children.length).toBe(0);
        expect(result[2].name).toBe('C2');
        expect(result[2].children.length).toBe(0);
        expect(result[4].name).toBe('C3');
        expect(result[4].children.length).toBe(0);
        expect(result[5].name).toBe('C4');
        expect(result[4].children.length).toBe(0);
    });


    function threeLevels(): any {

        const parent1 = { name: 'P1' }
        const child1 = { name: 'C1' };
        const child2 = { name: 'C2' };

        return [
            {
                t: parent1,
                trees: [
                    {
                        t: child1,
                        trees: [
                            {
                                t: child2,
                                trees: []
                            }
                        ]
                    }
                ]
            }
        ]
    }


    it('linkParentAndChildInstances', () => {

        const t = threeLevels();
        const result = linkParentAndChildInstances(t);

        expect(accessTreelist(result, 0).children[0] === accessTreelist(result, 0, 0)).toBeTruthy();
        expect(accessTreelist(result, 0, 0).children[0] === accessTreelist(result, 0, 0, 0)).toBeTruthy();
        expect(accessTreelist(result, 0, 0, 0).parentCategory === accessTreelist(result, 0, 0)).toBeTruthy();
        expect(accessTreelist(result, 0, 0).parentCategory === accessTreelist(result, 0)).toBeTruthy();
    });


    it('categoryTreelistToArray - recursive', () => {

        const t = threeLevels();
        const result = categoryTreelistToArray(linkParentAndChildInstances(t));

        expect(result[0].name).toBe('P1');
        expect(result[1].name).toBe('C1');
        expect(result[2].name).toBe('C2');
        expect(result[0].children.length).toBe(1);
        expect(result[0].children[0].name).toBe('C1');
        expect(result[0].children[0].children[0].name).toBe('C2');

        // retain configured instance relationships
        expect(result[0].children[0].children[0].parentCategory === result[0].children[0]).toBeTruthy();
        expect(result[0].children[0].parentCategory === result[0]).toBeTruthy();
        expect(result[0].children[0] === result[1]).toBeTruthy();
        expect(result[0].children[0].children[0] === result[2]).toBeTruthy();
    });


    it('categoryTreelistToMap - recursive', () => {

        const t = threeLevels();
        const result = categoryTreelistToMap(linkParentAndChildInstances(t));

        expect(result['P1'].name).toBe('P1');
        expect(result['C1'].name).toBe('C1');
        expect(result['C2'].name).toBe('C2');
        expect(result['P1'].children.length).toBe(1);
        expect(result['P1'].children[0].name).toBe('C1');
        expect(result['P1'].children[0].children[0].name).toBe('C2');

        // retain configured instance relationships
        expect(result['P1'].children[0].children[0].parentCategory === result['P1'].children[0]).toBeTruthy();
        expect(result['P1'].children[0].parentCategory === result['P1']).toBeTruthy();
        expect(result['P1'].children[0] === result['C1']).toBeTruthy();
        expect(result['P1'].children[0].children[0] === result['C2']).toBeTruthy();
    });
});
