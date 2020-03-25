import {FieldResource} from 'idai-components-2';
import {Groups} from '../../../../../app/core/configuration/model/group';
import {FieldDefinition} from '../../../../../app/core/configuration/model/field-definition';
import InputType = FieldDefinition.InputType;
import {Category} from '../../../../../app/core/configuration/model/category';
import {makeCategoriesMap} from '../../../../../app/core/configuration/boot/make-categories-map';
import {byName} from '../../../../../app/core/util/named';


/**
 * @author Daniel de Oliveira
 */
describe('makeCategoriesMap', () => {

   it('makeCategoriesMap', () => {

      const A = 'A';
      const P = 'P';

      const confDef = { A: {
            name: A,
            parent: P,
            description: { 'de': '' },
            fields: [{ name: 'a', inputType: InputType.INPUT }]
         }, P: {
            name: P,
            description: { 'de': '' },
            fields: [{ name: 'p', inputType: InputType.INPUT }]
         }
      };

      const categoriesMap = makeCategoriesMap(confDef);

      expect(categoriesMap[P].name).toEqual(P);
      expect(categoriesMap[P].children[0].name).toEqual(A);
      expect(Category.getFields(categoriesMap[P].children[0]).length).toBe(2);
      expect(categoriesMap[P].children[0].parentCategory.name).toBe(categoriesMap[P].name);
      expect(categoriesMap[A].name).toEqual(A);
      expect(categoriesMap[A].parentCategory.name).toBe(categoriesMap[P].name);

      const sortedFields = Category.getFields(categoriesMap[A]).sort(byName);

      expect(sortedFields[0].group).toBe(Groups.CHILD);
      expect(sortedFields[1].group).toBe(Groups.PARENT);
      expect(Category.getFields(categoriesMap[P])[0].group).toBe(Groups.PARENT);
   });


   it('sortFields', () => {

      const T = 'T';

      const confDef = { T: {
            name: T,
            description: { 'de': '' },
            fields: [
                 {
                    name: FieldResource.SHORTDESCRIPTION,
                    inputType: InputType.INPUT,
                    group: Groups.STEM
                 },
                {
                   name: FieldResource.IDENTIFIER,
                   inputType: InputType.INPUT,
                   group: Groups.STEM
                }
             ]
         }};

      const categoriesMap = makeCategoriesMap(confDef);

      expect(categoriesMap[T].groups[0].fields[0].name).toEqual(FieldResource.IDENTIFIER);
      expect(categoriesMap[T].groups[0].fields[1].name).toEqual(FieldResource.SHORTDESCRIPTION);
   });
});