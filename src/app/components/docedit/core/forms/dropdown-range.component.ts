import {Component, Input} from '@angular/core';
import {isUndefinedOrEmpty} from 'tsfun';
import {Resource, OptionalRange} from 'idai-components-2';
import {ValuelistUtil} from '../../../../core/util/valuelist-util';
import {HierarchyUtil} from '../../../../core/util/hierarchy-util';
import {DocumentReadDatastore} from '../../../../core/datastore/document-read-datastore';
import {ValuelistDefinition} from '../../../../core/configuration/model/valuelist-definition';

const PROJECT = 'project';

@Component({
    selector: 'dai-dropdown-range',
    templateUrl: './dropdown-range.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DropdownRangeComponent {

    @Input() resource: Resource;
    @Input() field: any;

    public valuelist: ValuelistDefinition;

    private endActivated: boolean = false;


    constructor(private datastore: DocumentReadDatastore) {}


    public getValues = () => this.valuelist ? ValuelistUtil.getOrderedValues(this.valuelist) : [];

    public getLabel = (valueId: string) => ValuelistUtil.getValueLabel(this.valuelist, valueId);

    public activateEnd = () => this.endActivated = true;


    async ngOnChanges() {

        this.valuelist = ValuelistUtil.getValuelist(
            this.field,
            await this.datastore.get(PROJECT),
            await HierarchyUtil.getParent(this.resource, this.datastore)
        );
    }


    public showEndElements(): boolean {

        return this.endActivated
            || (this.resource[this.field.name]
                && !isUndefinedOrEmpty(this.resource[this.field.name][OptionalRange.ENDVALUE]));
    }


    public setValue(value: string) {

        if (isUndefinedOrEmpty(value)) {
            this.endActivated = false;
            delete this.resource[this.field.name];
        } else {
            if (!this.resource[this.field.name]) this.resource[this.field.name] = {};
            this.resource[this.field.name][OptionalRange.VALUE] = value;
        }
    }


    public setEndValue(value: string) {

        if (isUndefinedOrEmpty(value)) {
            this.endActivated = false;
            delete this.resource[this.field.name][OptionalRange.ENDVALUE]
        } else {
            this.resource[this.field.name][OptionalRange.ENDVALUE] = value;
        }
    }
}
