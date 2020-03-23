import {keys, isNot, includedIn, Map} from 'tsfun';
import {assertFieldsAreValid} from '../boot/assert-fields-are-valid';
import {ConfigurationErrors} from '../boot/configuration-errors';
import {BaseFieldDefinition, BaseCategoryDefinition} from './base-category-definition';
import {Valuelists} from './valuelist-definition';

/**
 * CategoryDefinition, as provided by users.
 *
 * @author Daniel de Oliveira
 */
export interface CustomCategoryDefinition extends BaseCategoryDefinition {

    valuelists?: Valuelists,
    commons?: string[];
    color?: string,
    hidden?: string[];
    parent?: string,
    fields: Map<CustomFieldDefinition>;
}


export interface CustomFieldDefinition extends BaseFieldDefinition {

    inputType?: string;
    positionValues?: string;
}

export module CustomFieldDefinition {

    export const INPUTTYPE = 'inputType';
}


const VALID_CATEGORY_PROPERTIES = ['valuelists', 'commons', 'color', 'hidden', 'parent', 'fields'];

const VALID_FIELD_PROPERTIES = ['inputType', 'positionValues'];


export module CustomCategoryDefinition {

    export const VALUELISTS = 'valuelists';

    export function makeAssertIsValid(builtinCategories: string[], libraryCategories: string[]) {

        return function assertIsValid([typeName, category]: [string, CustomCategoryDefinition]) {

            keys(category)
                .filter(isNot(includedIn(VALID_CATEGORY_PROPERTIES)))
                .forEach(key => { throw [ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, key] }); // TODO use pairWith, swap, throws

            if (!builtinCategories.includes(typeName) && !libraryCategories.includes(typeName)) {
                if (!category.parent) {
                    throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'parent', typeName, 'must be set for new categories'];
                }
            } else {
                if (category.parent) {
                    throw [ConfigurationErrors.ILLEGAL_CATEGORY_PROPERTY, 'parent', typeName, 'must not be set if not a new category']
                }
            }

            if (!category.fields) {
                throw [ConfigurationErrors.MISSING_CATEGORY_PROPERTY, 'fields', category];
            }
            assertFieldsAreValid(category.fields, VALID_FIELD_PROPERTIES, 'custom');
        }
    }
}