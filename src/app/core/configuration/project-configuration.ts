import {flow, to, on, isNot, empty, is, Pair, Map, includedIn} from 'tsfun';
import {map} from 'tsfun/associative';
import {filter} from 'tsfun/collection';
import {Category} from './model/category';
import {FieldDefinition} from './model/field-definition';
import {RelationDefinition} from './model/relation-definition';
import {Named, namedArrayToNamedMap} from '../util/named';
import {RelationsUtil} from './relations-utils';
import {flattenTree, ITEMNAMEPATH, TreeList} from '../util/tree-list';
import {Name} from '../constants';
import {isTopLevelItemOrChildThereof} from '../util/named-tree-list';
import {ConfigurationErrors} from './boot/configuration-errors';


export type RawProjectConfiguration = Pair<TreeList<Category>, Array<RelationDefinition>>;


/**
 * ProjectConfiguration maintains the current projects properties.
 * Amongst them is the set of categories for the current project,
 * which ProjectConfiguration provides to its clients.
 *
 * Within a project, objects of the available categories can get created,
 * where every name is a configuration of different fields.
 *
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author F.Z.
 */
export class ProjectConfiguration {

    private readonly categoriesArray: Array<Category>;
    private readonly categoryTreelist: TreeList<Category>;
    private readonly relations: Array<RelationDefinition>;

    // internal use only, we deliberately don't provide accessor for this any longer
    // use getCategory, getCategoryTreelist, getCategoriesArray instead
    private readonly categoriesMap: Map<Category>;


    constructor([categories, relations]: RawProjectConfiguration) {

        this.categoryTreelist = categories;
        this.categoriesArray = flattenTree<Category>(categories) || [];
        this.relations = relations || [];
        this.categoriesMap = namedArrayToNamedMap(this.categoriesArray);
    }


    public getAllRelationDefinitions(): Array<RelationDefinition> {

        return this.relations;
    }


    public getCategoriesArray(): Array<Category> {

        return this.categoriesArray;
    }


    /**
     * @return Category, including children field
     */
    public getCategory(category: Name): Category|undefined {

        return this.categoriesMap[category];
    }


    public getCategoryTreelist(...selectedTopLevelCategories: Array<Name>): TreeList<Category> {

        return selectedTopLevelCategories.length === 0
            ? this.categoryTreelist
            : this.categoryTreelist.filter(
                on(ITEMNAMEPATH, includedIn(selectedTopLevelCategories)));
    }


    public getRelationDefinitionsForDomainCategory(categoryName: string): Array<RelationDefinition> {

        return RelationsUtil.getRelationDefinitions(this.relations, categoryName, false);
    }


    public getRelationDefinitionsForRangeCategory(categoryName: string): Array<RelationDefinition> {

        return RelationsUtil.getRelationDefinitions(this.relations, categoryName, true);
    }


    /**
     * Should be used only from within components.
     *
     * @param relationName
     * @returns {string}
     */
    public getRelationDefinitionLabel(relationName: string): string {

        return Category.getLabel(relationName, this.relations);
    }


    /**
     * @returns {boolean} True if the given domain category is a valid domain name for a relation definition
     * which has the given range category & name
     */
    public isAllowedRelationDomainCategory(domainCategoryName: string, rangeCategoryName: string,
                                           relationName: string): boolean {

        const relationDefinitions = this.getRelationDefinitionsForRangeCategory(rangeCategoryName);

        for (let relationDefinition of relationDefinitions) {
            if (relationName === relationDefinition.name
                && relationDefinition.domain.indexOf(domainCategoryName) > -1) return true;
        }

        return false;
    }


    public getAllowedRelationDomainCategories(relationName: string,
                                              rangeCategoryName: string): Array<Category> {

        return this.getCategoriesArray()
            .filter(category => {
                return this.isAllowedRelationDomainCategory(
                    category.name, rangeCategoryName, relationName
                ) && (!category.parentCategory || !this.isAllowedRelationDomainCategory(
                    category.parentCategory.name, rangeCategoryName, relationName
                ));
            });
    }


    public getAllowedRelationRangeCategories(relationName: string,
                                             domainCategoryName: string): Array<Category> {

        return this.getCategoriesArray()
            .filter(category => {
                return this.isAllowedRelationDomainCategory(
                    domainCategoryName, category.name, relationName
                ) && (!category.parentCategory || !this.isAllowedRelationDomainCategory(
                    domainCategoryName, category.parentCategory.name, relationName
                ));
            });
    }


    public getHierarchyParentCategories(categoryName: string): Array<Category> {

        return this.getAllowedRelationRangeCategories('isRecordedIn', categoryName)
            .concat(this.getAllowedRelationRangeCategories('liesWithin', categoryName));
    }


    public isSubcategory(category: Name, superCategoryName: string): boolean {

        if (!this.getCategory(category)) throw [ConfigurationErrors.UNKNOWN_CATEGORY_ERROR, category];
        return isTopLevelItemOrChildThereof(this.categoryTreelist, category, superCategoryName);
    }


    /**
     * @param categoryName
     * @returns {any[]} the fields definitions for the category.
     */
    public getFieldDefinitions(categoryName: string): FieldDefinition[] {

        if (!this.getCategory(categoryName)) return [];
        return Category.getFields(this.getCategory(categoryName));
    }


    public getLabelForCategory(categoryName: string): string {

        const category: Category|undefined = this.getCategory(categoryName);
        if (!category) return '';

        return category.label ?? category.name;
    }


    public getColorForCategory(categoryName: string): string {

        return this.getCategoryColors()[categoryName];
    }


    public getTextColorForCategory(categoryName: string): string {

        return Category.isBrightColor(this.getColorForCategory(categoryName)) ? '#000000' : '#ffffff';
    }


    public getCategoryColors() {

        return map(to(Category.COLOR), this.categoriesMap) as Map<string>;
    }


    public isMandatory(categoryName: string, fieldName: string): boolean {

        return this.hasProperty(categoryName, fieldName, FieldDefinition.MANDATORY);
    }


    /**
     * Gets the label for the field if it is defined.
     * Otherwise it returns the fields definitions name.
     *
     * @param categoryName
     * @param fieldName
     * @returns {string}
     * @throws {string} with an error description in case the category is not defined.
     */
    public getFieldDefinitionLabel(categoryName: string, fieldName: string): string {

        const fieldDefinitions = this.getFieldDefinitions(categoryName);
        if (fieldDefinitions.length === 0) {
            throw 'No category definition found for category \'' + categoryName + '\'';
        }

        return Category.getLabel(fieldName, fieldDefinitions);
    }


    private hasProperty(categoryName: string, fieldName: string, propertyName: string) {

        if (!this.getCategory(categoryName)) return false;

        return flow(
            Category.getFields(this.getCategory(categoryName)),
            filter(on(Named.NAME, is(fieldName))),
            filter(on(propertyName, is(true))),
            isNot(empty));
    }
}
