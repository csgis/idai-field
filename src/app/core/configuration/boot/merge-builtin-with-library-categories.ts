import {Map} from 'tsfun';
import {clone, jsonClone} from 'tsfun/struct';
import {forEach} from 'tsfun/associative';
import {BuiltinCategoryDefinition} from '../model/builtin-category-definition';
import {LibraryCategoryDefinition} from '../model/library-category-definition';
import {TransientCategoryDefinition} from '../model/transient-category-definition';
import {ConfigurationErrors} from './configuration-errors';
import {mergeFields} from './merge-fields';


export function mergeBuiltInWithLibraryCategories(builtInCategories: Map<BuiltinCategoryDefinition>,
                                                  libraryCategories: Map<LibraryCategoryDefinition>): Map<TransientCategoryDefinition> {

    const categories: Map<TransientCategoryDefinition>
        = clone(builtInCategories) as unknown as Map<TransientCategoryDefinition>;

    forEach(categories, (category, categoryName) => {
        (category as any).categoryName = categoryName;
    });

    forEach(libraryCategories, (libraryCategory, libraryCategoryName) => {
        const extendedBuiltInCategory = builtInCategories[libraryCategory.categoryName];
        if (extendedBuiltInCategory) {
            const newMergedCategory: any = jsonClone(extendedBuiltInCategory);
            merge(newMergedCategory, libraryCategory);
                forEach(libraryCategory.fields, (libraryCategoryField, libraryCategoryFieldName) => {
                    if (extendedBuiltInCategory.fields[libraryCategoryFieldName]
                            && (libraryCategoryField as any)['inputType']) {
                        throw [
                            ConfigurationErrors.MUST_NOT_SET_INPUT_TYPE, libraryCategoryName,
                            libraryCategoryFieldName
                        ];
                    }
            });
            mergeFields(newMergedCategory.fields, libraryCategory.fields);
            categories[libraryCategoryName] = newMergedCategory;
        } else {
            if (!libraryCategory.parent) throw [ConfigurationErrors.MUST_HAVE_PARENT, libraryCategoryName];
            categories[libraryCategoryName] = libraryCategory;
        }
    });

    return categories;
}


function merge(target: any, source: any) {

    for (let sourceFieldName of Object.keys(source)) {
        if (sourceFieldName === 'fields') continue;
        let alreadyPresentInTarget = false;
        for (let targetFieldName of Object.keys(target)) {
            if (targetFieldName === sourceFieldName) alreadyPresentInTarget = true;
        }
        if (!alreadyPresentInTarget) target[sourceFieldName] = source[sourceFieldName];
    }
}
