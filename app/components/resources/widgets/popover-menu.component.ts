import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {PopoverMenu, ResourcesComponent} from '../resources.component';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {RoutingService} from '../../routing-service';
import {Document} from 'idai-components-2/src/model/core/document';


@Component({
    selector: 'popover-menu',
    moduleId: module.id,
    templateUrl: './popover-menu.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class PopoverMenuComponent {

    @Input() document: FieldDocument;
    

    constructor(private resourcesComponent: ResourcesComponent,
                private viewFacade: ViewFacade,
                private routingService: RoutingService) {}


    public getExpandAllGroups = () => this.viewFacade.getExpandAllGroups();

    public toggleExpandAllGroups = () => this.viewFacade.toggleExpandAllGroups();

    public disableExpandAllGroups = () => !this.getExpandAllGroups() || this.toggleExpandAllGroups();

    public isPopoverMenuOpened = (menu?: PopoverMenu): boolean => this.resourcesComponent.isPopoverMenuOpened(menu);

    public closePopover = () => this.resourcesComponent.closePopover();

    public hasThumbnail = (document: FieldDocument): boolean => Document.hasRelations(document, 'isDepictedIn');


    public async jumpToResource(document: FieldDocument) {

        await this.routingService.jumpToResource(document);
        this.resourcesComponent.setScrollTarget(document);
    }
}